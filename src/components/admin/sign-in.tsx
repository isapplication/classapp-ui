"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { login } from "@/lib/admin-api";
import { saveSession } from "@/lib/admin-session";
import { ssoEnabled, startSso } from "@/lib/oidc";
import { IconShield, IconUser } from "../icons";
import { ThemeToggle } from "../theme-toggle";
import { Button, Card } from "../ui";
import { Field, Notice, TextInput } from "./fields";

/** Platform admins sign in with the username and password set on the server; schools use SSO. */
export function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await login(username.trim(), password);
      saveSession({ kind: "password", token: r.token, username: r.username, expiresAt: r.expiresAt });
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "invalid_credentials"
          ? "The username or password is incorrect."
          : err instanceof ApiError && err.code === "password_login_disabled"
            ? "Username and password sign-in isn't set up on this server. Use single sign-on."
            : err instanceof Error
              ? err.message
              : "Sign-in failed.",
      );
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_60%)] px-4 py-10">
      <ThemeToggle className="absolute top-4 right-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink-soft hover:text-ink" />
      <Card className="view-in w-full max-w-sm space-y-5 p-6 shadow-lift sm:p-7">
        <div>
          <span className="mb-4 grid size-11 place-items-center rounded-xl bg-accent text-lg font-extrabold text-white">C</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Class Analytics</p>
          <h1 className="mt-1 text-xl font-bold">Admin console</h1>
          <p className="mt-1 text-sm text-ink-soft">Schools, classes, webhooks and keys, in one place.</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Field label="Username">
            <TextInput id="username" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="Password">
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" className="w-full" disabled={busy || !username.trim() || !password}>
            <IconUser width={16} height={16} />
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {ssoEnabled && (
          <>
            <p className="flex items-center gap-3 text-xs text-ink-faint before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
              or
            </p>
            <Button className="w-full" onClick={() => startSso().catch((e: Error) => setError(e.message))}>
              <IconShield width={16} height={16} />
              Sign in with SSO
            </Button>
          </>
        )}

        {error && <Notice tone="error">{error}</Notice>}
      </Card>
    </main>
  );
}
