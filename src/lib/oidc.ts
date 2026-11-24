/**
 * Admin console single sign-on: OpenID Connect authorization code flow with PKCE, as a public
 * browser client. Works with any provider (Keycloak, Auth0, Entra, Google). The server verifies the
 * resulting access token; nothing here is trusted for authorisation.
 */
const ISSUER = (process.env.NEXT_PUBLIC_OIDC_ISSUER ?? "").replace(/\/$/, "");
const CLIENT_ID = process.env.NEXT_PUBLIC_OIDC_CLIENT_ID ?? "classapp-admin-console";
const SCOPE = process.env.NEXT_PUBLIC_OIDC_SCOPE ?? "openid profile";
const AUDIENCE = process.env.NEXT_PUBLIC_OIDC_AUDIENCE ?? "";
const PENDING = "classapp.oidc.pending";

export const ssoEnabled = ISSUER !== "";

type Discovery = { authorization_endpoint: string; token_endpoint: string };

function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

async function discover(): Promise<Discovery> {
  const res = await fetch(`${ISSUER}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error("The sign-in provider could not be reached.");
  return res.json();
}

function redirectUri() {
  return `${window.location.origin}/admin/callback`;
}

export async function startSso(): Promise<void> {
  const config = await discover();
  const verifier = randomString();
  const state = randomString();
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  sessionStorage.setItem(PENDING, JSON.stringify({ verifier, state }));
  const url = new URL(config.authorization_endpoint);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    ...(AUDIENCE ? { audience: AUDIENCE } : {}),
  }).toString();
  window.location.assign(url.toString());
}

/** Completes the redirect back from the provider; returns the access token. */
export async function finishSso(params: URLSearchParams): Promise<string> {
  const raw = sessionStorage.getItem(PENDING);
  sessionStorage.removeItem(PENDING);
  if (params.get("error")) throw new Error(params.get("error_description") ?? "Sign-in was cancelled.");
  const pending = raw ? (JSON.parse(raw) as { verifier: string; state: string }) : null;
  const code = params.get("code");
  if (!pending || !code || params.get("state") !== pending.state) {
    throw new Error("This sign-in response doesn't match a sign-in started here. Try again.");
  }
  const config = await discover();
  const res = await fetch(config.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: pending.verifier,
      redirect_uri: redirectUri(),
      client_id: CLIENT_ID,
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.access_token) throw new Error("The sign-in provider didn't issue a token. Try again.");
  return body.access_token as string;
}
