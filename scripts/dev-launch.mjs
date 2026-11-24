// Local demo: one "Demo School" on the dev server, plus fresh join links for a teacher and three
// students. The first run enrols the school and saves its keys to .demo-school.local.json
// (git-ignored, one entry per server URL); later runs reuse it, so the database does not fill up.
//   npm run dev:launch [meetingUrl]        reuse (or create) the Demo School
//   npm run dev:launch --new [meetingUrl]  enrol a fresh Demo School and save it instead
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EncryptJWT, base64url } from "jose";

const API = process.env.API_URL ?? "http://localhost:8000";
const WEB = process.env.WEB_URL ?? "http://localhost:3000";
const ADMIN_KEY = process.env.CLASSAPP_ADMIN_API_KEY ?? "dev-admin-key";
const STORE = fileURLToPath(new URL("../.demo-school.local.json", import.meta.url));

const args = process.argv.slice(2);
const fresh = args.includes("--new");
const meetingUrl = args.find((a) => !a.startsWith("--")) ?? "https://meet.google.com/abc-defg-hij";
const admin = { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY };

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Saved Demo Schools by server URL (an older single-school file is read as one entry). */
function readStore() {
  try {
    const data = JSON.parse(readFileSync(STORE, "utf8"));
    return data.api ? { [data.api]: data } : data;
  } catch {
    return {};
  }
}

/** The saved Demo School for this server, if it still exists there. */
async function savedSchool() {
  const saved = readStore()[API];
  if (!saved) return null;
  const res = await fetch(`${API}/admin/tenants/${saved.id}`, { headers: admin }).catch(() => null);
  if (!res) fail(`The server at ${API} is unreachable. Is it running?`);
  return res.ok ? saved : null; // gone (e.g. the database was reset): enrol a new one
}

async function enrolSchool() {
  const res = await fetch(`${API}/admin/tenants`, {
    method: "POST",
    headers: admin,
    body: JSON.stringify({
      name: "Demo School",
      slug: `demo-school-${Math.random().toString(36).slice(2, 6)}`,
      contactEmail: "it@demo-school.example",
      chatSupportUrl: "https://example.com/support",
      branding: { primaryColor: "#2563eb" },
    }),
  }).catch(() => null);
  if (!res) fail(`The server at ${API} is unreachable. Is it running?`);
  if (!res.ok) fail(`Could not enrol the Demo School at ${API} (${res.status}): ${await res.text()}`);
  const t = await res.json();
  // The keys are shown once by the server, so keep them for the next run. Local file, git-ignored.
  const school = { api: API, id: t.id, name: t.name, slug: t.slug, launchKey: t.launchKey, apiKey: t.apiKey, webhookSecret: t.webhookSecret };
  writeFileSync(STORE, JSON.stringify({ ...readStore(), [API]: school }, null, 2) + "\n", { mode: 0o600 });
  return school;
}

const existing = fresh ? null : await savedSchool();
const school = existing ?? (await enrolSchool());
const key = base64url.decode(school.launchKey);
const sessionId = `grade8-science-${Date.now()}`;

async function link(role, participantId, name) {
  const token = await new EncryptJWT({ meetingUrl, role, name, meetingTitle: "Grade 8 Science", sessionId, participantId })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM", kid: school.id })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime("10m")
    .encrypt(key);
  return `${WEB}/join#token=${token}`;
}

console.log(`\n${existing ? "Reusing" : "Enrolled"} tenant ${school.name} (${school.id}), slug ${school.slug}`);
console.log(`Admin console: ${WEB}/admin?tenant=${school.id}`);
console.log(`Pull API key: ${school.apiKey}\n`);
console.log("Teacher (host):\n" + (await link("host", "teacher-1", "Ms. Sharma")) + "\n");
for (const [id, name] of [["stu-1", "Riya"], ["stu-2", "Kabir"], ["stu-3", "Meera"]]) {
  console.log(`Student ${name}:\n` + (await link("attendee", id, name)) + "\n");
}
console.log("Each link works once and expires in 10 minutes. Run again for fresh links.");
