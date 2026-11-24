"use client";

import { useMemo, useSyncExternalStore } from "react";

/** The admin console's sign-in, kept in sessionStorage (cleared when the tab closes). */
export type AdminSession =
  | { kind: "password"; token: string; username: string; expiresAt: string }
  | { kind: "sso"; token: string }
  | { kind: "key"; key: string };

/** For routing the UI only. The server checks every request; this is never trusted for access. */
export type AdminPrincipal = {
  platformAdmin: boolean;
  tenantAdmin: boolean;
  tenantId: string | null;
  label: string;
};

const KEY = "classapp.admin.session";
const ROLES_CLAIM = process.env.NEXT_PUBLIC_OIDC_ROLES_CLAIM ?? "roles";
const TENANT_CLAIM = process.env.NEXT_PUBLIC_OIDC_TENANT_CLAIM ?? "tenant_id";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function notify() {
  listeners.forEach((l) => l());
}

export function saveSession(session: AdminSession) {
  sessionStorage.setItem(KEY, JSON.stringify(session));
  notify();
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // storage unavailable
  }
  notify();
}

/** undefined while loading (server render), null when signed out. */
export function useAdminSession(): AdminSession | null | undefined {
  const raw = useSyncExternalStore<string | null | undefined>(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    () => undefined,
  );
  // An expired or signed-out token gets a 401 from the server, which clears the session (admin-api.ts).
  return useMemo(() => (raw === undefined ? undefined : raw ? (JSON.parse(raw) as AdminSession) : null), [raw]);
}

function claimPath(claims: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, part) =>
    value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined, claims);
}

export function principalOf(session: AdminSession): AdminPrincipal {
  if (session.kind === "key") {
    return { platformAdmin: true, tenantAdmin: false, tenantId: null, label: "Admin key" };
  }
  if (session.kind === "password") {
    return { platformAdmin: true, tenantAdmin: false, tenantId: null, label: session.username };
  }
  let claims: Record<string, unknown> = {};
  try {
    const payload = session.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    claims = JSON.parse(decodeURIComponent(escape(atob(payload))));
  } catch {
    // an opaque token: the server still decides
  }
  const rolesValue = claimPath(claims, ROLES_CLAIM);
  const roles = Array.isArray(rolesValue) ? rolesValue.map(String) : typeof rolesValue === "string" ? rolesValue.split(/[\s,]+/) : [];
  const tenant = claimPath(claims, TENANT_CLAIM);
  const label = String(claims.name ?? claims.email ?? claims.preferred_username ?? claims.sub ?? "Signed in");
  return {
    platformAdmin: roles.includes("platform_admin"),
    tenantAdmin: roles.includes("tenant_admin"),
    tenantId: typeof tenant === "string" ? tenant : null,
    label,
  };
}
