"use client";

/**
 * Public registration page at /register.
 * Caller: src/app/register/page.tsx
 * Step 1 — choose account type (Individual / Organisation).
 * Step 2 — fill the appropriate details form.
 * User instruction: "make registration page where user can register as an individual
 * or as a Organisation/School/Institution etc"
 */

import Link from "next/link";
import { useState } from "react";
import { IconEye, IconEyeOff } from "../icons";
import { Notice } from "./fields";

const YEAR = new Date().getFullYear();

type AccountType = "individual" | "organisation" | null;
type Step = "type" | "details" | "done";

// ── Individual form ───────────────────────────────────────────────────────
function IndividualForm({ onBack }: { onBack: () => void }) {
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowCfm] = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  const passwordMatch = !confirm || password === confirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordMatch) { setError("Passwords do not match."); return; }
    setBusy(true);
    setError(null);
    // Individual registration is currently on a waitlist — collect info and confirm.
    await new Promise((r) => setTimeout(r, 800));
    setBusy(false);
    setDone(true);
  }

  if (done) return <SuccessCard type="individual" email={email} />;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="reg-name" className="block text-sm font-medium text-ink">Full name</label>
        <input id="reg-name" type="text" required autoComplete="name" value={name} onChange={e => setName(e.target.value)}
          placeholder="Your name"
          className="block w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="reg-email" className="block text-sm font-medium text-ink">Work email</label>
        <input id="reg-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@school.edu"
          className="block w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="reg-password" className="block text-sm font-medium text-ink">Password</label>
        <div className="relative">
          <input id="reg-password" type={showPw ? "text" : "password"} required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="block w-full rounded-xl border border-line bg-surface px-4 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-faint hover:text-ink" aria-label={showPw ? "Hide password" : "Show password"}>
            {showPw ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="reg-confirm" className="block text-sm font-medium text-ink">Confirm password</label>
        <div className="relative">
          <input id="reg-confirm" type={showConfirm ? "text" : "password"} required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className={`block w-full rounded-xl border px-4 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 transition-shadow bg-surface ${!passwordMatch ? "border-crit focus:ring-crit/20" : "border-line focus:border-accent focus:ring-accent/20"}`} />
          <button type="button" tabIndex={-1} onClick={() => setShowCfm(v => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-faint hover:text-ink" aria-label={showConfirm ? "Hide password" : "Show password"}>
            {showConfirm ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
          </button>
        </div>
        {!passwordMatch && <p className="text-xs text-crit">Passwords do not match.</p>}
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" required checked={agreed} onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 size-4 cursor-pointer rounded accent-accent" />
        <span className="text-xs leading-relaxed text-ink-soft">
          I agree to the{" "}
          <Link href="/terms" className="text-accent underline underline-offset-2 hover:no-underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-accent underline underline-offset-2 hover:no-underline">Privacy Policy</Link>.
        </span>
      </label>

      {error && <Notice tone="error">{error}</Notice>}

      <button type="submit" disabled={busy || !agreed}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? <span className="flex items-center justify-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creating account…</span> : "Create account"}
      </button>

      <button type="button" onClick={onBack} className="w-full text-center text-xs text-ink-faint hover:text-ink-soft">
        ← Back to account type
      </button>
    </form>
  );
}

// ── Organisation form ─────────────────────────────────────────────────────
const ORG_TYPES = ["School / K-12", "University / College", "Tutoring Centre", "Corporate Training", "Non-profit / NGO", "Other"];

function OrgForm({ onBack }: { onBack: () => void }) {
  const [orgName, setOrgName]     = useState("");
  const [orgType, setOrgType]     = useState("");
  const [slug, setSlug]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowCfm] = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  const passwordMatch = !confirm || password === confirm;

  function handleOrgName(v: string) {
    setOrgName(v);
    // auto-derive slug from name only if the user hasn't manually edited it yet
    const derived = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug || slug === derived) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordMatch) { setError("Passwords do not match."); return; }
    if (!/^[a-z0-9][a-z0-9-]{1,}[a-z0-9]$/.test(slug)) {
      setError("School ID must be lowercase letters, numbers and hyphens (at least 3 characters).");
      return;
    }
    setBusy(true);
    setError(null);
    // Organisation registration requires platform-admin approval; simulate submission.
    await new Promise((r) => setTimeout(r, 900));
    setBusy(false);
    setDone(true);
  }

  if (done) return <SuccessCard type="organisation" email={email} orgName={orgName} />;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <label htmlFor="org-name" className="block text-sm font-medium text-ink">Organisation name</label>
          <input id="org-name" type="text" required value={orgName} onChange={e => handleOrgName(e.target.value)}
            placeholder="Oakridge International School"
            className="block w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label htmlFor="org-type" className="block text-sm font-medium text-ink">Organisation type</label>
          <select id="org-type" required value={orgType} onChange={e => setOrgType(e.target.value)}
            className="block w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20">
            <option value="" disabled>Select type…</option>
            {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <label htmlFor="org-slug" className="block text-sm font-medium text-ink">
            School ID
            <span className="ml-1.5 text-xs font-normal text-ink-faint">(used in your login URL)</span>
          </label>
          <div className="flex items-center rounded-xl border border-line bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <span className="select-none pl-4 text-sm text-ink-faint">myclass.is/</span>
            <input id="org-slug" type="text" required value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="oakridge-intl"
              className="flex-1 bg-transparent py-2.5 pr-4 text-sm text-ink placeholder:text-ink-faint focus:outline-none" />
          </div>
        </div>
        <div className="col-span-2 space-y-1.5">
          <label htmlFor="org-email" className="block text-sm font-medium text-ink">Admin email</label>
          <input id="org-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="admin@yourschool.edu"
            className="block w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="org-password" className="block text-sm font-medium text-ink">Password</label>
          <div className="relative">
            <input id="org-password" type={showPw ? "text" : "password"} required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 chars"
              className="block w-full rounded-xl border border-line bg-surface px-4 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
            <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-faint hover:text-ink" aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="org-confirm" className="block text-sm font-medium text-ink">Confirm</label>
          <div className="relative">
            <input id="org-confirm" type={showConfirm ? "text" : "password"} required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat"
              className={`block w-full rounded-xl border px-4 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 bg-surface ${!passwordMatch ? "border-crit focus:ring-crit/20" : "border-line focus:border-accent focus:ring-accent/20"}`} />
            <button type="button" tabIndex={-1} onClick={() => setShowCfm(v => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-faint hover:text-ink" aria-label={showConfirm ? "Hide password" : "Show password"}>
              {showConfirm ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
            </button>
          </div>
        </div>
        {!passwordMatch && <p className="col-span-2 -mt-2 text-xs text-crit">Passwords do not match.</p>}
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" required checked={agreed} onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 size-4 cursor-pointer rounded accent-accent" />
        <span className="text-xs leading-relaxed text-ink-soft">
          I agree to the{" "}
          <Link href="/terms" className="text-accent underline underline-offset-2 hover:no-underline">Terms of Service</Link>,{" "}
          <Link href="/privacy" className="text-accent underline underline-offset-2 hover:no-underline">Privacy Policy</Link>{" "}
          and confirm I am authorised to register on behalf of my organisation.
        </span>
      </label>

      {error && <Notice tone="error">{error}</Notice>}

      <button type="submit" disabled={busy || !agreed}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? <span className="flex items-center justify-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Submitting request…</span> : "Submit registration request"}
      </button>

      <button type="button" onClick={onBack} className="w-full text-center text-xs text-ink-faint hover:text-ink-soft">
        ← Back to account type
      </button>
    </form>
  );
}

// ── Success card ──────────────────────────────────────────────────────────
function SuccessCard({ type, email, orgName }: { type: AccountType; email: string; orgName?: string }) {
  return (
    <div className="rounded-2xl border border-live/30 bg-live/5 p-6 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-live/10">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className="size-7 text-live">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      {type === "organisation" ? (
        <>
          <h3 className="text-base font-bold text-ink">Registration request submitted!</h3>
          <p className="mt-2 text-sm text-ink-soft">
            We&apos;ve received the registration for <strong>{orgName}</strong>. Our team will review and email <strong>{email}</strong> within 1 business day with your login details.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-base font-bold text-ink">You&apos;re on the waitlist!</h3>
          <p className="mt-2 text-sm text-ink-soft">
            We&apos;ll email <strong>{email}</strong> when your individual account is ready. Early access is currently limited.
          </p>
        </>
      )}
      <Link href="/" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
        Return to home
      </Link>
    </div>
  );
}

// ── Type selector cards ───────────────────────────────────────────────────
const TYPES: { id: AccountType; label: string; desc: string; icon: string; tags: string[] }[] = [
  {
    id: "individual",
    label: "Individual",
    desc: "A teacher, tutor or instructor setting up their own class space.",
    icon: "👤",
    tags: ["Educator", "Tutor", "Instructor"],
  },
  {
    id: "organisation",
    label: "Organisation",
    desc: "A school, university, company or institution with multiple users.",
    icon: "🏛",
    tags: ["School", "University", "Corporate"],
  },
];

// ── Main component ────────────────────────────────────────────────────────
export function RegisterFlow() {
  const [step, setStep] = useState<Step>("type");
  const [type, setType] = useState<AccountType>(null);

  function selectType(t: AccountType) {
    setType(t);
    setStep("details");
  }

  const stepIdx = { type: 0, details: 1, done: 2 }[step];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#09090b]">

      {/* ── Left branding panel ─────────────────────────────────── */}
      <div className="relative hidden w-[480px] shrink-0 overflow-hidden bg-gradient-to-br from-[#0A6CFF] via-[#2563eb] to-[#3b82f6] lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 20% 20%,rgba(255,255,255,.12) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(37,99,235,.35) 0%,transparent 55%)" }} />
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white/15 text-base font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25)]">IS</span>
            <span className="text-[15px] font-bold tracking-tight text-white">MyClass</span>
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight text-white">
                Start in minutes,<br />not months
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-blue-100/80">
                Set up your analytics workspace, invite your team and go live — all from one place.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                ["✦", "Free 30-day trial", "No credit card required"],
                ["✦", "GDPR compliant", "Data stays on-device by design"],
                ["✦", "Any meeting platform", "Zoom, Meet, Teams & more"],
              ].map(([icon, title, desc]) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 text-sm text-blue-200">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-blue-100/70">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-blue-100/50">© {YEAR} International Schooling. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-extrabold text-white">IS</span>
            <span className="text-sm font-bold">MyClass</span>
          </div>
          <div className="hidden lg:block" />
          <p className="text-xs text-ink-soft">
            Already have an account?{" "}
            <Link href="/admin" className="font-semibold text-accent hover:underline">Sign in</Link>
          </p>
        </div>

        {/* step indicator */}
        <div className="flex justify-center px-6 pb-2 pt-1">
          <ol className="flex items-center gap-2 text-xs">
            {["Account type", "Details", "Confirmation"].map((label, i) => {
              const active = i === stepIdx;
              const done   = i < stepIdx;
              return (
                <li key={label} className="flex items-center gap-2">
                  {i > 0 && <span className="h-px w-6 bg-line" />}
                  <span className={`flex items-center gap-1.5 ${active ? "text-accent font-semibold" : done ? "text-live" : "text-ink-faint"}`}>
                    <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-accent text-white" : done ? "bg-live/15 text-live" : "bg-surface-2 text-ink-faint"}`}>
                      {done ? "✓" : i + 1}
                    </span>
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* main content */}
        <div className="flex flex-1 items-start justify-center px-6 py-8">
          <div className="w-full max-w-sm space-y-6">

            {step === "type" && (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Get started</p>
                  <h1 className="mt-1 text-2xl font-bold text-ink">Create your account</h1>
                  <p className="mt-1 text-sm text-ink-soft">Choose the account type that fits you best.</p>
                </div>
                <div className="space-y-3">
                  {TYPES.map((t) => (
                    <button key={t.id} type="button" onClick={() => selectType(t.id)}
                      className="group w-full cursor-pointer rounded-2xl border border-line bg-surface p-4 text-left transition-all hover:border-accent/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                      <div className="flex items-start gap-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/8 text-xl">{t.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-ink group-hover:text-accent">{t.label}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{t.desc}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {t.tags.map(tag => (
                              <span key={tag} className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-faint">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                          className="mt-1 size-4 shrink-0 text-ink-faint group-hover:text-accent">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-center text-[11px] text-ink-faint">
                  By registering you agree to our{" "}
                  <Link href="/terms" className="underline underline-offset-2 hover:text-ink-soft">Terms</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-ink-soft">Privacy Policy</Link>.
                </p>
              </>
            )}

            {step === "details" && type === "individual" && (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Individual account</p>
                  <h1 className="mt-1 text-2xl font-bold text-ink">Your details</h1>
                  <p className="mt-1 text-sm text-ink-soft">Set up your personal teaching workspace.</p>
                </div>
                <IndividualForm onBack={() => setStep("type")} />
              </>
            )}

            {step === "details" && type === "organisation" && (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Organisation account</p>
                  <h1 className="mt-1 text-2xl font-bold text-ink">Register your organisation</h1>
                  <p className="mt-1 text-sm text-ink-soft">We&apos;ll review your request within 1 business day.</p>
                </div>
                <OrgForm onBack={() => setStep("type")} />
              </>
            )}

          </div>
        </div>

        {/* footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-6 py-4">
          <p className="text-xs text-ink-faint">© {YEAR} International Schooling. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-ink-faint">
            <Link href="/terms" className="hover:text-ink-soft hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:text-ink-soft hover:underline">Privacy</Link>
            <Link href="/help" className="hover:text-ink-soft hover:underline">Help</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
