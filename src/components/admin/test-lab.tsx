"use client";

/**
 * Embedded test lab — same link-generation as /test but auto-connects from the current session.
 * Platform admins: auto-creates / reuses a disposable test school.
 * School admins: reuses a cached test school if one was set up by a platform admin on this device.
 */

import { useEffect, useState } from "react";
import { EncryptJWT, base64url } from "jose";
import { getApiUrl } from "@/lib/api";
import type { AdminSession } from "@/lib/admin-session";
import { Button, Spinner } from "../ui";
import { Notice } from "./fields";

// ── types ──────────────────────────────────────────────────────────────────
type School = { api: string; web: string; id: string; name: string; slug: string; launchKey: string };

function authHeaders(session: AdminSession): Record<string, string> {
  if (session.kind === "key") return { "X-Admin-Key": session.key };
  return { Authorization: `Bearer ${session.token}` };
}

function storageKey(api: string) {
  return `classapp_testlab_${api}`;
}

// ── name pools ─────────────────────────────────────────────────────────────
const FIRST = ["Riya", "Kabir", "Meera", "Arjun", "Priya", "Dev", "Ananya", "Rahul", "Sneha", "Vikram", "Pooja", "Rohan"];
const LAST  = ["Sharma", "Patel", "Kumar", "Singh", "Verma", "Joshi", "Gupta", "Rao", "Mehta", "Nair"];
function randomName() {
  return `${FIRST[Math.floor(Math.random() * FIRST.length)]} ${LAST[Math.floor(Math.random() * LAST.length)]}`;
}

// ── small atoms ────────────────────────────────────────────────────────────
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-faint">{hint}</p>}
    </div>
  );
}

function TInput({ value, onChange, placeholder, mono, disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean; disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none disabled:opacity-50 ${mono ? "font-mono text-xs" : ""}`}
    />
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); }}
      className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${done ? "border-live/40 bg-live/10 text-live" : "border-line bg-surface text-ink-soft hover:text-ink"}`}
    >
      {done ? "✓ Copied" : "Copy link"}
    </button>
  );
}

function LinkCard({ role, name, url }: { role: "host" | "attendee"; name: string; url: string }) {
  const isHost = role === "host";
  return (
    <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${isHost ? "bg-accent/10 text-accent" : "bg-live/10 text-live"}`}>
            {role}
          </span>
          <span className="text-sm font-medium">{name}</span>
        </div>
        <div className="flex gap-2">
          <CopyBtn text={url} />
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink">
            Open ↗
          </a>
        </div>
      </div>
      <p className="break-all font-mono text-[11px] leading-relaxed text-ink-faint">
        {url.length > 90 ? url.slice(0, 90) + "…" : url}
      </p>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export function TestLab({ session, isPlatformAdmin }: { session: AdminSession; isPlatformAdmin: boolean }) {
  const [school,        setSchool]        = useState<School | null>(null);
  const [connecting,    setConnecting]    = useState(true);
  const [connectError,  setConnectError]  = useState("");
  const [meetingUrl,    setMeetingUrl]    = useState("https://meet.google.com/abc-defg-hij");
  const [sessionId,     setSessionId]     = useState("");
  const [locked,        setLocked]        = useState(false);
  const [hostName,      setHostName]      = useState("Ms. Sharma");
  const [attendeeName,  setAttendeeName]  = useState("Riya Patel");
  const [links,         setLinks]         = useState<{ host: string; attendee: string } | null>(null);
  const [generating,    setGenerating]    = useState(false);
  const [genError,      setGenError]      = useState("");

  useEffect(() => {
    void autoConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function autoConnect() {
    setConnecting(true);
    setConnectError("");
    const api = getApiUrl();
    const web = window.location.origin;
    const headers = authHeaders(session);

    // try reusing saved test school
    try {
      const raw = localStorage.getItem(storageKey(api));
      if (raw) {
        const s: School = JSON.parse(raw) as School;
        const r = await fetch(`${api}/admin/tenants/${s.id}`, { headers }).catch(() => null);
        if (r?.ok) { setSchool({ ...s, api, web }); setConnecting(false); return; }
        localStorage.removeItem(storageKey(api));
      }
    } catch { /* storage unavailable */ }

    if (!isPlatformAdmin) {
      setConnectError("No test school is set up yet. Ask a platform admin to open Test Lab once to create one.");
      setConnecting(false);
      return;
    }

    // platform admin: create a fresh test school
    const r = await fetch(`${api}/admin/tenants`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test School",
        slug: `test-${Math.random().toString(36).slice(2, 6)}`,
        contactEmail: "test@test.example",
        chatSupportUrl: "https://example.com/support",
        branding: { primaryColor: "#2563eb" },
      }),
    }).catch(() => null);

    if (!r?.ok) {
      setConnectError(r ? `${r.status}: ${await r.text()}` : "Server unreachable.");
      setConnecting(false);
      return;
    }
    const t = await r.json() as { id: string; name: string; slug: string; launchKey: string };
    const s: School = { api, web, id: t.id, name: t.name, slug: t.slug, launchKey: t.launchKey };
    try { localStorage.setItem(storageKey(api), JSON.stringify(s)); } catch { /* storage unavailable */ }
    setSchool(s);
    setConnecting(false);
  }

  async function generate() {
    if (!school) return;
    setGenerating(true);
    setGenError("");
    setLinks(null);
    try {
      const key = base64url.decode(school.launchKey);
      const sid = locked && sessionId ? sessionId : crypto.randomUUID();
      if (!locked || !sessionId) setSessionId(sid);
      const makeToken = async (role: "host" | "attendee", name: string, pid: string) =>
        `${school.web}/join#token=` + await new EncryptJWT({
          meetingUrl, role, name, meetingTitle: "Test Session", sessionId: sid, participantId: pid,
        })
          .setProtectedHeader({ alg: "dir", enc: "A256GCM", kid: school.id })
          .setJti(crypto.randomUUID())
          .setIssuedAt()
          .setExpirationTime("10m")
          .encrypt(key);
      const [host, attendee] = await Promise.all([
        makeToken("host",     hostName,     `host-${Date.now()}`),
        makeToken("attendee", attendeeName, `attendee-${Date.now() + 1}`),
      ]);
      setLinks({ host, attendee });
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Token generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  // ── loading / error states ─────────────────────────────────────────────
  if (connecting) {
    return (
      <div className="flex items-center gap-3 text-sm text-ink-soft">
        <Spinner />
        Setting up test school…
      </div>
    );
  }

  if (connectError) {
    return (
      <div className="max-w-lg space-y-4">
        <Notice tone="error">{connectError}</Notice>
        <Button onClick={() => void autoConnect()}>Retry</Button>
      </div>
    );
  }

  // ── session builder ────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6">
      {/* school badge */}
      <div className="flex items-center gap-2 text-sm">
        <span className="size-2 shrink-0 rounded-full bg-live shadow-[0_0_6px_currentColor] text-live" />
        <span className="text-ink-soft">Connected to</span>
        <span className="font-semibold">{school!.name}</span>
        <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-soft">{school!.slug}</code>
      </div>

      {/* meeting URL */}
      <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">Session</p>
        <Row label="Meeting URL" hint="Zoom, Meet, Teams, anything">
          <TInput value={meetingUrl} onChange={setMeetingUrl} mono placeholder="https://meet.google.com/…" />
        </Row>

        <Row label="Session ID">
          <div className="flex gap-2">
            <div className="flex-1">
              <TInput value={sessionId} onChange={(v) => { setSessionId(v); setLocked(true); }} mono
                placeholder="auto-generated on each run" />
            </div>
            <button type="button" onClick={() => setLocked((l) => !l)} title={locked ? "Unpin" : "Lock session ID"}
              className={`rounded-lg border px-3 text-base transition-colors ${locked ? "border-accent/40 bg-accent/10 text-accent" : "border-line bg-surface-2 text-ink-faint hover:text-ink"}`}>
              {locked ? "🔒" : "🔓"}
            </button>
            <Button variant="secondary" onClick={() => { setSessionId(crypto.randomUUID()); setLocked(false); }}>New</Button>
          </div>
        </Row>

        <div className="grid grid-cols-2 gap-4">
          <Row label="Host name">
            <div className="flex gap-2">
              <div className="flex-1"><TInput value={hostName} onChange={setHostName} /></div>
              <button type="button" onClick={() => setHostName(randomName())} title="Random"
                className="rounded-lg border border-line bg-surface-2 px-3 text-base hover:bg-surface">🎲</button>
            </div>
          </Row>
          <Row label="Attendee name">
            <div className="flex gap-2">
              <div className="flex-1"><TInput value={attendeeName} onChange={setAttendeeName} /></div>
              <button type="button" onClick={() => setAttendeeName(randomName())} title="Random"
                className="rounded-lg border border-line bg-surface-2 px-3 text-base hover:bg-surface">🎲</button>
            </div>
          </Row>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={() => void generate()} disabled={!meetingUrl || generating}>
            {generating ? "Generating…" : "Generate Links"}
          </Button>
          {genError && <span className="text-xs text-crit">{genError}</span>}
        </div>
      </div>

      {/* output links */}
      {links && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">
            Join Links
            <span className="ml-2 font-normal normal-case tracking-normal text-ink-faint">
              — valid 10 min · session <code className="font-mono">{sessionId.slice(0, 8)}…</code>
            </span>
          </p>
          <LinkCard role="host"     name={hostName}     url={links.host} />
          <LinkCard role="attendee" name={attendeeName} url={links.attendee} />
          <p className="rounded-xl border border-live/20 bg-live/5 px-4 py-3 text-xs text-ink-soft leading-relaxed">
            Open both links in separate tabs to simulate a real session.
            Links expire in 10 min — click Generate Links again for fresh ones.
            {!locked && " Each Generate creates a new Session ID — press 🔒 to keep host + attendee in the same session."}
          </p>
        </div>
      )}
    </div>
  );
}
