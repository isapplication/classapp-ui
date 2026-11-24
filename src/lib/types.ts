export type Provider = "zoom" | "teams" | "meet";
export type Role = "host" | "attendee";
export type Consent = "granted" | "declined";

export type Branding = { logoUrl?: string; faviconUrl?: string; primaryColor?: string };

export type LaunchResult = {
  meetingUrl: string;
  provider: Provider;
  role: Role;
  name: string | null;
  meetingTitle: string | null;
  tenant: { id: string; name: string; branding: Branding; contactEmail: string | null; chatSupportUrl: string | null };
  session: { id: string; externalId: string };
  participant: { id: string; externalId: string };
  participantKey: string;
};

/** The derived signals the server accepts (ARCHITECTURE.md §6). Observable facts only. */
export type Signals = {
  camera: "on" | "off";
  facePresent?: boolean;
  look?: "at_screen" | "away" | "no_face";
  headDirection?: "left" | "center" | "right" | "none";
  peopleAtCamera?: number;
  speaking?: boolean;
  speakingSeconds?: number;
  network?: { type: string; downlinkMbps?: number };
};

export type DeviceEvent = {
  type: "analytics.changed" | "participant.heartbeat" | "participant.left";
  consent: Consent;
  capturedAt?: string;
  signals?: Signals;
  changed?: Partial<Signals>;
  reason?: "closed" | "network_lost" | "crashed" | "kicked" | "ended" | "unknown";
};

/** An event as stored and delivered by the server (the webhook payload). */
export type ServerEvent = {
  event: string;
  seq: number;
  capturedAt: string;
  source: "device" | "server";
  participant?: { id: string; externalId: string; role: Role; consent: string };
  signals?: Signals;
  changed?: Partial<Signals>;
  reason?: string;
  summary?: { participants: number; events: number; durationSeconds: number };
};

export type LiveParticipant = {
  id: string;
  externalId: string;
  name: string | null;
  role: Role;
  consent: string;
  lastSeenAt: string;
  leftAt: string | null;
  leftReason: string | null;
  signals: Signals | null;
};

export type LiveSnapshot = {
  sessionId: string;
  externalId: string;
  title: string | null;
  seq: number;
  participants: LiveParticipant[];
};
