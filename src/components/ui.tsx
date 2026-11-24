import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Branding } from "../lib/types";

export type Tone = "good" | "warn" | "bad" | "neutral";

const toneText: Record<Tone, string> = {
  good: "text-live",
  warn: "text-warn",
  bad: "text-crit",
  neutral: "text-ink-soft",
};

const toneChip: Record<Tone, string> = {
  good: "border-live/30 bg-live/10 text-live",
  warn: "border-warn/30 bg-warn/10 text-warn",
  bad: "border-crit/30 bg-crit/10 text-crit",
  neutral: "border-line bg-surface-2 text-ink-soft",
};

export function Dot({ tone, pulse = false }: { tone: Tone; pulse?: boolean }) {
  return <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full bg-current ${toneText[tone]} ${pulse ? "pulse-dot" : ""}`} />;
}

export function Chip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${toneChip[tone]}`}>
      {children}
    </span>
  );
}

/** A live status pill, e.g. LIVE / DEMO / ANALYTICS ON. */
export function LiveBadge({ tone, pulse = true, children }: { tone: Tone; pulse?: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide whitespace-nowrap ${toneChip[tone]}`}>
      <Dot tone={tone} pulse={pulse} />
      {children}
    </span>
  );
}

export function StatusRow({
  label,
  value,
  tone,
  icon,
  extra,
}: {
  label: string;
  value: string;
  tone: Tone;
  icon?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] transition-colors hover:border-accent/30 hover:bg-surface-2">
      <span className="flex min-w-0 items-center gap-2.5 font-medium text-ink-soft">
        {icon && <span className="text-ink-faint">{icon}</span>}
        <span className="truncate">{label}</span>
      </span>
      <span className="flex items-center gap-3">
        {extra}
        <span className={`inline-flex items-center gap-2 font-bold whitespace-nowrap ${toneText[tone]}`}>
          <Dot tone={tone} />
          {value}
        </span>
      </span>
    </div>
  );
}

/** A headline number with an accent rule along the top; lifts on hover. */
export function StatTile({ label, value, tone = "neutral", icon }: { label: string; value: ReactNode; tone?: Tone; icon?: ReactNode }) {
  const color = tone === "neutral" ? "text-ink" : toneText[tone];
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-accent/60">
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[27px] leading-none font-extrabold tracking-tight tabular-nums ${color}`}>{value}</p>
        {icon && <span className="text-ink-faint">{icon}</span>}
      </div>
      <p className="mt-2 text-xs font-semibold text-ink-faint">{label}</p>
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" };

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  const styles = {
    primary: "border-accent bg-accent text-white hover:brightness-110",
    secondary: "border-line bg-surface text-ink hover:bg-surface-2",
    danger: "border-crit/40 bg-surface text-crit hover:bg-crit/10",
  }[variant];
  return (
    <button
      type="button"
      className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent motion-reduce:animate-none"
    />
  );
}

/** Tenant logo, or its initial on the accent colour. */
export function BrandMark({ name, branding, size = 36 }: { name: string; branding: Branding; size?: number }) {
  const style = { width: size, height: size };
  if (branding.logoUrl) {
    return (
      // A tenant-hosted image on an arbitrary domain; next/image would need every domain allow-listed.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={branding.logoUrl} alt="" style={style} className="shrink-0 rounded-[10px] object-cover" />
    );
  }
  return (
    <span style={style} className="grid shrink-0 place-items-center rounded-[10px] bg-accent text-base font-extrabold text-white">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5 ${className}`}>{children}</div>;
}

export function CardTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold">{children}</h2>
      {aside}
    </div>
  );
}
