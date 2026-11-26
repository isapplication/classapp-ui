"use client";

/**
 * School-admin login page, served at /{slug}/login.
 * Caller: src/app/[slug]/login/page.tsx
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import { ApiError, getApiUrl } from "@/lib/api";
import { tenantAdminLogin } from "@/lib/admin-api";
import { saveSession } from "@/lib/admin-session";
import { IconEye, IconEyeOff } from "../icons";
import { Notice } from "./fields";

const YEAR = new Date().getFullYear();

type Branding = { logoUrl?: string; primaryColor?: string };

function hex(c: string) { return /^#[0-9a-f]{3,8}$/i.test(c) ? c : null; }

export function SchoolSignIn({ slug }: { slug: string }) {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [busy, setBusy]         = useState(false);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${getApiUrl()}/public/tenants/${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { name?: string; branding?: Branding } | null) => {
        if (!d) return;
        if (d.branding) setBranding(d.branding);
        if (d.name) setTenantName(d.name);
      })
      .catch(() => {/* keep product defaults */});
  }, [slug]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await tenantAdminLogin(email.trim(), slug, password);
      saveSession({ kind: "sso", token: r.token });
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "invalid_credentials"
          ? "The email or password is incorrect."
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
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#09090b]">

      {/* ── Left branding panel ─────────────────────────────────── */}
      <div className="relative hidden w-[480px] shrink-0 overflow-hidden lg:flex lg:flex-col"
        style={{ background: branding?.primaryColor && hex(branding.primaryColor)
          ? `linear-gradient(135deg,${hex(branding.primaryColor)},${hex(branding.primaryColor)}cc,${hex(branding.primaryColor)}99)`
          : "linear-gradient(135deg,#0A6CFF,#2563eb,#3b82f6)" }}>
        {/* mesh overlay */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 20% 20%,rgba(255,255,255,.12) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(0,0,0,.18) 0%,transparent 55%)" }} />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-10">
          {/* logo */}
          <div className="flex items-center gap-3">
            {branding?.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={branding.logoUrl} alt={tenantName ?? slug} className="h-9 w-auto rounded" />
            ) : (
              <>
                <span className="grid size-10 place-items-center rounded-xl bg-white/15 text-base font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25)]">IS</span>
                <span className="text-[15px] font-bold tracking-tight text-white">MyClass</span>
              </>
            )}
          </div>

          {/* pitch */}
          <div className="space-y-6">
            <div>
              {tenantName ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Welcome back</p>
                  <h2 className="mt-1 text-3xl font-extrabold leading-tight text-white">{tenantName}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/70">Sign in to your school&apos;s analytics dashboard.</p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-extrabold leading-tight text-white">
                    Real-time insights<br />for every class
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-blue-100/80">
                    On-device analytics that run privately inside every session — no data ever leaves the participant&apos;s browser.
                  </p>
                </>
              )}
            </div>

            <ul className="space-y-3">
              {[
                ["🛡", "Privacy-first", "All signals stay on-device"],
                ["📊", "Live dashboards", "Engagement, focus & participation"],
                ["🔗", "Any meeting tool", "Zoom, Meet, Teams — one integration"],
              ].map(([icon, title, desc]) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-blue-100/70">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/40">
            © {YEAR} International Schooling. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-[#f8fafc] dark:bg-[#0f172a]">
        {/* top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-[#7C3AED] text-sm font-extrabold text-white">V</span>
            <span className="text-sm font-bold text-[#0f172a] dark:text-white">MyClass</span>
          </div>
          <div className="hidden lg:block" />
          <Link href="/register" className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] transition-colors hover:text-[#1e293b] dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#94a3b8] dark:hover:text-white">
            Create account
          </Link>
        </div>

        {/* centred form */}
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748b] dark:text-[#94a3b8]">School portal</p>
              <h1 className="mt-1 text-2xl font-bold text-[#0f172a] dark:text-white">Welcome back</h1>
              <p className="mt-1 text-sm text-[#64748b] dark:text-[#94a3b8]">
                Signing in to{" "}
                <code className="rounded-md bg-[#f1f5f9] px-1.5 py-0.5 text-xs font-semibold text-[#1e293b] dark:bg-[#1e293b] dark:text-[#cbd5e1]">{slug}</code>
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="school-email" className="block text-sm font-medium text-[#1e293b] dark:text-[#cbd5e1]">
                  Email address
                </label>
                <input
                  id="school-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="block w-full rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] transition-shadow focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-[#334155] dark:bg-[#1e293b] dark:text-white dark:placeholder:text-[#475569]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="school-password" className="block text-sm font-medium text-[#1e293b] dark:text-[#cbd5e1]">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="school-password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 pr-10 text-sm text-[#0f172a] placeholder:text-[#94a3b8] transition-shadow focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-[#334155] dark:bg-[#1e293b] dark:text-white dark:placeholder:text-[#475569]"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#94a3b8] hover:text-[#64748b] dark:hover:text-[#cbd5e1]"
                    aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
                  </button>
                </div>
              </div>

              {error && <Notice tone="error">{error}</Notice>}

              <button
                type="submit"
                disabled={busy || !email.trim() || !password}
                className="relative w-full overflow-hidden rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(124,58,237,.35)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-30 dark:disabled:opacity-25"
              >
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </span>
                ) : "Sign in to dashboard"}
              </button>

              <p className="text-center text-[11px] leading-relaxed text-[#94a3b8]">
                By signing in you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-2 hover:text-[#64748b]">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-[#64748b]">Privacy Policy</Link>.
              </p>
            </form>

            <div className="flex items-center gap-2 text-xs text-[#94a3b8] dark:text-[#4b5563]">
              <span className="h-px flex-1 bg-[#e2e8f0] dark:bg-[#334155]" />
              <span>or</span>
              <span className="h-px flex-1 bg-[#e2e8f0] dark:bg-[#334155]" />
            </div>

            <p className="text-center text-xs text-[#64748b] dark:text-[#94a3b8]">
              Evaluating MyClass?{" "}
              <Link href="/test" className="font-semibold text-[#7C3AED] hover:underline">
                Open Test Lab →
              </Link>
            </p>
          </div>
        </div>

        {/* footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e2e8f0] px-6 py-4 dark:border-[#1e293b]">
          <p className="text-xs text-[#94a3b8]">
            © {YEAR} International Schooling. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-[#94a3b8]">
            <Link href="/terms" className="hover:text-[#1e293b] dark:hover:text-white hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:text-[#1e293b] dark:hover:text-white hover:underline">Privacy</Link>
            <Link href="/help" className="hover:text-[#1e293b] dark:hover:text-white hover:underline">Help</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
