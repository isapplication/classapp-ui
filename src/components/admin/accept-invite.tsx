"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { acceptInvite, validateInvite } from "@/lib/admin-api";
import { saveSession } from "@/lib/admin-session";
import { Button, Card, Spinner } from "../ui";
import { Field, Notice, TextInput } from "./fields";
import { ThemeToggle } from "../theme-toggle";
import { IconUsers, IconX } from "../icons";

type State =
  | { phase: "loading" }
  | { phase: "invalid"; message: string }
  | { phase: "ready"; tenantName: string; email: string }
  | { phase: "done" };

/** Accepts an invite token from the URL, lets the user set a password, and signs them in. */
export function AcceptInvite() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("t") ?? "";

  const [state, setState] = useState<State>({ phase: "loading" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ phase: "invalid", message: "This invite link is missing its token. Use the full link from your invitation." });
      return;
    }
    validateInvite(token)
      .then((r) => setState({ phase: "ready", tenantName: r.tenantName, email: r.email }))
      .catch((err) =>
        setState({
          phase: "invalid",
          message:
            err instanceof ApiError && err.code === "invite_not_found"
              ? "This invite link is invalid or has expired. Ask your platform administrator for a new one."
              : err instanceof Error
                ? err.message
                : "Could not validate the invite.",
        }),
      );
  }, [token]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await acceptInvite(token, password);
      saveSession({ kind: "sso", token: r.token });
      setState({ phase: "done" });
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "invite_not_found"
          ? "This invite has already been used or expired. Ask for a new invite."
          : err instanceof Error
            ? err.message
            : "Could not accept the invite.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_60%)] px-4 py-10">
      <ThemeToggle className="absolute top-4 right-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink-soft hover:text-ink" />
      <Card className="view-in w-full max-w-sm space-y-5 p-6 shadow-lift sm:p-7">
        <div>
          <span className="mb-4 grid size-11 place-items-center rounded-xl bg-accent text-lg font-extrabold text-white">V</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">MyClass</p>
          <h1 className="mt-1 text-xl font-bold">Accept your invite</h1>
        </div>

        {state.phase === "loading" && (
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <Spinner />
            Validating your invite…
          </div>
        )}

        {state.phase === "invalid" && (
          <div className="flex gap-3 rounded-lg bg-crit/10 p-3 text-sm text-crit">
            <IconX width={16} height={16} className="mt-0.5 shrink-0" />
            {state.message}
          </div>
        )}

        {state.phase === "ready" && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm">
              <p className="text-xs text-ink-faint">Setting up access for</p>
              <p className="font-semibold">{state.email}</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Admin of <span className="font-medium">{state.tenantName}</span>
              </p>
            </div>
            <Field label="Choose a password" hint="At least 8 characters.">
              <TextInput
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm password">
              <TextInput
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            <Button type="submit" variant="primary" className="w-full" disabled={busy || !password || !confirm}>
              <IconUsers width={16} height={16} />
              {busy ? "Setting up…" : "Set password and sign in"}
            </Button>
            {error && <Notice tone="error">{error}</Notice>}
          </form>
        )}

        {state.phase === "done" && (
          <div className="text-sm text-ink-soft">Signing you in…</div>
        )}
      </Card>
    </main>
  );
}
