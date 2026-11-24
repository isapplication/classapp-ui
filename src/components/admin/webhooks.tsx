"use client";

import { useState } from "react";
import { adminApi, type Delivery } from "@/lib/admin-api";
import type { AdminSession } from "@/lib/admin-session";
import { dateTime } from "@/lib/format";
import { useLoad } from "@/lib/use-load";
import { Button, Card, Chip } from "../ui";
import { Notice } from "./fields";

/** One school's webhook deliveries (all or failed), with re-send. */
export function TenantWebhooks({ session, tenantId }: { session: AdminSession; tenantId: string }) {
  const [filter, setFilter] = useState<"all" | "failed">("failed");
  const list = useLoad(() => adminApi.deliveries(session, tenantId, filter), `deliveries:${tenantId}:${filter}`);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function resend(id?: number) {
    setStatus(null);
    try {
      const r = await adminApi.resend(session, tenantId, id);
      setStatus({ tone: "success", text: `${r.queued} ${r.queued === 1 ? "delivery" : "deliveries"} queued again.` });
      list.reload();
    } catch (e) {
      setStatus({ tone: "error", text: e instanceof Error ? e.message : "Could not re-send." });
    }
  }

  const failed = list.data?.deliveries.filter((d) => isFailed(d)).length ?? 0;
  return (
    <Card className="p-0 sm:p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <div className="flex rounded-lg border border-line bg-surface-2 p-0.5" role="tablist" aria-label="Deliveries">
          {(["failed", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`min-h-8 rounded-md px-3 text-[13px] font-semibold capitalize transition ${filter === f ? "bg-surface text-ink shadow-card" : "text-ink-soft hover:text-ink"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button className="ml-auto" disabled={failed === 0} onClick={() => void resend()}>
          Re-send all failed
        </Button>
      </div>
      {status && (
        <div className="px-4 pt-3">
          <Notice tone={status.tone}>{status.text}</Notice>
        </div>
      )}
      <DeliveryTable deliveries={list.data?.deliveries} showSchool={false} onResend={(d) => void resend(d.id)} empty={filter === "failed" ? "No failed deliveries." : "No deliveries yet. Set a webhook URL in Settings."} />
    </Card>
  );
}

/** Failed deliveries across every school (platform admins). */
export function FailedWebhooks({ session }: { session: AdminSession }) {
  const list = useLoad(() => adminApi.failedWebhooks(session), "failed-webhooks");
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function resend(d: Delivery) {
    setStatus(null);
    try {
      await adminApi.resend(session, d.tenantId, d.id);
      setStatus({ tone: "success", text: `Delivery #${d.id} to ${d.tenantName} queued again.` });
      list.reload();
    } catch (e) {
      setStatus({ tone: "error", text: e instanceof Error ? e.message : "Could not re-send." });
    }
  }

  return (
    <Card className="p-0 sm:p-0">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-bold">Deliveries that failed or are retrying</h2>
      </div>
      {list.error instanceof Error && (
        <div className="p-4">
          <Notice tone="error">{list.error.message}</Notice>
        </div>
      )}
      {status && (
        <div className="px-4 pt-3">
          <Notice tone={status.tone}>{status.text}</Notice>
        </div>
      )}
      <DeliveryTable deliveries={list.data?.deliveries} showSchool onResend={(d) => void resend(d)} empty="No failed deliveries. Every webhook got through." />
    </Card>
  );
}

function isFailed(d: Delivery) {
  return !d.deliveredAt && (d.dead || d.attempts > 0);
}

function DeliveryTable({ deliveries, showSchool, onResend, empty }: { deliveries: Delivery[] | undefined; showSchool: boolean; onResend: (d: Delivery) => void; empty: string }) {
  if (!deliveries) return <p className="px-4 py-8 text-center text-sm text-ink-soft">Loading…</p>;
  if (deliveries.length === 0) return <p className="px-4 py-8 text-center text-sm text-ink-soft">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-line bg-surface-2/60 text-[11px] uppercase tracking-wider text-ink-faint">
          <tr>
            <th className="px-4 py-3 font-semibold">Event</th>
            {showSchool && <th className="px-4 py-3 font-semibold">School</th>}
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Last error</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => (
            <tr key={d.id} className="border-b border-line last:border-0 hover:bg-surface-2">
              <td className="px-4 py-3">
                <p className="font-semibold">{d.eventType}</p>
                <p className="text-xs text-ink-faint">#{d.id}</p>
              </td>
              {showSchool && <td className="px-4 py-3 text-ink-soft">{d.tenantName}</td>}
              <td className="px-4 py-3 tabular-nums text-ink-soft">{dateTime(d.createdAt)}</td>
              <td className="px-4 py-3">
                {d.deliveredAt ? (
                  <Chip tone="good">Delivered</Chip>
                ) : d.dead ? (
                  <Chip tone="bad">Gave up · {d.attempts} tries</Chip>
                ) : d.attempts > 0 ? (
                  <Chip tone="warn">Retrying · {d.attempts} tries</Chip>
                ) : (
                  <Chip tone="neutral">Queued</Chip>
                )}
              </td>
              <td className="max-w-64 truncate px-4 py-3 text-xs text-ink-soft" title={d.lastError ?? ""}>
                {d.lastError ?? "–"}
              </td>
              <td className="px-4 py-3 text-right">
                {isFailed(d) && (
                  <Button className="min-h-8 px-3 text-xs" onClick={() => onResend(d)}>
                    Re-send
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
