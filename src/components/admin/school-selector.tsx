"use client";

/**
 * School-selector login page at /login.
 * Caller: src/app/login/page.tsx
 * Fetches GET /public/tenants → [{name, slug, branding}], lets the user pick a school,
 * then navigates to /{slug}/login with that school's branding context.
 * User instruction: "login (should show all slug) when slug selected then show
 * branding as well otherwise product branding"
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getApiUrl } from "@/lib/api";

const YEAR = new Date().getFullYear();

type PublicTenant = { name: string; slug: string; branding: { logoUrl?: string; primaryColor?: string } };

function hex(color: string) {
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : null;
}

function BrandPanel({ tenant }: { tenant: PublicTenant | null }) {
  const color = tenant?.branding?.primaryColor ? hex(tenant.branding.primaryColor) : null;
  const from  = color ?? "#0A6CFF";
  const via   = color ? `${color}cc` : "#2563eb";
  const to    = color ? `${color}99` : "#3b82f6";
  const logo  = tenant?.branding?.logoUrl;

  return (
    <div
      className="relative hidden w-[480px] shrink-0 overflow-hidden lg:flex lg:flex-col"
      style={{ background: `linear-gradient(135deg, ${from}, ${via}, ${to})` }}>
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 20% 20%,rgba(255,255,255,.12) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(0,0,0,.18) 0%,transparent 55%)" }} />
      <div className="relative z-10 flex flex-1 flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          {logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={logo} alt={tenant!.name} className="h-9 w-auto rounded" />
          ) : (
            <>
              <span className="grid size-10 place-items-center rounded-xl bg-white/15 text-base font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25)]">IS</span>
              <span className="text-[15px] font-bold tracking-tight text-white">MyClass</span>
            </>
          )}
        </div>
        <div className="space-y-6">
          {tenant ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Welcome back</p>
              <h2 className="mt-1 text-3xl font-extrabold leading-tight text-white">{tenant.name}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-white/70">Sign in to your school&apos;s analytics dashboard.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-3xl font-extrabold leading-tight text-white">Real-time class insights.<br />Privacy built in.</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">Select your school to sign in with your school credentials.</p>
            </div>
          )}
          <ul className="space-y-2.5">
            {[["Privacy-first","Signals stay on-device"],["Any meeting tool","Zoom, Meet, Teams & more"],["GDPR compliant","Your data, your rules"]].map(([t,d])=>(
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 text-sm text-white/60">✦</span>
                <div><p className="text-sm font-semibold text-white">{t}</p><p className="text-xs text-white/60">{d}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/40">© {YEAR} International Schooling. All rights reserved.</p>
      </div>
    </div>
  );
}

export function SchoolSelector() {
  const router = useRouter();
  const [schools, setSchools]   = useState<PublicTenant[]>([]);
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState<PublicTenant | null>(null);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(true);
  const dropRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${getApiUrl()}/public/tenants`)
      .then(r => r.ok ? (r.json() as Promise<PublicTenant[]>) : Promise.reject(r))
      .then(data => { setSchools(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = schools.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.slug.toLowerCase().includes(query.toLowerCase())
  );

  function pick(s: PublicTenant) { setSelected(s); setQuery(s.name); setOpen(false); }
  function proceed() { if (selected) router.push(`/${selected.slug}/login`); }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#0f172a]">
      <BrandPanel tenant={selected} />

      <div className="flex flex-1 flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-[#7C3AED] text-sm font-extrabold text-white">V</span>
            <span className="text-sm font-bold text-[#0f172a] dark:text-white">MyClass</span>
          </div>
          <div className="hidden lg:block" />
          <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
            New here?{" "}
            <Link href="/register" className="font-semibold text-[#7C3AED] hover:underline">Create account</Link>
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748b] dark:text-[#94a3b8]">School portal</p>
              <h1 className="mt-1 text-2xl font-bold text-[#0f172a] dark:text-white">Find your school</h1>
              <p className="mt-1 text-sm text-[#64748b] dark:text-[#94a3b8]">Search by school name or ID, then continue to sign in.</p>
            </div>

            <div className="space-y-1.5" ref={dropRef}>
              <label htmlFor="school-search" className="block text-sm font-medium text-[#1e293b] dark:text-[#cbd5e1]">School name or ID</label>
              <div className="relative">
                <input
                  id="school-search"
                  type="text"
                  autoComplete="off"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setOpen(true); setSelected(null); }}
                  onFocus={() => setOpen(true)}
                  placeholder={loading ? "Loading schools…" : "e.g. Oakridge International"}
                  className="block w-full rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-[#334155] dark:bg-[#1e293b] dark:text-white dark:placeholder:text-[#475569] dark:focus:border-[#7C3AED]"
                />
                {open && !loading && filtered.length > 0 && (
                  <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg dark:border-[#334155] dark:bg-[#1e293b]">
                    {filtered.map(s => (
                      <li key={s.slug}>
                        <button type="button" onMouseDown={() => pick(s)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f1f5f9] dark:hover:bg-[#2d3748]">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                            style={{ background: s.branding?.primaryColor ? `${s.branding.primaryColor}20` : "#7C3AED20", color: s.branding?.primaryColor ?? "#7C3AED" }}>
                            {s.name[0]?.toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-[#0f172a] dark:text-white">{s.name}</p>
                            <p className="text-xs text-[#64748b]">{s.slug}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {open && !loading && query.length > 1 && filtered.length === 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-[#e2e8f0] bg-white p-4 text-center text-sm text-[#64748b] shadow-lg dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#94a3b8]">
                    No registered school matched &ldquo;{query}&rdquo;.
                  </div>
                )}
              </div>
            </div>

            <button type="button" onClick={proceed} disabled={!selected}
              className="w-full rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-30 dark:disabled:opacity-25">
              Continue to sign in →
            </button>

            <div className="flex items-center gap-2 text-xs text-[#94a3b8] dark:text-[#4b5563]">
              <span className="h-px flex-1 bg-[#e2e8f0] dark:bg-[#334155]" /><span>or</span><span className="h-px flex-1 bg-[#e2e8f0] dark:bg-[#334155]" />
            </div>

            <p className="text-center text-xs text-[#64748b] dark:text-[#94a3b8]">
              Platform admin?{" "}
              <Link href="/admin" className="font-semibold text-[#7C3AED] hover:underline">Platform console →</Link>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e2e8f0] px-6 py-4 dark:border-[#1e293b]">
          <p className="text-xs text-[#94a3b8]">© {YEAR} International Schooling. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-[#94a3b8]">
            {["Terms","Privacy","Help"].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="hover:text-[#1e293b] dark:hover:text-white">{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
