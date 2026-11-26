import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { IconEye, IconEyeOff } from "../icons";

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

export function PasswordField({ id, label, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      <div className="relative">
        <input
          id={id}
          {...rest}
          type={show ? "text" : "password"}
          className={`min-h-10 w-full rounded-lg border border-line bg-surface-2 px-3 pr-10 text-sm text-ink outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/15 ${rest.className ?? ""}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(v => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-faint hover:text-ink"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
        </button>
      </div>
    </Field>
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
