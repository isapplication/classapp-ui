"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ApiError, endSession, streamLiveClass } from "../lib/api";
import type { LaunchResult, LiveParticipant, LiveSnapshot, ServerEvent } from "../lib/types";
import { IconEye, IconMic, IconUsers, IconVideoOff } from "./icons";
import { Button, Card, CardTitle, Chip, LiveBadge, StatTile, type Tone } from "./ui";

type Connection = "connecting" | "live" | "reconnecting" | "ended" | "denied";
const QUIET_AFTER_MS = 90_000;

/** Where the live roster comes from: the teacher's own launch, or an administrator watching a class. */
export type LiveSource = {
  /** Changes when the class changes; the stream restarts. */
  key: string;
  /** Hidden from the roster (the teacher themself). */
  selfId?: string;
  stream: (onMessage: (event: string, data: string) => void, signal: AbortSignal) => Promise<void>;
  end: () => Promise<unknown>;
};

export function launchSource(launch: LaunchResult): LiveSource {
  return {
    key: launch.session.id,
    selfId: launch.participant.id,
    stream: (onMessage, signal) => streamLiveClass(launch, onMessage, signal),
    end: () => endSession(launch),
  };
}

/** The teacher's live roster: a snapshot, then every stored event as it happens (server-sent events). */
export function HostLive({
  launch,
  source: given,
  heading = true,
}: {
  launch?: LaunchResult;
  source?: LiveSource;
  heading?: boolean;
}) {
  const source = given ?? launchSource(launch!);
  const stream = useEffectEvent(source.stream);
  const [people, setPeople] = useState<Record<string, LiveParticipant>>({});
  const [connection, setConnection] = useState<Connection>("connecting");
  const [summary, setSummary] = useState<ServerEvent["summary"]>();
  const [now, setNow] = useState(() => Date.now());
  const [confirmEnd, setConfirmEnd] = useState(false);
  const ended = useRef(false);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let stopped = false;
    let controller = new AbortController();
    let known = new Set<string>();
    let resync = false;
    let failures = 0;

    const onMessage = (event: string, data: string) => {
      if (event === "snapshot") {
        const snapshot = JSON.parse(data) as LiveSnapshot;
        known = new Set(snapshot.participants.map((p) => p.id));
        setPeople(Object.fromEntries(snapshot.participants.map((p) => [p.id, p])));
        setConnection("live");
        failures = 0;
        return;
      }
      if (event !== "event") return;
      const e = JSON.parse(data) as ServerEvent;
      if (e.event === "session.ended") {
        ended.current = true;
        setSummary(e.summary);
        setConnection("ended");
        return;
      }
      const id = e.participant?.id;
      if (!id) return;
      if (!known.has(id)) {
        // Someone new joined: reload the snapshot to learn their name.
        resync = true;
        controller.abort();
        return;
      }
      setPeople((current) => {
        const p = current[id];
        if (!p) return current;
        const next: LiveParticipant = { ...p, consent: e.participant?.consent ?? p.consent };
        if (e.event === "participant.left") {
          next.leftAt = e.capturedAt;
          next.leftReason = e.reason ?? null;
        } else {
          next.lastSeenAt = e.capturedAt;
          if (e.event === "participant.joined") {
            next.leftAt = null;
            next.leftReason = null;
          }
          if (e.signals) next.signals = e.signals;
        }
        return { ...current, [id]: next };
      });
    };

    (async () => {
      while (!stopped && !ended.current) {
        controller = new AbortController();
        try {
          await stream(onMessage, controller.signal);
        } catch (e) {
          if (e instanceof ApiError && e.code === "session_ended") {
            ended.current = true;
            setConnection("ended");
            return;
          }
          if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
            setConnection("denied");
            return;
          }
        }
        if (stopped || ended.current) return;
        if (resync) {
          resync = false;
          continue;
        }
        failures += 1;
        setConnection("reconnecting");
        await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** failures, 15_000)));
      }
    })();

    return () => {
      stopped = true;
      controller.abort();
    };
  }, [source.key]);

  // The teacher is not a student: hide them (by id for the teacher's own view, by role for observers).
  const list = Object.values(people).filter((p) => (source.selfId ? p.id !== source.selfId : p.role !== "host"));
  const present = list.filter((p) => !p.leftAt);
  const engaged = present.filter((p) => p.signals?.camera === "on" && p.signals.look === "at_screen").length;
  const speaking = present.filter((p) => p.signals?.camera === "on" && p.signals.speaking).length;
  const camerasOff = present.filter((p) => p.signals?.camera !== "on").length;

  const badge: Record<Connection, [string, Tone]> = {
    connecting: ["Connecting", "neutral"],
    live: ["Live", "good"],
    reconnecting: ["Reconnecting", "warn"],
    ended: ["Class ended", "neutral"],
    denied: ["No access", "bad"],
  };

  async function end() {
    setConfirmEnd(false);
    await source.end().catch(() => undefined);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {heading && <h2 className="text-base font-bold">Whole class</h2>}
          <p className="text-xs text-ink-faint">Observable facts from each student&apos;s own device.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LiveBadge tone={badge[connection][1]} pulse={connection === "live"}>
            {badge[connection][0].toUpperCase()}
          </LiveBadge>
          {connection !== "ended" &&
            (confirmEnd ? (
              <>
                <Button variant="danger" onClick={end}>
                  Confirm end
                </Button>
                <Button onClick={() => setConfirmEnd(false)}>Cancel</Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmEnd(true)}>
                End class
              </Button>
            ))}
        </div>
      </div>

      <div className="@container">
        <div className="grid grid-cols-2 gap-3 @xl:grid-cols-4">
          <StatTile label="Present" value={`${present.length}/${list.length}`} icon={<IconUsers />} />
          <StatTile label="Facing screen" value={engaged} tone="good" icon={<IconEye />} />
          <StatTile label="Speaking" value={speaking} icon={<IconMic />} />
          <StatTile label="Cameras off" value={camerasOff} tone={camerasOff > 0 ? "bad" : "neutral"} icon={<IconVideoOff />} />
        </div>
      </div>

      {summary && (
        <Card>
          <CardTitle>Class ended</CardTitle>
          <p className="text-sm text-ink-soft">
            {summary.participants} participants · {summary.events} events · {Math.round(summary.durationSeconds / 60)} minutes
          </p>
        </Card>
      )}

      <Card>
        <CardTitle aside={<span className="text-xs font-semibold text-ink-faint tabular-nums">{list.length} students</span>}>Students</CardTitle>
        {list.length === 0 ? (
          <div className="grid place-items-center rounded-lg border border-dashed border-line px-4 py-10 text-center">
            <IconUsers className="mb-2 text-ink-faint" width={26} height={26} />
            <p className="text-sm font-semibold">{connection === "connecting" ? "Loading the class…" : "No students yet"}</p>
            {connection !== "connecting" && (
              <p className="mt-1 max-w-xs text-xs text-ink-faint">Students appear here as they open their class link.</p>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
            {list.map((p) => (
              <Student key={p.id} person={p} now={now} />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

const LEFT_REASON: Record<string, string> = {
  closed: "closed the app",
  timeout: "connection lost",
  network_lost: "network lost",
  crashed: "app crashed",
  kicked: "removed",
  ended: "class ended",
};

function Student({ person, now }: { person: LiveParticipant; now: number }) {
  const s = person.signals;
  const chips: [string, Tone][] = [];
  if (person.leftAt) {
    chips.push([`Left · ${LEFT_REASON[person.leftReason ?? ""] ?? "unknown"}`, "neutral"]);
  } else if (person.consent === "declined") {
    chips.push(["Analytics off", "neutral"]);
  } else if (!s || s.camera !== "on") {
    chips.push(["Camera off", "bad"]);
  } else {
    if (s.look === "at_screen") chips.push(["Facing screen", "good"]);
    else if (s.look === "away") chips.push(["Looking away", "warn"]);
    else chips.push(["No face", "warn"]);
    if ((s.peopleAtCamera ?? 1) > 1) chips.push([`${s.peopleAtCamera} people`, "warn"]);
    if (s.speaking) chips.push(["Speaking", "good"]);
  }
  if (!person.leftAt && now - Date.parse(person.lastSeenAt) > QUIET_AFTER_MS) chips.push(["Quiet", "warn"]);
  const label = person.name ?? person.externalId;
  const flagged = !person.leftAt && (!s || s.camera !== "on") && person.consent !== "declined";

  return (
    <li
      className={`rounded-lg border bg-surface p-3 transition hover:-translate-y-0.5 hover:shadow-card ${flagged ? "border-crit/40 bg-crit/5" : "border-line"} ${person.leftAt ? "opacity-60" : ""}`}
    >
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">
          {label.charAt(0).toUpperCase()}
        </span>
        <span className="truncate text-sm font-bold">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map(([text, tone]) => (
          <Chip key={text} tone={tone}>
            {text}
          </Chip>
        ))}
      </div>
    </li>
  );
}
