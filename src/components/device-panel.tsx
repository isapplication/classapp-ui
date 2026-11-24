"use client";

import { useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { ApiError, sendDeviceEvent } from "../lib/api";
import { useDeviceSignals, type CaptureStatus } from "../lib/capture";
import type { Consent, DeviceEvent, LaunchResult, Signals } from "../lib/types";
import {
  IconCheck,
  IconClock,
  IconCompass,
  IconEye,
  IconLogOut,
  IconMic,
  IconShield,
  IconUser,
  IconUsers,
  IconVideo,
  IconVideoOff,
  IconWifi,
} from "./icons";
import { Button, Card, CardTitle, LiveBadge, StatusRow, type Tone } from "./ui";

const HEARTBEAT_MS = 60_000;
const CAMERA_OFF: Signals = { camera: "off" };

const STATUS_NOTE: Record<CaptureStatus, string> = {
  off: "Analytics are off. Only “analytics off” is shared.",
  starting: "Starting your camera and microphone…",
  live: "Computed on this device. No video or audio leaves it.",
  blocked: "Camera or microphone is blocked. Allow them from the icon in the address bar, then turn analytics on again.",
  error: "Analysis couldn't start on this device. You're still in the class.",
};

/** This participant's own device: consent, on-device capture, and the events it sends. */
export function DevicePanel({
  launch,
  initialConsent,
  compact = false,
  blockedHelp,
  cameraRetry = 0,
}: {
  launch: LaunchResult;
  initialConsent: Consent;
  compact?: boolean;
  /** Shown when the camera is blocked, e.g. a button to grant access (the extension's side panel can't prompt). */
  blockedHelp?: ReactNode;
  /** Bump to retry the camera after access was granted elsewhere. */
  cameraRetry?: number;
}) {
  const [consent, setConsent] = useState<Consent>(initialConsent);
  const [cameraOn, setCameraOn] = useState(initialConsent === "granted");
  const [ended, setEnded] = useState(false);
  const [left, setLeft] = useState(false);
  const [offline, setOffline] = useState(false);
  const active = !ended && !left;
  const capturing = consent === "granted" && cameraOn && active;

  function send(event: DeviceEvent, keepalive = false) {
    sendDeviceEvent(launch, event, keepalive)
      .then(() => setOffline(false))
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.code === "session_ended") setEnded(true);
        else if (e instanceof ApiError && e.code === "unreachable") setOffline(true);
      });
  }

  const { videoRef, status, signals: s, level, latest } = useDeviceSignals(
    capturing,
    (changed, signals) => send({ type: "analytics.changed", consent, changed, signals }),
    cameraRetry,
  );

  // Presence: a heartbeat every minute, whatever the camera state, so the class knows we're here.
  const beat = useEffectEvent(() => {
    if (!active) return;
    send({ type: "participant.heartbeat", consent, signals: capturing ? latest.current : CAMERA_OFF });
  });
  useEffect(() => {
    beat();
    const id = window.setInterval(() => beat(), HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, []);

  // Closing the tab or window reports the leave reason.
  const pageHide = useEffectEvent(() => {
    if (active) sendDeviceEvent(launch, { type: "participant.left", consent, reason: "closed" }, true).catch(() => undefined);
  });
  useEffect(() => {
    const onHide = () => pageHide();
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  // If the browser refuses the camera, tell the class the camera is off.
  const reportCameraFailure = useEffectEvent(() => {
    send({ type: "analytics.changed", consent, changed: CAMERA_OFF, signals: CAMERA_OFF });
  });
  useEffect(() => {
    if (status === "blocked" || status === "error") reportCameraFailure();
  }, [status]);

  function turnOff() {
    setCameraOn(false);
    send({ type: "analytics.changed", consent, changed: CAMERA_OFF, signals: CAMERA_OFF });
  }

  function turnOn() {
    setConsent("granted");
    setCameraOn(true);
  }

  function leave() {
    send({ type: "participant.left", consent, reason: "closed" });
    setLeft(true);
  }

  if (!active) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-surface-2 text-ink-soft">
          <IconCheck />
        </span>
        <h2 className="text-base font-bold">{ended ? "This class has ended" : "You left the class"}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {ended ? "Thanks for joining. You can close this window." : "You can close this window."}
        </p>
      </Card>
    );
  }

  const live = status === "live";
  const failed = status === "blocked" || status === "error";
  const chip: [string, Tone] = !capturing
    ? ["ANALYTICS OFF", "neutral"]
    : live
      ? ["ANALYTICS ON", "good"]
      : failed
        ? ["CAMERA BLOCKED", "bad"]
        : ["STARTING", "neutral"];
  const look: [string, Tone] =
    s.look === "at_screen" ? ["At screen", "good"] : s.look === "away" ? ["Away", "warn"] : ["No face", "bad"];
  const head = s.headDirection === "center" ? "Center" : s.headDirection === "left" ? "Left" : s.headDirection === "right" ? "Right" : "None";
  const people = s.peopleAtCamera ?? 0;
  const bars = Math.min(5, Math.round(level * 45));
  const pending: [string, Tone] = ["Waiting", "neutral"];

  return (
    <div className="@container">
      <div className="grid items-start gap-4 @2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card className="p-3 sm:p-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-950">
            {/* Always mounted, so the camera stream has somewhere to go the moment capture starts. */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`size-full -scale-x-100 object-cover ${capturing && !failed ? "" : "invisible"}`}
            />
            {!(capturing && !failed) && (
              <div className="absolute inset-0 grid place-items-center text-center text-slate-300">
                <div className="space-y-2 px-6">
                  <IconVideoOff className="mx-auto" width={30} height={30} />
                  <p className="text-sm font-semibold">{failed ? "Camera unavailable" : "Camera is off"}</p>
                  <p className="text-xs text-slate-400">Nothing is analysed or shared while it is off.</p>
                </div>
              </div>
            )}
            <span className="absolute top-3 left-3">
              <LiveBadge tone={chip[1]} pulse={live}>
                {chip[0]}
              </LiveBadge>
            </span>
            {live && (
              <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                <IconShield width={13} height={13} />
                On this device only
              </span>
            )}
          </div>
          {capturing && failed && blockedHelp && <div className="mt-3">{blockedHelp}</div>}
        </Card>

        <Card className="flex flex-col">
          <CardTitle aside={<span className="text-[11px] font-semibold text-ink-faint">Updates live</span>}>
            {compact ? "Your device" : "Your focus, from this device"}
          </CardTitle>

          <div className="space-y-2">
            <StatusRow
              icon={<IconUser width={16} height={16} />}
              label="Face detected"
              {...(live ? { value: s.facePresent ? "Yes" : "No", tone: s.facePresent ? "good" : "bad" } : { value: pending[0], tone: pending[1] })}
            />
            <StatusRow icon={<IconEye width={16} height={16} />} label="Looking" value={live ? look[0] : pending[0]} tone={live ? look[1] : pending[1]} />
            <StatusRow
              icon={<IconCompass width={16} height={16} />}
              label="Head direction"
              value={live ? head : pending[0]}
              tone={live ? (s.headDirection === "center" ? "good" : "warn") : pending[1]}
            />
            <StatusRow
              icon={<IconUsers width={16} height={16} />}
              label="People at camera"
              value={live ? String(people) : pending[0]}
              tone={live ? (people === 1 ? "good" : people === 0 ? "bad" : "warn") : pending[1]}
            />
            <StatusRow
              icon={<IconMic width={16} height={16} />}
              label="Speaking"
              value={live ? (s.speaking ? "Speaking" : "Quiet") : pending[0]}
              tone={live && s.speaking ? "good" : "neutral"}
              extra={
                live && (
                  <span aria-hidden className="flex h-4 items-end gap-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <i key={i} className={`block w-1 rounded-sm transition-colors ${i < bars ? "bg-live" : "bg-line"}`} style={{ height: `${30 + i * 16}%` }} />
                    ))}
                  </span>
                )
              }
            />
            <StatusRow
              icon={<IconClock width={16} height={16} />}
              label="Speaking time"
              value={live ? formatSeconds(s.speakingSeconds ?? 0) : pending[0]}
              tone="neutral"
            />
            <StatusRow
              icon={<IconWifi width={16} height={16} />}
              label="Network"
              value={live && s.network ? `${s.network.type.toUpperCase()}${s.network.downlinkMbps ? ` · ${s.network.downlinkMbps} Mbps` : ""}` : live ? "Unknown" : pending[0]}
              tone={live && s.network ? (s.network.type === "4g" ? "good" : "warn") : "neutral"}
            />
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ink-faint" aria-live="polite">
            {capturing ? STATUS_NOTE[status] : STATUS_NOTE.off}
            {offline && " Reconnecting to the class server…"}
          </p>

          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {capturing ? (
              <Button onClick={turnOff}>
                <IconVideoOff width={16} height={16} />
                Turn analytics off
              </Button>
            ) : (
              <Button variant="primary" onClick={turnOn}>
                <IconVideo width={16} height={16} />
                Turn analytics on
              </Button>
            )}
            {!compact && (
              <Button variant="danger" onClick={leave}>
                <IconLogOut width={16} height={16} />
                Leave class
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function formatSeconds(total: number) {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
