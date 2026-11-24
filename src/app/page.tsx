import Link from "next/link";
import { IconActivity, IconExternal, IconShield, IconVideo } from "@/components/icons";

const STEPS = [
  { icon: <IconExternal />, title: "Open your class link", text: "Your school or tutor sends it. It's checked before anything opens." },
  { icon: <IconVideo />, title: "Your meeting opens", text: "Zoom, Teams or Meet, with a small class panel beside it." },
  { icon: <IconShield />, title: "Analysed on your device", text: "No video or audio leaves it. You can turn analytics off at any time." },
];

export default function Home() {
  return (
    <main className="flex min-h-screen items-center bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_60%)] px-4 py-12 sm:px-6">
      <div className="view-in mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent text-white">
            <IconActivity />
          </span>
          <span className="text-[15px] font-bold">Class Analytics</span>
        </div>
        <h1 className="mt-8 max-w-xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          Open your class from your school&apos;s link.
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          This page opens from the class link your school or tutor sends you. It checks the link, then opens your meeting
          beside a small panel.
        </p>

        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-lg bg-accent/10 text-accent">{s.icon}</span>
                <span className="text-xs font-bold text-ink-faint tabular-nums">0{i + 1}</span>
              </div>
              <p className="mt-3 text-sm font-bold">{s.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>

        <Link href="/admin" className="mt-8 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-accent hover:underline">
          School administrators: open the admin console
        </Link>
      </div>
    </main>
  );
}
