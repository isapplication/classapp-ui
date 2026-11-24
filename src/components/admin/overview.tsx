"use client";

import Link from "next/link";
import { adminApi, type AdminAction } from "@/lib/admin-api";
import type { AdminSession } from "@/lib/admin-session";
import { ACTION, dateTime } from "@/lib/format";
import { useLoad } from "@/lib/use-load";
import { IconActivity, IconBuilding, IconCompass, IconUsers, IconVideo, IconX } from "../icons";
import { Card, CardTitle, StatTile } from "../ui";
import { ClassTable } from "./class-table";
import { Notice } from "./fields";

/** The platform at a glance: headline numbers, classes live now, latest admin actions. */
export function Overview({ session }: { session: AdminSession }) {
  const { data, error } = useLoad(() => adminApi.overview(session), "overview");
  const s = data?.stats;
  return (
    <section className="space-y-5">
      {error instanceof Error && <Notice tone="error">{error.message}</Notice>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label={s && s.suspended > 0 ? `Schools (${s.suspended} suspended)` : "Schools"} value={s?.tenants ?? "–"} icon={<IconBuilding />} />
        <StatTile label="Classes live now" value={s?.liveSessions ?? "–"} tone="good" icon={<IconVideo />} />
        <StatTile label="People online" value={s?.onlineParticipants ?? "–"} icon={<IconUsers />} />
        <StatTile label="Classes today" value={s?.sessionsToday ?? "–"} icon={<IconCompass />} />
        <StatTile
          label="Failed webhooks"
          value={s?.failedDeliveries ?? "–"}
          tone={s && s.failedDeliveries > 0 ? "bad" : "neutral"}
          icon={<IconX />}
        />
      </div>

      <Card className="p-0 sm:p-0">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-sm font-bold">Live now</h2>
          <Link href="/admin?view=live" className="text-[13px] font-semibold text-accent hover:underline">
            All live classes
          </Link>
        </div>
        {data ? <ClassTable classes={data.live} showSchool empty="No classes are live right now." /> : <p className="px-4 py-8 text-center text-sm text-ink-soft">Loading…</p>}
      </Card>

      <Card>
        <CardTitle
          aside={
            <Link href="/admin?view=audit" className="text-[13px] font-semibold text-accent hover:underline">
              Full log
            </Link>
          }
        >
          Recent admin actions
        </CardTitle>
        <ActionList actions={data?.recentActions} />
      </Card>
    </section>
  );
}

export function ActionList({ actions }: { actions: AdminAction[] | undefined }) {
  if (!actions) return <p className="text-sm text-ink-soft">Loading…</p>;
  if (actions.length === 0) return <p className="text-sm text-ink-soft">Nothing yet.</p>;
  return (
    <ol className="relative space-y-4 before:absolute before:inset-y-1 before:left-[15px] before:w-px before:bg-line">
      {actions.map((a, i) => (
        <li key={`${a.at}-${i}`} className="relative flex gap-3">
          <span className={`z-[1] grid size-8 shrink-0 place-items-center rounded-full border bg-surface ${a.action === "platform.login_failed" ? "border-crit/40 text-crit" : "border-line text-ink-faint"}`}>
            <IconActivity width={14} height={14} />
          </span>
          <div className="min-w-0 pt-1">
            <p className="text-sm font-semibold">
              {ACTION[a.action] ?? a.action}
              {a.tenantName && <span className="font-normal text-ink-soft"> · {a.tenantName}</span>}
            </p>
            <p className="text-[11px] text-ink-faint">
              {a.actor} · {dateTime(a.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The platform's full admin log. */
export function PlatformAudit({ session }: { session: AdminSession }) {
  const { data, error } = useLoad(() => adminApi.platformAudit(session), "platform-audit");
  return (
    <Card className="max-w-3xl">
      <CardTitle>Every admin action, newest first</CardTitle>
      {error instanceof Error && <Notice tone="error">{error.message}</Notice>}
      <ActionList actions={data?.actions} />
    </Card>
  );
}
