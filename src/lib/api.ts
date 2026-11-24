import { createSseParser } from "./sse";
import type { DeviceEvent, LaunchResult } from "./types";

let apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** The class-app server. The web app reads it from the environment; the extension sets it from the handoff. */
export function getApiUrl() {
  return apiUrl;
}

export function setApiUrl(url: string) {
  apiUrl = url.replace(/\/$/, "");
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path}`, init);
  } catch {
    throw new ApiError(0, "unreachable", "Can't reach the class server. Check your connection.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `http_${res.status}`, body?.message ?? "Something went wrong.");
  }
  return body as T;
}

export function redeemLaunchToken(token: string) {
  return request<LaunchResult>("/api/launch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export function sendDeviceEvent(launch: LaunchResult, event: DeviceEvent, keepalive = false) {
  return request<{ seq: number; gated: boolean }>(`/api/participants/${launch.participant.id}/events`, {
    method: "POST",
    keepalive,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${launch.participantKey}` },
    body: JSON.stringify({ capturedAt: new Date().toISOString(), ...event }),
  });
}

export function endSession(launch: LaunchResult) {
  return request<{ seq: number }>(`/api/sessions/${launch.session.id}/end`, {
    method: "POST",
    headers: { Authorization: `Bearer ${launch.participantKey}` },
  });
}

/**
 * Opens the host's live class stream. Uses fetch streaming because EventSource cannot send the
 * Authorization header. Resolves when the stream ends (the class ended or the connection dropped).
 */
export function streamLiveClass(
  launch: LaunchResult,
  onMessage: (event: string, data: string) => void,
  signal: AbortSignal,
): Promise<void> {
  return streamEvents(`${apiUrl}/api/sessions/${launch.session.id}/live`, { Authorization: `Bearer ${launch.participantKey}` }, onMessage, signal);
}

/** Any server-sent-events stream that needs request headers (fetch streaming). */
export async function streamEvents(
  url: string,
  headers: Record<string, string>,
  onMessage: (event: string, data: string) => void,
  signal: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { ...headers, Accept: "text/event-stream" }, signal, cache: "no-store" });
  } catch (e) {
    if (signal.aborted) return;
    throw new ApiError(0, "unreachable", e instanceof Error ? e.message : "Stream failed");
  }
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error ?? `http_${res.status}`, body?.message ?? "Live view unavailable.");
  }
  const parse = createSseParser((m) => onMessage(m.event, m.data));
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      parse(value);
    }
  } catch (e) {
    if (!signal.aborted) throw e;
  }
}
