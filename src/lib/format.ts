/** Small display helpers for the admin console. */

export function dateTime(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function time(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** "3 min", "1 h 5 min", from seconds. */
export function duration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export function since(iso: string, until?: string | null) {
  return duration(((until ? Date.parse(until) : Date.now()) - Date.parse(iso)) / 1000);
}

export const PROVIDER: Record<string, string> = { zoom: "Zoom", teams: "Teams", meet: "Google Meet" };

/** Admin action codes in words. */
export const ACTION: Record<string, string> = {
  "tenant.created": "School enrolled",
  "tenant.updated": "Settings changed",
  "tenant.suspended": "School suspended",
  "tenant.resumed": "School resumed",
  "tenant.deleted": "School deleted",
  "api_key.rotated": "API key rotated",
  "launch_key.rotated": "Launch key rotated",
  "webhook_secret.rotated": "Webhook secret rotated",
  "webhook.resent": "Webhooks re-sent",
  "session.ended_by_admin": "Class ended by an administrator",
  "platform.login": "Platform admin signed in",
  "platform.login_failed": "Failed platform sign-in",
  "platform.logout": "Platform admin signed out",
  "class.viewed": "Viewed a class",
  "class.events_viewed": "Viewed a class's events",
  "class.exported": "Downloaded a class",
  "class.watched": "Watched a class live",
};
