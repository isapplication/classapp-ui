"use client";

import { useEffect, useSyncExternalStore } from "react";
import { IconMoon, IconSun } from "./icons";

type Theme = "light" | "dark" | "system";
const KEY = "classapp.theme";
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const current = (): Theme => (document.documentElement.dataset.theme as Theme | undefined) ?? "system";

/** Light / dark switch. Follows the system until the person picks one; the choice is remembered. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    current,
    () => "system" as Theme,
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") {
        document.documentElement.dataset.theme = saved;
        notify();
      }
    } catch {
      // storage unavailable: follow the system
    }
  }, []);

  function toggle() {
    const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // not remembered
    }
    notify();
  }

  const label = theme === "dark" ? "Light mode" : theme === "light" ? "Dark mode" : "Switch theme";
  return (
    <button type="button" onClick={toggle} className={className} aria-label={label} title={label}>
      {theme === "dark" ? <IconSun /> : <IconMoon />}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
