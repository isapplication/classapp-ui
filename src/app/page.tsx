import Link from "next/link";
import {
  IconActivity,
  IconShield,
  IconVideo,
  IconMonitor,
  IconUsers,
  IconCheck,
  IconWifi,
  IconExternal,
} from "@/components/icons";

const FEATURES = [
  {
    icon: <IconShield width={22} height={22} />,
    title: "Privacy by design",
    desc: "All signals are derived and discarded on the participant's device. No video, no audio, no raw data ever leaves the browser.",
  },
  {
    icon: <IconVideo width={22} height={22} />,
    title: "Any meeting platform",
    desc: "Works alongside Zoom, Google Meet and Microsoft Teams. One browser extension, any class.",
  },
  {
    icon: <IconMonitor width={22} height={22} />,
    title: "Real-time dashboards",
    desc: "Hosts see engagement, attention and participation signals live during the session — not hours later.",
  },
  {
    icon: <IconUsers width={22} height={22} />,
    title: "School & team managed",
    desc: "Enrol teachers, manage branding, and control data retention. Everything under one admin console.",
  },
  {
    icon: <IconWifi width={22} height={22} />,
    title: "Webhook & pull API",
    desc: "Push session events to your LMS or pull class reports into your data warehouse via a secure API.",
  },
  {
    icon: <IconExternal width={22} height={22} />,
    title: "One-click join",
    desc: "Teachers and students click a single link. No app download, no account creation on their end.",
  },
];

const STEPS = [
  { n: "01", title: "Open your class link", text: "Your school or tutor sends a secure link. It is verified before anything opens." },
  { n: "02", title: "Your meeting opens", text: "Zoom, Meet or Teams launches with a slim analytics panel docked beside it." },
  { n: "03", title: "Insights on your device", text: "Engagement signals are computed locally. You can disable analytics at any time." },
];

const TRUST = [
  "No video or audio transmitted",
  "GDPR-compatible by design",
  "Consent toggle at any time",
  "Data retention you control",
];

const YEAR = new Date().getFullYear();

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-[#1e293b]">

      {/* ── Sticky nav ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#e2e8f0] bg-[#f8fafc]/90 backdrop-blur-sm">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-[#0A6CFF] text-sm font-extrabold text-white">IS</span>
            <span className="text-[15px] font-bold tracking-tight">MyClass</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="hidden text-sm font-medium text-[#475569] transition-colors hover:text-[#1e293b] sm:inline">
              Sign in
            </Link>
            <Link href="/register"
              className="rounded-lg bg-[#2563eb] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110">
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2563eb]/8 via-transparent to-[#3b82f6]/5" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2563eb]/20 bg-[#2563eb]/8 px-3 py-1 text-xs font-semibold text-[#2563eb]">
              <IconActivity width={12} height={12} />
              Privacy-first class analytics
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-balance text-[#0f172a] sm:text-5xl">
              Real-time class insights.<br />
              <span className="text-[#2563eb]">Privacy built in.</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[#475569]">
              MyClass runs alongside any video meeting and surfaces engagement signals — attention, participation, presence — without ever capturing video or audio. All derived signals stay on the device.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register"
                className="rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]">
                Start free trial →
              </Link>
              <Link href="/login"
                className="rounded-xl border border-[#e2e8f0] bg-white px-6 py-3 text-sm font-semibold text-[#1e293b] shadow-sm transition-all hover:border-[#2563eb]/30 hover:shadow-md">
                Sign in to your school
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5">
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-xs text-[#64748b]">
                  <IconCheck width={12} height={12} className="text-[#2563eb]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="border-t border-[#e2e8f0] bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#64748b]">What you get</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0f172a]">Everything your school needs</h2>
            <p className="mx-auto mt-3 max-w-xl text-[#475569]">
              From the moment a student joins to the report that lands in your LMS, MyClass covers the full session lifecycle.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title}
                className="group rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6 transition-all hover:border-[#2563eb]/30 hover:bg-white hover:shadow-md">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#2563eb]/10 text-[#2563eb] transition-colors group-hover:bg-[#2563eb]/15">
                  {f.icon}
                </span>
                <h3 className="mt-4 text-base font-semibold text-[#0f172a]">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#475569]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#64748b]">How it works</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0f172a]">Three steps, then insights</h2>
          </div>
          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
                <span className="text-4xl font-black tabular-nums text-[#2563eb]/20">{s.n}</span>
                <h3 className="mt-3 text-base font-semibold text-[#0f172a]">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#475569]">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Privacy trust callout ─────────────────────────── */}
      <section className="border-t border-[#e2e8f0] bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
              <IconShield width={28} height={28} />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-white">Your participants' data never leaves their device</h2>
              <p className="mt-2 max-w-2xl text-blue-100/80">
                MyClass derives all signals locally using the browser extension. Only computed results — no video, no audio, no biometrics — are sent to your school's dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl border border-[#e2e8f0] bg-white p-10 text-center shadow-sm sm:p-16">
            <h2 className="text-3xl font-bold text-[#0f172a]">Ready to get started?</h2>
            <p className="mx-auto mt-3 max-w-md text-[#475569]">
              Register your school or institution in minutes. No credit card required during the 30-day trial.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register"
                className="rounded-xl bg-[#2563eb] px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110">
                Register your school →
              </Link>
              <Link href="/login"
                className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-7 py-3 text-sm font-semibold text-[#1e293b] transition-all hover:border-[#2563eb]/30 hover:shadow-md">
                Sign in to existing school
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-[#e2e8f0] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-[#94a3b8] sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded bg-[#0A6CFF] text-[10px] font-extrabold text-white">IS</span>
            <span className="font-medium text-[#475569]">MyClass</span>
            <span>· © {YEAR} International Schooling</span>
          </div>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-[#1e293b]">Terms</Link>
            <Link href="/privacy" className="hover:text-[#1e293b]">Privacy</Link>
            <Link href="/help" className="hover:text-[#1e293b]">Help</Link>
            <Link href="/admin" className="hover:text-[#1e293b]">Platform admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
