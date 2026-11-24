"use client";

import { useState, useEffect } from "react";
import { EncryptJWT, base64url } from "jose";

// ── random name pools ──────────────────────────────────────────────────────
const FIRST = ["Riya", "Kabir", "Meera", "Arjun", "Priya", "Dev", "Ananya", "Rahul", "Sneha", "Vikram", "Pooja", "Rohan"];
const LAST  = ["Sharma", "Patel", "Kumar", "Singh", "Verma", "Joshi", "Gupta", "Rao", "Mehta", "Nair"];
function randomName() {
  return `${FIRST[Math.floor(Math.random() * FIRST.length)]} ${LAST[Math.floor(Math.random() * LAST.length)]}`;
}

// ── types ──────────────────────────────────────────────────────────────────
type School = {
  api: string; id: string; name: string; slug: string;
  launchKey: string; apiKey: string; webhookSecret: string;
};
type Links = { host: string; attendee: string } | null;

// ── design tokens ──────────────────────────────────────────────────────────
const C = {
  bg:       "#0F172A",
  card:     "#1B2336",
  muted:    "#272F42",
  border:   "#334155",
  fg:       "#F8FAFC",
  fgMuted:  "#94A3B8",
  accent:   "#22C55E",
  accentBg: "#052e16",
  error:    "#EF4444",
  mono:     "'JetBrains Mono', 'Fira Mono', monospace",
  sans:     "'IBM Plex Sans', system-ui, sans-serif",
};

// ── reusable atoms ─────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
      textTransform: "uppercase", color: C.fgMuted, marginBottom: 6 }}>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder, mono, disabled }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%", boxSizing: "border-box", padding: "10px 12px",
        background: C.muted, border: `1px solid ${C.border}`, borderRadius: 8,
        color: C.fg, fontSize: mono ? 12 : 14, fontFamily: mono ? C.mono : C.sans,
        outline: "none", transition: "border-color 0.15s",
        opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "text",
      }}
      onFocus={e => { e.currentTarget.style.borderColor = C.accent; }}
      onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
    />
  );
}

function Btn({ onClick, children, variant = "primary", disabled, small }: {
  onClick: () => void; children: React.ReactNode;
  variant?: "primary" | "ghost"; disabled?: boolean; small?: boolean;
}) {
  const bg    = variant === "primary" ? C.accent : C.muted;
  const color = variant === "primary" ? "#052e16" : C.fg;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? "6px 12px" : "10px 20px",
      background: bg, color, border: "none", borderRadius: 8,
      fontSize: small ? 12 : 14, fontWeight: 600, fontFamily: C.sans,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      transition: "opacity 0.15s", whiteSpace: "nowrap",
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = "1"; }}
    >
      {children}
    </button>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={async () => {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    }} style={{
      padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
      border: `1px solid ${done ? C.accent : C.border}`,
      background: done ? C.accentBg : C.muted, color: done ? C.accent : C.fg,
      cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
    }}>
      {done ? "✓ Copied" : "Copy link"}
    </button>
  );
}

function LinkCard({ role, name, url }: { role: "host" | "attendee"; name: string; url: string }) {
  const isHost = role === "host";
  const color  = isHost ? "#60A5FA" : C.accent;
  const display = url.length > 76 ? url.slice(0, 76) + "…" : url;
  return (
    <div style={{ padding: "16px 20px", borderRadius: 12, border: `1px solid ${C.border}`,
      background: C.card, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            background: isHost ? "#1e3a5f" : C.accentBg, color }}>
            {role}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: C.fg }}>{name}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <CopyBtn text={url} />
          <a href={url} target="_blank" rel="noopener noreferrer" style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            border: `1px solid ${C.border}`, background: C.muted, color: C.fg,
            textDecoration: "none",
          }}>
            Open ↗
          </a>
        </div>
      </div>
      <div style={{ fontFamily: C.mono, fontSize: 11, color: C.fgMuted,
        wordBreak: "break-all", lineHeight: 1.6 }}>
        {display}
      </div>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
export default function TestPage() {
  const [apiUrl,         setApiUrl]         = useState("http://localhost:8000");
  const [webUrl,         setWebUrl]         = useState("http://localhost:3000");
  const [adminKey,       setAdminKey]       = useState("dev-admin-key");
  const [school,         setSchool]         = useState<School | null>(null);
  const [connecting,     setConnecting]     = useState(false);
  const [connectError,   setConnectError]   = useState("");
  const [meetingUrl,     setMeetingUrl]     = useState("https://meet.google.com/abc-defg-hij");
  const [sessionId,      setSessionId]      = useState("");
  const [sessionLocked,  setSessionLocked]  = useState(false);
  const [hostName,       setHostName]       = useState("Ms. Sharma");
  const [attendeeName,   setAttendeeName]   = useState("Riya Patel");
  const [links,          setLinks]          = useState<Links>(null);
  const [generating,     setGenerating]     = useState(false);
  const [genError,       setGenError]       = useState("");

  // load persisted config
  useEffect(() => {
    try {
      const cfg = localStorage.getItem("classapp_test_config");
      if (cfg) {
        const c = JSON.parse(cfg);
        if (c.apiUrl)   setApiUrl(c.apiUrl);
        if (c.webUrl)   setWebUrl(c.webUrl);
        if (c.adminKey) setAdminKey(c.adminKey);
      }
    } catch {}
  }, []);

  // load saved school when apiUrl changes
  useEffect(() => {
    setSchool(null);
    setLinks(null);
    try {
      const saved = localStorage.getItem(`classapp_test_school_${apiUrl}`);
      if (saved) setSchool(JSON.parse(saved));
    } catch {}
  }, [apiUrl]);

  const connect = async () => {
    setConnecting(true);
    setConnectError("");
    try {
      localStorage.setItem("classapp_test_config", JSON.stringify({ apiUrl, webUrl, adminKey }));

      // reuse saved school if still alive
      const raw = localStorage.getItem(`classapp_test_school_${apiUrl}`);
      if (raw) {
        const s: School = JSON.parse(raw);
        const r = await fetch(`${apiUrl}/admin/tenants/${s.id}`, {
          headers: { "X-Admin-Key": adminKey },
        }).catch(() => null);
        if (r?.ok) { setSchool(s); return; }
        localStorage.removeItem(`classapp_test_school_${apiUrl}`);
      }

      // create new test school
      const r = await fetch(`${apiUrl}/admin/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({
          name: "Test School",
          slug: `test-${Math.random().toString(36).slice(2, 6)}`,
          contactEmail: "test@test.example",
          chatSupportUrl: "https://example.com/support",
          branding: { primaryColor: "#22C55E" },
        }),
      }).catch(() => null);

      if (!r)    { setConnectError("Server unreachable. Is it running?"); return; }
      if (!r.ok) { setConnectError(`${r.status}: ${await r.text()}`); return; }

      const t = await r.json();
      const s: School = { api: apiUrl, id: t.id, name: t.name, slug: t.slug,
        launchKey: t.launchKey, apiKey: t.apiKey, webhookSecret: t.webhookSecret };
      localStorage.setItem(`classapp_test_school_${apiUrl}`, JSON.stringify(s));
      setSchool(s);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    if (!school) return;
    localStorage.removeItem(`classapp_test_school_${school.api}`);
    setSchool(null);
    setLinks(null);
  };

  const generate = async () => {
    if (!school) return;
    setGenerating(true);
    setGenError("");
    setLinks(null);
    try {
      const key = base64url.decode(school.launchKey);
      const sid = sessionLocked && sessionId ? sessionId : crypto.randomUUID();
      if (!sessionLocked || !sessionId) setSessionId(sid);

      const makeToken = async (role: "host" | "attendee", name: string, pid: string) =>
        `${webUrl}/join#token=` + await new EncryptJWT({
          meetingUrl, role, name, meetingTitle: "Test Session", sessionId: sid, participantId: pid,
        })
          .setProtectedHeader({ alg: "dir", enc: "A256GCM", kid: school.id })
          .setJti(crypto.randomUUID())
          .setIssuedAt()
          .setExpirationTime("10m")
          .encrypt(key);

      const [hostLink, attendeeLink] = await Promise.all([
        makeToken("host",     hostName,     `host-${Date.now()}`),
        makeToken("attendee", attendeeName, `attendee-${Date.now() + 1}`),
      ]);
      setLinks({ host: hostLink, attendee: attendeeLink });
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : "Token generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = !!school && !!meetingUrl && !!hostName && !!attendeeName;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        input::placeholder { color: #475569; }
        input:focus { outline: none; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, color: C.fg,
        fontFamily: C.sans, padding: "32px 20px 80px" }}>
        <div style={{ maxWidth: 740, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%",
                  background: school ? C.accent : "#475569",
                  boxShadow: school ? `0 0 8px ${C.accent}` : "none",
                  transition: "all 0.3s" }} />
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
                  ClassApp <span style={{ color: C.accent }}>Test Lab</span>
                </h1>
              </div>
              <p style={{ margin: "3px 0 0 19px", fontSize: 12, color: C.fgMuted }}>
                Generate real join links for prototype testing.
              </p>
            </div>
            {school && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ padding: "3px 10px", borderRadius: 20, background: C.muted,
                  fontSize: 12, fontFamily: C.mono, color: C.fg }}>{school.slug}</span>
                <button onClick={disconnect} style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${C.border}`, background: "transparent",
                  color: C.fgMuted, cursor: "pointer",
                }}>disconnect</button>
              </div>
            )}
          </div>

          {/* connection card */}
          <div style={{ padding: "20px 24px", borderRadius: 14,
            border: `1px solid ${C.border}`, background: C.card }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: C.fgMuted, marginBottom: 16 }}>Connection</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div><Label>API URL</Label><Input value={apiUrl} onChange={setApiUrl} mono placeholder="http://localhost:8000" /></div>
              <div><Label>Web URL</Label><Input value={webUrl} onChange={setWebUrl} mono placeholder="http://localhost:3000" /></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Label>Admin Key</Label>
              <Input value={adminKey} onChange={setAdminKey} mono placeholder="dev-admin-key" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Btn onClick={connect} disabled={connecting}>
                {connecting ? "Connecting…" : school ? "Reconnect" : "Connect"}
              </Btn>
              {school && <span style={{ fontSize: 13, color: C.accent }}>✓ {school.name}</span>}
              {connectError && <span style={{ fontSize: 12, color: C.error }}>{connectError}</span>}
            </div>
          </div>

          {/* session builder */}
          <div style={{ padding: "20px 24px", borderRadius: 14,
            border: `1px solid ${C.border}`, background: C.card }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: C.fgMuted, marginBottom: 16 }}>Session</div>

            <div style={{ marginBottom: 16 }}>
              <Label>Meeting URL — Zoom, Meet, Teams, anything</Label>
              <Input value={meetingUrl} onChange={setMeetingUrl} mono
                placeholder="https://meet.google.com/… or zoom.us/j/… or teams.microsoft.com/…" />
            </div>

            <div style={{ marginBottom: 24 }}>
              <Label>
                Session ID
                <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400,
                  textTransform: "none", letterSpacing: 0, color: C.fgMuted }}>
                  {sessionLocked
                    ? "— pinned, host + attendee share this session"
                    : "— auto-generates each run (new session each time)"}
                </span>
              </Label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <Input value={sessionId} mono onChange={v => { setSessionId(v); setSessionLocked(true); }}
                    placeholder="will be generated on click" />
                </div>
                <button
                  onClick={() => setSessionLocked(l => !l)}
                  title={sessionLocked ? "Unpin (auto-generate each run)" : "Lock this session ID"}
                  style={{ padding: "10px 13px", borderRadius: 8, fontSize: 15,
                    border: `1px solid ${sessionLocked ? C.accent : C.border}`,
                    background: sessionLocked ? C.accentBg : C.muted,
                    color: sessionLocked ? C.accent : C.fgMuted, cursor: "pointer", transition: "all 0.15s",
                  }}>
                  {sessionLocked ? "🔒" : "🔓"}
                </button>
                <Btn small variant="ghost" onClick={() => { setSessionId(crypto.randomUUID()); setSessionLocked(false); }}>
                  New
                </Btn>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <Label>Host name</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}><Input value={hostName} onChange={setHostName} placeholder="Ms. Sharma" /></div>
                  <button onClick={() => setHostName(randomName())} title="Random"
                    style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                      background: C.muted, color: C.fg, cursor: "pointer", fontSize: 15 }}>🎲</button>
                </div>
              </div>
              <div>
                <Label>Attendee name</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}><Input value={attendeeName} onChange={setAttendeeName} placeholder="Riya Patel" /></div>
                  <button onClick={() => setAttendeeName(randomName())} title="Random"
                    style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                      background: C.muted, color: C.fg, cursor: "pointer", fontSize: 15 }}>🎲</button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Btn onClick={generate} disabled={!canGenerate || generating}>
                {generating ? "Generating…" : "Generate Links"}
              </Btn>
              {!school && <span style={{ fontSize: 12, color: C.fgMuted }}>Connect first.</span>}
              {genError && <span style={{ fontSize: 12, color: C.error }}>{genError}</span>}
            </div>
          </div>

          {/* output links */}
          {links && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: C.fgMuted }}>
                Join Links
                <span style={{ marginLeft: 10, fontWeight: 400, textTransform: "none",
                  letterSpacing: 0 }}>
                  — valid 10 min · session <span style={{ fontFamily: C.mono }}>{sessionId.slice(0, 8)}…</span>
                </span>
              </div>
              <LinkCard role="host"     name={hostName}     url={links.host} />
              <LinkCard role="attendee" name={attendeeName} url={links.attendee} />
              <div style={{ padding: "12px 16px", borderRadius: 10,
                background: C.accentBg, border: "1px solid #166534",
                fontSize: 12, color: C.fgMuted, lineHeight: 1.7 }}>
                <strong style={{ color: C.accent }}>Tip:</strong>{" "}
                Open both links in separate browser tabs to simulate a real session.
                Camera &amp; mic analytics are captured independently on each device.
                Links expire in 10 min — click Generate Links again for fresh ones.
                {!sessionLocked &&
                  " Each Generate creates a new Session ID — press 🔒 to pin it and keep host + attendee in the same session."}
              </div>
              {school && (
                <div style={{ fontSize: 12, color: C.fgMuted }}>
                  Admin console:{" "}
                  <a href={`${webUrl}/admin?tenant=${school.id}`} target="_blank"
                    rel="noopener noreferrer" style={{ color: C.accent, textDecoration: "none" }}>
                    open ↗
                  </a>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
