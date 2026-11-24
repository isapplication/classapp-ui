# class-app web

Next.js 16 (App Router, TypeScript, Tailwind 4). The participant-facing side of class-app: the
entry page a class link opens, the student's on-device analytics panel, and the teacher's live
class view. Design and decisions: [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Run locally

Start the server first (no Docker needed):

```bash
cd ../server && mvn spring-boot:test-run
```

Then the web app:

```bash
npm install
npm run dev
```

Create a demo tenant and get ready-to-click join links for a teacher and three students:

```bash
npm run dev:launch
```

Each link works once and expires in 10 minutes. Open the teacher link in one window and a
student link in another (a private window, or another browser profile, for a second camera).

## Admin console — `/admin`

For platform admins (every tenant, enrolment) and each school's own tenant admin (their tenant
only): branding with a live preview, contact, chat support, webhook, retention and the
focus-score switch; key rotation (launch key, webhook secret, API key — each shown once); and the
audit log of who changed what.

Sign in with **SSO** (any OpenID Connect provider, authorization code + PKCE) or, for set-up and
development, the **admin key** (`dev-admin-key` on the dev server).

To try SSO locally, start the development identity provider — the dev server already trusts it:

```bash
npm run dev:idp
```

It offers three accounts: a platform admin, a tenant admin (enter the tenant id), and a teacher
with no admin role. It is for local testing only.

For a real provider, register `<web origin>/admin/callback` as a redirect URI for a public client,
set the `NEXT_PUBLIC_OIDC_*` variables below, and point the server's `CLASSAPP_OIDC_*` at the same
provider.

## How a class link works

1. The tenant's system sends `https://<web>/join#token=<launch token>`. The token sits in the URL
   fragment, so it is never sent to any web server or written to logs; the page removes it from
   the address bar as soon as it has read it.
2. The page redeems the token with the server (`POST /api/launch`) behind a "Preparing your
   class" gate. A used, expired or invalid link gets a clear message instead.
3. A consent page in the tenant's branding shows the class title and the person's name. "Join
   with analytics" or "Join without analytics" both open the meeting in a new window.
4. **Students** get a narrow panel to keep beside the meeting: on-device analysis (MediaPipe face
   landmarks + Web Audio) sends only derived signals, on change, plus a heartbeat every minute.
   Closing the window reports the leave reason.
5. **The host** gets the live class roster (server-sent events via fetch streaming) and can end
   the class.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 with `.env.dev` (copies MediaPipe's WebAssembly into `public/` first) |
| `npm run build` / `npm run build:prod` | Production build with `.env.prod` |
| `npm run build:uat` | UAT build with `.env.uat` |
| `npm run start` | Serve the last build |
| `npm run lint` / `npm run typecheck` | ESLint (incl. React Compiler rules) / TypeScript |
| `npm run dev:launch [meetingUrl]` | Enrol a demo tenant on the dev server and print join links |
| `npm run dev:idp` | Development OpenID Connect provider on http://localhost:9400 (local SSO testing only) |

## Configuration

Every variable the web app and its dev scripts read is listed, with what it does, in [`.env.example`](.env.example).


| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | The class-app server. The server's `CLASSAPP_CORS_ORIGINS` must include this app's origin. |
| `NEXT_PUBLIC_OIDC_ISSUER` | dev: `http://localhost:9400` | SSO provider for the admin console; empty offers only the admin key |
| `NEXT_PUBLIC_OIDC_CLIENT_ID` | `classapp-admin-console` | Public client id registered with the provider |
| `NEXT_PUBLIC_OIDC_SCOPE` | `openid profile` | Requested scopes |
| `NEXT_PUBLIC_OIDC_AUDIENCE` | none | Extra `audience` parameter (Auth0) |
| `NEXT_PUBLIC_OIDC_ROLES_CLAIM` / `NEXT_PUBLIC_OIDC_TENANT_CLAIM` | `roles` / `tenant_id` | Match the server's claim settings; used only to route the UI — the server decides access |

Values per environment live in `.env.dev`, `.env.uat` and `.env.prod` (public values only — they are
built into the pages, so build once per environment). Real environment variables win over the
file. `scripts/with-env.mjs` loads the file (Node's `--env-file` can't be used: Next.js passes it on
to its build workers). Per-machine overrides: `.env.<env>.local` (git-ignored).

## Notes

- MediaPipe's WebAssembly is served from this app; the face model is fetched from Google's model
  storage at runtime.
- With the Class Analytics extension installed, `/join` hands the class to it: the panel opens in
  the browser's side panel and this tab becomes the meeting (see `../extension`). Without it, this
  page is the panel and the meeting opens in a new window. `src/components/device-panel.tsx`,
  `host-live.tsx`, `ui.tsx` and `src/lib/capture.ts`, `api.ts` are shared with the extension, so
  they use relative imports.
- The admin session is kept in `sessionStorage` (cleared when the tab closes); an expired or
  revoked sign-in returns you to the sign-in page.
