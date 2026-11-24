"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getApiUrl, streamEvents } from "@/lib/api";
import { adminApi, authHeaders, downloadClass, type ClassEvent } from "@/lib/admin-api";
import type { AdminSession } from "@/lib/admin-session";
import { PROVIDER, dateTime, duration, since, time } from "@/lib/format";
import { useLoad } from "@/lib/use-load";
import { HostLive, type LiveSource } from "../host-live";
import { IconArrowLeft, IconClock, IconExternal, IconUsers, IconVideo } from "../icons";
import { Button, Card, Chip, Dot, StatTile } from "../ui";
import { Notice } from "./fields";

const EVENT_TYPES = ["session.started", "participant.joined", "analytics.changed", "participant.heartbeat", "participant.left", "session.ended"];

/** One class: who attended, every event, downloads, and (while live) watch or end it. */
export function ClassDetail({ session, tenantId, sessionId, watch }: { session: AdminSession; tenantId: string; sessionId: string; watch: boolean }) {
  const detail = useLoad(() => adminApi.classDetail(session, tenantId, sessionId), `class:${sessionId}`);
  const [error, setError] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const base = `/admin?tenant=${tenantId}&section=classes`;

  if (detail.error instanceof Error && !detail.data) return <Notice tone="error">{detail.error.message}</Notice>;
  if (!detail.data) return <p className="text-sm text-ink-soft">Loading…</p>;
  const c = detail.data.session;
  const live = !c.endedAt;

  async function end() {
    setConfirmEnd(false);
    try {
      await adminApi.endClass(session, tenantId, sessionId);
      detail.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not end the class.");
    }
  }

  async function download(format: "json" | "csv") {
    setError(null);
    try {
      await downloadClass(session, tenantId, sessionId, format);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    }
  }

  return (
    <section className="space-y-5">
      <Link href={watch ? `${base}&class=${sessionId}` : base} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-accent hover:underline">
        <IconArrowLeft width={16} height={16} />
        {watch ? "Class detail" : "All classes"}
      </Link>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-4 shadow-card">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold">{c.title ?? c.externalId}</p>
          <p className="truncate text-xs text-ink-faint">
            {c.tenantName} · {PROVIDER[c.provider] ?? c.provider} · {c.externalId} · started {dateTime(c.startedAt)}
          </p>
        </div>
        {live ? (
          <Chip tone="good">
            <Dot tone="good" pulse /> Live
          </Chip>
        ) : (
          <Chip tone="neutral">Ended {dateTime(c.endedAt)}</Chip>
        )}
        <div className="flex flex-wrap gap-2">
          {live && !watch && (
            <Link
              href={`${base}&class=${sessionId}&watch=1`}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-accent bg-accent px-4 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <IconVideo width={16} height={16} />
              Watch live
            </Link>
          )}
          {live &&
            !watch &&
            (confirmEnd ? (
              <>
                <Button variant="danger" onClick={() => void end()}>
                  Confirm end
                </Button>
                <Button onClick={() => setConfirmEnd(false)}>Cancel</Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmEnd(true)}>
                End class
              </Button>
            ))}
          <Button onClick={() => void download("csv")}>
            <IconExternal width={16} height={16} />
            CSV
          </Button>
          <Button onClick={() => void download("json")}>
            <IconExternal width={16} height={16} />
            JSON
          </Button>
        </div>
      </div>
      {error && <Notice tone="error">{error}</Notice>}

      {watch && live ? (
        <WatchLive session={session} tenantId={tenantId} sessionId={sessionId} onEnded={detail.reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Participants" value={c.participants} icon={<IconUsers />} />
            <StatTile label={live ? "Online now" : "Duration"} value={live ? c.online : since(c.startedAt, c.endedAt)} icon={<IconClock />} />
            <StatTile label="Cameras on now" value={live ? c.camerasOn : "–"} icon={<IconVideo />} />
            <StatTile label="Provider" value={PROVIDER[c.provider] ?? c.provider} />
          </div>
          <Participants participants={detail.data.participants} />
          <Timeline session={session} tenantId={tenantId} sessionId={sessionId} participants={detail.data.participants} />
        </>
      )}
    </section>
  );
}

function WatchLive({ session, tenantId, sessionId, onEnded }: { session: AdminSession; tenantId: string; sessionId: string; onEnded: () => void }) {
  const source = useMemo<LiveSource>(
    () => ({
      key: `${tenantId}:${sessionId}`,
      stream: (onMessage, signal) =>
        streamEvents(`${getApiUrl()}/admin/tenants/${tenantId}/sessions/${sessionId}/live`, authHeaders(session), onMessage, signal),
      end: () => adminApi.endClass(session, tenantId, sessionId).then(onEnded),
    }),
    [session, tenantId, sessionId, onEnded],
  );
  return (
    <div className="space-y-3">
      <Notice tone="info">You are watching read-only. Your visit is recorded in the school&apos;s access log.</Notice>
      <HostLive source={source} heading={false} />
    </div>
  );
}

function Participants({ participants }: { participants: { id: string; externalId: string; role: string; name: string | null; consent: string; joinedAt: string; lastSeenAt: string; leftAt: string | null; leftReason: string | null; speakingSeconds: number; signals: Record<string, unknown> | null }[] }) {
  return (
    <Card className="p-0 sm:p-0">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-bold">Participants</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-surface-2/60 text-[11px] uppercase tracking-wider text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Consent</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Left</th>
              <th className="px-4 py-3 font-semibold">Last seen</th>
              <th className="px-4 py-3 font-semibold">Speaking</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3">
                  <p className="font-semibold">{p.name ?? p.externalId}</p>
                  <p className="text-xs text-ink-faint">{p.externalId}</p>
                </td>
                <td className="px-4 py-3 capitalize text-ink-soft">{p.role === "host" ? "Teacher" : "Student"}</td>
                <td className="px-4 py-3">
                  <Chip tone={p.consent === "granted" ? "good" : p.consent === "declined" ? "neutral" : "warn"}>{p.consent}</Chip>
                </td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{time(p.joinedAt)}</td>
                <td className="px-4 py-3 text-ink-soft">{p.leftAt ? `${time(p.leftAt)} · ${p.leftReason ?? "unknown"}` : "–"}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{time(p.lastSeenAt)}</td>
                <td className="px-4 py-3 tabular-nums">{duration(p.speakingSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Timeline({ session, tenantId, sessionId, participants }: { session: AdminSession; tenantId: string; sessionId: string; participants: { id: string; name: string | null; externalId: string }[] }) {
  const [type, setType] = useState("");
  const [participant, setParticipant] = useState("");
  const [extra, setExtra] = useState<{ events: ClassEvent[]; next: number; more: boolean } | null>(null);
  const first = useLoad(
    () => adminApi.classEvents(session, tenantId, sessionId, { type: type || undefined, participant: participant || undefined }),
    `events:${sessionId}:${type}:${participant}`,
  );
  const events = [...(first.data?.events ?? []), ...(extra?.events ?? [])];
  const more = extra ? extra.more : (first.data?.more ?? false);
  const next = extra ? extra.next : (first.data?.nextAfterSeq ?? 0);

  async function loadMore() {
    const page = await adminApi.classEvents(session, tenantId, sessionId, { afterSeq: next, type: type || undefined, participant: participant || undefined });
    setExtra({ events: [...(extra?.events ?? []), ...page.events], next: page.nextAfterSeq, more: page.more });
  }

  const select = "min-h-9 rounded-lg border border-line bg-surface-2 px-2 text-[13px] text-ink";
  return (
    <Card className="p-0 sm:p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <h2 className="mr-auto text-sm font-bold">Event timeline</h2>
        <select aria-label="Event type" className={select} value={type} onChange={(e) => { setType(e.target.value); setExtra(null); }}>
          <option value="">All events</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select aria-label="Participant" className={select} value={participant} onChange={(e) => { setParticipant(e.target.value); setExtra(null); }}>
          <option value="">Everyone</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>{p.name ?? p.externalId}</option>
          ))}
        </select>
      </div>
      {!first.data && first.loading ? (
        <p className="px-4 py-8 text-center text-sm text-ink-soft">Loading…</p>
      ) : events.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-soft">No events match.</p>
      ) : (
        <ol className="divide-y divide-line">
          {events.map((e) => (
            <li key={e.seq} className="grid grid-cols-[56px_88px_1fr] items-start gap-3 px-4 py-2.5 text-[13px] sm:grid-cols-[56px_88px_180px_1fr]">
              <span className="text-ink-faint tabular-nums">#{e.seq}</span>
              <span className="text-ink-soft tabular-nums">{time(e.capturedAt)}</span>
              <span className="font-semibold">
                {e.type}
                <span className="block text-xs font-normal text-ink-faint">{e.participantName ?? (e.participantId ? "" : "class")}</span>
              </span>
              <code className="col-span-3 break-all rounded bg-surface-2 px-2 py-1 font-mono text-[11.5px] text-ink-soft sm:col-span-1">
                {summary(e.payload)}
              </code>
            </li>
          ))}
        </ol>
      )}
      {more && (
        <div className="border-t border-line p-3 text-center">
          <Button onClick={() => void loadMore()}>Load more</Button>
        </div>
      )}
    </Card>
  );
}

/** The interesting part of an event's payload, compactly. */
function summary(payload: Record<string, unknown>) {
  const pick = payload.changed ?? payload.signals ?? payload.summary ?? (payload.reason ? { reason: payload.reason } : null);
  return pick ? JSON.stringify(pick) : "–";
}
