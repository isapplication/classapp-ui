"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ApiError, redeemLaunchToken } from "@/lib/api";
import { extensionInstalled, handOffToExtension } from "@/lib/extension";
import type { Consent, LaunchResult } from "@/lib/types";
import { ClassRoom } from "./class-room";
import { IconMonitor, IconX } from "./icons";
import { ConsentCard } from "./consent-card";
import { Button, Card, Spinner } from "./ui";
import { ThemeToggle } from "./theme-toggle";

type Phase =
  | { kind: "preparing" }
  | { kind: "failed"; title: string; message: string }
  | { kind: "consent"; launch: LaunchResult }
  | { kind: "handoff"; launch: LaunchResult }
  | { kind: "open-panel"; launch: LaunchResult }
  | { kind: "class"; launch: LaunchResult; consent: Consent };

const FAILURES: Record<string, [string, string]> = {
  no_token: ["This link is incomplete", "Open the class link your school sent you again."],
  token_already_used: ["This link was already used", "Each class link works once. Ask your school or teacher for a new one."],
  token_expired: ["This link has expired", "Class links expire after a few minutes. Ask your school or teacher for a new one."],
  invalid_token: ["This link isn't valid", "Open the class link your school sent you again, or ask for a new one."],
  unsupported_meeting_link: ["This class can't be opened here", "Its meeting link isn't a Zoom, Microsoft Teams or Google Meet link."],
  session_ended: ["This class has ended", "Your school will share the next class link."],
  rate_limited: ["Too many attempts", "Wait a minute, then open the link again."],
  unreachable: ["Can't reach the class server", "Check your internet connection, then open the link again."],
};

/** The launch token arrives in the URL fragment (never sent to any server), or a query parameter. */
function readToken(): string | null {
  const fromHash = new URLSearchParams(window.location.hash.slice(1)).get("token");
  return fromHash ?? new URLSearchParams(window.location.search).get("token");
}

const HEX = /^#[0-9a-f]{6}$/i;

export function JoinFlow() {
  const [phase, setPhase] = useState<Phase>({ kind: "preparing" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // the token is single-use: redeem it exactly once
    started.current = true;
    const token = readToken();
    window.history.replaceState(null, "", window.location.pathname); // drop it from the address bar and history
    const redeem = token ? redeemLaunchToken(token) : Promise.reject(new ApiError(0, "no_token", ""));
    redeem
      .then((launch) => setPhase({ kind: "consent", launch }))
      .catch((e: unknown) => {
        const code = e instanceof ApiError ? e.code : "unreachable";
        const [title, message] = FAILURES[code] ?? FAILURES.invalid_token;
        setPhase({ kind: "failed", title, message });
      });
  }, []);

  const launch = "launch" in phase ? phase.launch : null;

  useEffect(() => {
    if (!launch) return;
    document.title = [launch.meetingTitle, launch.tenant.name].filter(Boolean).join(" · ");
    const favicon = launch.tenant.branding.faviconUrl;
    if (favicon) {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']") ?? document.createElement("link");
      link.rel = "icon";
      link.href = favicon;
      document.head.appendChild(link);
    }
  }, [launch]);

  const accent = launch?.tenant.branding.primaryColor;
  const style = accent && HEX.test(accent) ? ({ "--accent": accent } as CSSProperties) : undefined;

  return (
    <div style={style} className="min-h-screen">
      <ThemeToggle className="fixed top-3 right-3 z-50 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-2.5 py-1.5 text-xs font-semibold text-ink-soft backdrop-blur transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />
      {phase.kind === "preparing" && (
        <Centered>
          <Spinner />
          <h1 className="mt-5 text-xl font-bold">Preparing your class…</h1>
          <p className="mt-1.5 max-w-xs text-sm text-ink-soft">
            Checking your class link. You&apos;ll be taken in as soon as it&apos;s ready.
          </p>
        </Centered>
      )}
      {phase.kind === "failed" && (
        <Centered>
          <Card className="view-in max-w-sm text-left shadow-lift">
            <span className="mb-3 grid size-10 place-items-center rounded-lg bg-crit/10 text-crit">
              <IconX />
            </span>
            <h1 className="text-lg font-bold">{phase.title}</h1>
            <p className="mt-1.5 text-sm text-ink-soft">{phase.message}</p>
          </Card>
        </Centered>
      )}
      {phase.kind === "consent" && (
        <Centered>
          <ConsentCard
            launch={phase.launch}
            onChoose={(consent) => {
              const chosen = phase.launch;
              if (!extensionInstalled()) {
                // No extension: the meeting opens in a new window and this page is the panel.
                window.open(chosen.meetingUrl, "_blank", "noopener,noreferrer");
                setPhase({ kind: "class", launch: chosen, consent });
                return;
              }
              // With the extension: its side panel shows the class, and this tab becomes the meeting.
              setPhase({ kind: "handoff", launch: chosen });
              void handOffToExtension(chosen, consent).then((result) => {
                if (result.delivered && result.panelOpened) window.location.assign(chosen.meetingUrl);
                else if (result.delivered) setPhase({ kind: "open-panel", launch: chosen });
                else setPhase({ kind: "class", launch: chosen, consent }); // extension didn't answer: in-page panel
              });
            }}
          />
        </Centered>
      )}
      {phase.kind === "handoff" && (
        <Centered>
          <Spinner />
          <h1 className="mt-5 text-xl font-bold">Opening your class panel…</h1>
        </Centered>
      )}
      {phase.kind === "open-panel" && (
        <Centered>
          <Card className="view-in max-w-sm text-left shadow-lift">
            <span className="mb-3 grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
              <IconMonitor />
            </span>
            <h1 className="text-lg font-bold">Open your class panel</h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              Click the MyClass icon in your browser&apos;s toolbar (under the puzzle piece if it isn&apos;t pinned).
              Your class panel opens on the side.
            </p>
            <Button variant="primary" className="mt-4" onClick={() => window.location.assign(phase.launch.meetingUrl)}>
              Continue to the meeting
            </Button>
          </Card>
        </Centered>
      )}
      {phase.kind === "class" && <ClassRoom launch={phase.launch} initialConsent={phase.consent} />}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_60%)] px-4 py-10 text-center"
      aria-live="polite"
    >
      {children}
    </main>
  );
}
