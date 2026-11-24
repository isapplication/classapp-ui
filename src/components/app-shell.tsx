"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

export type ShellNavItem = {
  key: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  /** Starts a labelled group in the sidebar (wide screens). */
  group?: string;
  href?: string;
  onClick?: () => void;
};

export const navItemClass =
  "relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] font-semibold text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function NavItem({ item }: { item: ShellNavItem }) {
  const className = `${navItemClass} ${
    item.active
      ? "bg-accent/10 text-accent hover:bg-accent/10 hover:text-accent lg:before:absolute lg:before:inset-y-2 lg:before:left-0 lg:before:w-[3px] lg:before:rounded-r lg:before:bg-accent"
      : ""
  }`;
  const content = (
    <>
      {item.icon}
      <span className="hidden lg:inline">{item.label}</span>
    </>
  );
  if (item.href) {
    return (
      <Link href={item.href} className={className} aria-current={item.active ? "page" : undefined} aria-label={item.label} title={item.label}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={item.onClick} className={className} aria-current={item.active ? "page" : undefined} aria-label={item.label} title={item.label}>
      {content}
    </button>
  );
}

/**
 * The app frame from the prototype: a sidebar with brand and navigation (a top bar of icons on
 * small screens), and a sticky page header with title, subtitle and actions.
 */
export function AppShell({
  brand,
  nav,
  navLabel,
  footer,
  title,
  subtitle,
  actions,
  children,
}: {
  brand: { mark: ReactNode; name: string; sub?: string };
  nav: ShellNavItem[];
  navLabel?: string;
  footer?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 z-20 flex items-center gap-1 border-b border-line bg-surface px-3 py-2 lg:h-screen lg:flex-col lg:items-stretch lg:gap-1 lg:border-r lg:border-b-0 lg:px-3 lg:py-4">
        <div className="mr-auto flex min-w-0 items-center gap-3 px-1 lg:mr-0 lg:mb-2 lg:px-2 lg:pb-3">
          {brand.mark}
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[15px] font-bold leading-tight">{brand.name}</p>
            {brand.sub && <p className="truncate text-xs font-medium text-ink-faint">{brand.sub}</p>}
          </div>
        </div>
        {navLabel && <p className="hidden px-3 pt-1 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-ink-faint lg:block">{navLabel}</p>}
        <nav className="flex gap-1 lg:flex-col" aria-label="Main">
          {nav.map((item) => (
            <div key={item.key} className="contents">
              {item.group && (
                <p className="hidden px-3 pt-4 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-ink-faint lg:block">{item.group}</p>
              )}
              <NavItem item={item} />
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-1 lg:mt-auto lg:flex-col lg:items-stretch lg:border-t lg:border-line lg:pt-3">
          {footer}
          <ThemeToggle className={navItemClass} />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface/80 px-4 py-3.5 backdrop-blur sm:px-6 lg:sticky lg:top-0 lg:z-10">
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="truncate text-xs font-medium text-ink-faint">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        <main key={title} className="view-in mx-auto w-full max-w-6xl p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/** A footer link styled like a nav item (e.g. Support, Open meeting). */
export function ShellLink({ href, icon, label, external = false }: { href: string; icon: ReactNode; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      className={navItemClass}
      aria-label={label}
      title={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </a>
  );
}
