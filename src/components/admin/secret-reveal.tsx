"use client";

import { useState } from "react";
import { Button } from "../ui";

/** A secret shown exactly once, with a copy button. */
export function SecretReveal({ label, value, purpose }: { label: string; value: string; purpose: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-warn/40 bg-warn/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold">{label}</p>
        <Button
          className="min-h-8 px-3 text-xs"
          onClick={() =>
            navigator.clipboard.writeText(value).then(
              () => setCopied(true),
              () => setCopied(false),
            )
          }
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <code className="mt-2 block break-all rounded-md bg-surface-2 px-2 py-1.5 font-mono text-[12px] select-all">{value}</code>
      <p className="mt-1.5 text-[11px] text-ink-faint">{purpose} Shown once: store it in your secrets manager now.</p>
    </div>
  );
}
