// DEVELOPMENT-ONLY OpenID Connect provider for testing admin single sign-on locally, without
// Keycloak or Docker. Authorization code + PKCE, RS256 access tokens, a JWKS endpoint. It signs
// in whoever you pick on its page: never expose it beyond localhost, never use it in production.
//   npm run dev:idp        (http://localhost:9400; the dev server is preconfigured to trust it)
import crypto from "node:crypto";
import http from "node:http";
import { SignJWT, exportJWK, generateKeyPair } from "jose";

const PORT = Number(process.env.DEV_IDP_PORT ?? 9400);
const ISSUER = `http://localhost:${PORT}`;
const AUDIENCE = "classapp-admin";
const { privateKey, publicKey } = await generateKeyPair("RS256");
const kid = crypto.randomUUID();
const jwk = { ...(await exportJWK(publicKey)), kid, alg: "RS256", use: "sig" };
const codes = new Map();

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const b64url = (buf) => Buffer.from(buf).toString("base64url");
const isLocal = (uri) => {
  try {
    const u = new URL(uri);
    return u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
  } catch {
    return false;
  }
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

async function readForm(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return new URLSearchParams(raw);
}

function signInPage(q) {
  const hidden = ["client_id", "redirect_uri", "state", "code_challenge", "code_challenge_method", "scope"]
    .map((k) => `<input type="hidden" name="${k}" value="${esc(q.get(k))}">`)
    .join("");
  const account = (label, detail, fields) =>
    `<form method="post" action="/authorize">${hidden}${fields}
      <button><b>${label}</b><span>${detail}</span></button></form>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Dev sign-in</title>
<style>body{font:15px system-ui;background:#f1f5f9;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0}
main{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:24px;max-width:440px;width:100%}
p.w{background:#fef3c7;color:#92400e;border-radius:8px;padding:8px 10px;font-size:13px}
button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;margin:8px 0;padding:12px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;cursor:pointer;font:inherit}
button:hover{background:#f8fafc}span{color:#64748b;font-size:13px}input[type=text]{width:100%;box-sizing:border-box;padding:9px;border:1px solid #e2e8f0;border-radius:8px;font:inherit;margin-top:4px}</style>
</head><body><main><h2 style="margin:0 0 6px">Development sign-in</h2>
<p class="w">Local test identity provider. Pick who to sign in as; no password.</p>
${account("Platform admin", "ops@dev.local · role platform_admin", '<input type="hidden" name="as" value="platform">')}
${account("Tenant admin", "admin@school.local · role tenant_admin for the tenant id entered above",
  '<input type="hidden" name="as" value="tenant"><input type="text" name="tenant_id" placeholder="Tenant id (UUID)" required>')}
${account("Teacher (no admin role)", "teacher@school.local · should be refused", '<input type="hidden" name="as" value="none">')}
</main></body></html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, ISSUER);
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" };

  if (url.pathname === "/.well-known/openid-configuration") {
    return send(res, 200, {
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/authorize`,
      token_endpoint: `${ISSUER}/token`,
      jwks_uri: `${ISSUER}/jwks`,
      response_types_supported: ["code"],
      code_challenge_methods_supported: ["S256"],
      id_token_signing_alg_values_supported: ["RS256"],
    }, cors);
  }
  if (url.pathname === "/jwks") return send(res, 200, { keys: [jwk] }, cors);

  if (url.pathname === "/authorize" && req.method === "GET") {
    const q = url.searchParams;
    if (q.get("response_type") !== "code" || q.get("code_challenge_method") !== "S256" || !isLocal(q.get("redirect_uri"))) {
      return send(res, 400, { error: "invalid_request", error_description: "code + S256 + a localhost redirect_uri required" });
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(signInPage(q));
  }

  if (url.pathname === "/authorize" && req.method === "POST") {
    const f = await readForm(req);
    const redirect = f.get("redirect_uri");
    if (!isLocal(redirect)) return send(res, 400, { error: "invalid_request" });
    const as = f.get("as");
    const claims =
      as === "platform" ? { sub: "ops@dev.local", name: "Platform Ops", roles: ["platform_admin"] }
      : as === "tenant" ? { sub: "admin@school.local", name: "School Admin", roles: ["tenant_admin"], tenant_id: f.get("tenant_id") }
      : { sub: "teacher@school.local", name: "A Teacher", roles: ["teacher"] };
    const code = b64url(crypto.randomBytes(24));
    codes.set(code, { claims, challenge: f.get("code_challenge"), redirect, clientId: f.get("client_id"), expires: Date.now() + 60_000 });
    const target = new URL(redirect);
    target.searchParams.set("code", code);
    if (f.get("state")) target.searchParams.set("state", f.get("state"));
    res.writeHead(302, { Location: target.toString() });
    return res.end();
  }

  if (url.pathname === "/token" && req.method === "OPTIONS") {
    res.writeHead(204, { ...cors, "Access-Control-Allow-Methods": "POST" });
    return res.end();
  }
  if (url.pathname === "/token" && req.method === "POST") {
    const f = await readForm(req);
    const entry = codes.get(f.get("code"));
    codes.delete(f.get("code"));
    const verifier = f.get("code_verifier") ?? "";
    const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
    if (!entry || entry.expires < Date.now() || entry.challenge !== challenge || entry.redirect !== f.get("redirect_uri")) {
      return send(res, 400, { error: "invalid_grant" }, cors);
    }
    const sign = (aud) =>
      new SignJWT({ ...entry.claims })
        .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
        .setIssuer(ISSUER)
        .setAudience(aud)
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(privateKey);
    return send(res, 200, {
      access_token: await sign(AUDIENCE),
      id_token: await sign(entry.clientId ?? "client"),
      token_type: "Bearer",
      expires_in: 3600,
    }, cors);
  }
  send(res, 404, { error: "not_found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Development identity provider on ${ISSUER} (issuer), audience "${AUDIENCE}". Localhost only.`);
});
