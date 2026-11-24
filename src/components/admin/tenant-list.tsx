"use client";

import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import type { AdminSession } from "@/lib/admin-session";
import { useLoad } from "@/lib/use-load";
import { IconBuilding, IconCheck, IconPlus, IconX } from "../icons";
import { Card, Chip, StatTile } from "../ui";
import { Notice } from "./fields";

export function TenantList({ session }: { session: AdminSession }) {
  const { data, error, loading } = useLoad(() => adminApi.listTenants(session), "tenants");
  const configured = data?.tenants.filter((t) => t.webhookConfigured).length ?? 0;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Tenants" value={data ? data.tenants.length : "–"} icon={<IconBuilding />} />
        <StatTile label="Webhook configured" value={data ? configured : "–"} tone="good" icon={<IconCheck />} />
        <StatTile label="Webhook not set" value={data ? data.tenants.length - configured : "–"} tone={data && data.tenants.length - configured > 0 ? "warn" : "neutral"} icon={<IconX />} />
      </div>

      {error instanceof Error && <Notice tone="error">{error.message}</Notice>}

      <Card className="p-0 sm:p-0">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-sm font-bold">All tenants</h2>
          <Link
            href="/admin?view=new"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-accent bg-accent px-3 text-[13px] font-semibold text-white transition hover:brightness-110"
          >
            <IconPlus width={16} height={16} />
            Enrol tenant
          </Link>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line bg-surface-2/60 text-[11px] uppercase tracking-wider text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Webhook</th>
              <th className="px-4 py-3 font-semibold">Enrolled</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data?.tenants.map((t) => (
              <tr key={t.id} className="border-b border-line transition-colors last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5 font-semibold">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
                      {t.name.trim().charAt(0).toUpperCase()}
                    </span>
                    {t.name}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-soft">{t.slug}</td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1.5">
                    {t.webhookConfigured ? <Chip tone="good">Configured</Chip> : <Chip tone="neutral">Not set</Chip>}
                    {t.suspended && <Chip tone="bad">Suspended</Chip>}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-soft tabular-nums">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin?tenant=${t.id}`} className="text-sm font-semibold text-accent hover:underline">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
            {data && data.tenants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-soft">
                  No tenants yet. Enrol the first one.
                </td>
              </tr>
            )}
            {!data && loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-soft">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>
    </section>
  );
}
