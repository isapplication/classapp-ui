import { ApiError, getApiUrl } from "./api";
import { clearSession, type AdminSession } from "./admin-session";
import type { Branding } from "./types";

export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  webhookConfigured: boolean;
  createdAt: string;
  suspended: boolean;
};

export type TenantView = {
  id: string;
  name: string;
  slug: string;
  branding: Branding;
  contactEmail: string | null;
  chatSupportUrl: string | null;
  webhookUrl: string | null;
  focusScoreEnabled: boolean;
  retentionDays: number;
  createdAt: string;
  suspendedAt: string | null;
};

/** Create and update body. The server replaces every setting on update. */
export type TenantRequest = {
  name: string;
  slug: string;
  contactEmail?: string;
  chatSupportUrl?: string;
  webhookUrl?: string;
  branding?: Branding;
  focusScoreEnabled?: boolean;
  retentionDays?: number;
};

export type CreatedTenant = { id: string; name: string; slug: string; launchKey: string; webhookSecret: string; apiKey: string };

export type AuditEntry = { actor: string; action: string; detail: { fields?: string[]; slug?: string }; at: string };

export type SecretKind = "api-key" | "launch-key" | "webhook-secret";

export type Stats = {
  tenants: number;
  suspended: number;
  liveSessions: number;
  onlineParticipants: number;
  sessionsToday: number;
  failedDeliveries: number;
};

export type ClassRow = {
  id: string;
  tenantId: string;
  tenantName: string;
  externalId: string;
  title: string | null;
  provider: "zoom" | "teams" | "meet";
  startedAt: string;
  endedAt: string | null;
  participants: number;
  online: number;
  camerasOn: number;
};

export type AdminAction = {
  actor: string;
  action: string;
  tenantId: string | null;
  tenantName: string | null;
  detail: Record<string, unknown>;
  at: string;
};

export type ClassParticipant = {
  id: string;
  externalId: string;
  role: "host" | "attendee";
  name: string | null;
  consent: string;
  joinedAt: string;
  lastSeenAt: string;
  leftAt: string | null;
  leftReason: string | null;
  speakingSeconds: number;
  signals: Record<string, unknown> | null;
};

export type ClassEvent = {
  seq: number;
  type: string;
  capturedAt: string;
  participantId: string | null;
  participantName: string | null;
  payload: Record<string, unknown>;
};

export type Delivery = {
  id: number;
  tenantId: string;
  tenantName: string;
  eventType: string;
  attempts: number;
  lastError: string | null;
  dead: boolean;
  nextAttemptAt: string;
  createdAt: string;
  deliveredAt: string | null;
};

export type AccessEntry = { actor: string; action: string; sessionId: string | null; detail: Record<string, unknown>; at: string };

export type LoginResult = { token: string; expiresAt: string; username: string; role: string };

export type TenantUser = {
  id: string;
  email: string;
  invitedAt: string;
  invitedBy: string;
  acceptedAt: string | null;
};

export type InviteResult = { inviteUrl: string; email: string; expiresAt: string };
export type TenantLoginResult = { token: string; expiresAt: string; email: string; tenantId: string; tenantName: string };

export function authHeaders(session: AdminSession): Record<string, string> {
  return session.kind === "key" ? { "X-Admin-Key": session.key } : { Authorization: `Bearer ${session.token}` };
}

async function send<T>(path: string, init: RequestInit, headers: Record<string, string>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}${path}`, { ...init, headers: { "Content-Type": "application/json", ...headers }, cache: "no-store" });
  } catch {
    throw new ApiError(0, "unreachable", "Can't reach the class-app server.");
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error ?? `http_${res.status}`, body?.message ?? "Request failed.");
  return body as T;
}

/** Platform super-admin sign-in with the username and password from the server's environment. */
export function login(username: string, password: string) {
  return send<LoginResult>("/admin/login", { method: "POST", body: JSON.stringify({ username, password }) }, {});
}

/** Revokes a platform sign-in on the server; the caller clears the local session. */
export function logout(session: AdminSession) {
  if (session.kind !== "password") return Promise.resolve(null);
  return send<null>("/admin/logout", { method: "POST" }, authHeaders(session)).catch(() => null);
}

async function call<T>(session: AdminSession, path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...authHeaders(session) };
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, "unreachable", "Can't reach the class-app server.");
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.status === 401) clearSession(); // expired or revoked: back to sign-in
  if (!res.ok) throw new ApiError(res.status, body?.error ?? `http_${res.status}`, body?.message ?? "Request failed.");
  return body as T;
}

export const adminApi = {
  listTenants: (s: AdminSession) => call<{ tenants: TenantSummary[] }>(s, "/admin/tenants"),
  createTenant: (s: AdminSession, body: TenantRequest) =>
    call<CreatedTenant>(s, "/admin/tenants", { method: "POST", body: JSON.stringify(body) }),
  getTenant: (s: AdminSession, id: string) => call<TenantView>(s, `/admin/tenants/${id}`),
  updateTenant: (s: AdminSession, id: string, body: TenantRequest) =>
    call<TenantView>(s, `/admin/tenants/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  rotate: (s: AdminSession, id: string, kind: SecretKind) =>
    call<Record<string, string>>(s, `/admin/tenants/${id}/${kind}`, { method: "POST" }),
  audit: (s: AdminSession, id: string) => call<{ entries: AuditEntry[] }>(s, `/admin/tenants/${id}/audit`),

  // Platform-wide (platform admins)
  overview: (s: AdminSession) => call<{ stats: Stats; live: ClassRow[]; recentActions: AdminAction[] }>(s, "/admin/overview"),
  classes: (s: AdminSession, q: { status?: string; tenant?: string; q?: string; offset?: number } = {}) =>
    call<{ sessions: ClassRow[]; more: boolean }>(s, `/admin/sessions?${query({ limit: 50, ...q })}`),
  platformAudit: (s: AdminSession) => call<{ actions: AdminAction[] }>(s, "/admin/audit?limit=200"),
  failedWebhooks: (s: AdminSession) => call<{ deliveries: Delivery[] }>(s, "/admin/webhooks/failed"),
  suspend: (s: AdminSession, id: string) => call<TenantView>(s, `/admin/tenants/${id}/suspend`, { method: "POST" }),
  resume: (s: AdminSession, id: string) => call<TenantView>(s, `/admin/tenants/${id}/resume`, { method: "POST" }),
  deleteTenant: (s: AdminSession, id: string, confirmSlug: string) =>
    call<null>(s, `/admin/tenants/${id}`, { method: "DELETE", body: JSON.stringify({ confirmSlug }) }),

  // One tenant (platform admins, or that tenant's admin)
  tenantClasses: (s: AdminSession, id: string, q: { status?: string; q?: string; offset?: number } = {}) =>
    call<{ sessions: ClassRow[]; more: boolean }>(s, `/admin/tenants/${id}/sessions?${query({ limit: 50, ...q })}`),
  classDetail: (s: AdminSession, id: string, sessionId: string) =>
    call<{ session: ClassRow; participants: ClassParticipant[] }>(s, `/admin/tenants/${id}/sessions/${sessionId}`),
  classEvents: (s: AdminSession, id: string, sessionId: string, q: { afterSeq?: number; type?: string; participant?: string }) =>
    call<{ events: ClassEvent[]; nextAfterSeq: number; more: boolean }>(
      s,
      `/admin/tenants/${id}/sessions/${sessionId}/events?${query({ limit: 100, ...q })}`,
    ),
  endClass: (s: AdminSession, id: string, sessionId: string) =>
    call<{ summary: Record<string, number> }>(s, `/admin/tenants/${id}/sessions/${sessionId}/end`, { method: "POST" }),
  deliveries: (s: AdminSession, id: string, status: "all" | "failed") =>
    call<{ deliveries: Delivery[] }>(s, `/admin/tenants/${id}/webhooks?status=${status}`),
  resend: (s: AdminSession, id: string, deliveryId?: number) =>
    call<{ queued: number }>(
      s,
      deliveryId === undefined ? `/admin/tenants/${id}/webhooks/resend-failed` : `/admin/tenants/${id}/webhooks/${deliveryId}/resend`,
      { method: "POST" },
    ),
  accessLog: (s: AdminSession, id: string) => call<{ entries: AccessEntry[] }>(s, `/admin/tenants/${id}/access-log`),

  // Tenant user management
  inviteUser: (s: AdminSession, tenantId: string, email: string) =>
    call<InviteResult>(s, `/admin/tenants/${tenantId}/invite`, { method: "POST", body: JSON.stringify({ email }) }),
  listUsers: (s: AdminSession, tenantId: string) =>
    call<{ users: TenantUser[] }>(s, `/admin/tenants/${tenantId}/users`),
};

/** Validates an invite token (no session required). */
export function validateInvite(token: string) {
  return send<{ tenantName: string; tenantSlug: string; email: string }>(
    `/admin/invite?t=${encodeURIComponent(token)}`, {}, {});
}

/** Accepts an invite and sets the initial password; returns a tenant-scoped JWT. */
export function acceptInvite(token: string, password: string) {
  return send<TenantLoginResult>(
    "/admin/invite/accept", { method: "POST", body: JSON.stringify({ token, password }) }, {});
}

/** Signs in an existing tenant admin with email + school slug + password. */
export function tenantAdminLogin(email: string, tenantSlug: string, password: string) {
  return send<TenantLoginResult>(
    "/admin/tenant-login", { method: "POST", body: JSON.stringify({ email, tenantSlug, password }) }, {});
}

function query(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, String(v));
  return q.toString();
}

/** Downloads a class as JSON or CSV (the server logs it in the school's access log). */
export async function downloadClass(session: AdminSession, tenantId: string, sessionId: string, format: "json" | "csv") {
  const res = await fetch(`${getApiUrl()}/admin/tenants/${tenantId}/sessions/${sessionId}/export?format=${format}`, {
    headers: authHeaders(session),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error ?? `http_${res.status}`, body?.message ?? "Download failed.");
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = `class-${sessionId}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
