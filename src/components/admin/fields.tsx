import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({ label, hint, children, wide = false }: { label: string; hint?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-10 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/15 ${props.className ?? ""}`}
    />
  );
}

export function Notice({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-crit/30 bg-crit/10 text-crit",
    success: "border-live/30 bg-live/10 text-live",
    info: "border-line bg-surface-2 text-ink-soft",
  }[tone];
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </p>
  );
}
