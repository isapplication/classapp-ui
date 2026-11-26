"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { adminApi, type AuditEntry, type InviteResult, type SecretKind, type TenantUser, type TenantView } from "@/lib/admin-api";
import type { AdminSession } from "@/lib/admin-session";
import { useLoad } from "@/lib/use-load";
import { useRouter } from "next/navigation";
import { IconEye, IconHistory, IconKey, IconUsers } from "../icons";
import { ClassDetail } from "./class-detail";
import { ClassList } from "./class-list";
import { TenantWebhooks } from "./webhooks";
import { ACTION, dateTime } from "@/lib/format";
import { BrandMark, Button, Card, CardTitle, Chip } from "../ui";
import { Field, Notice, TextInput } from "./fields";
import { SecretReveal } from "./secret-reveal";

const HEX = /^#[0-9a-f]{6}$/i;

export type TenantSection = "settings" | "keys" | "classes" | "webhooks" | "audit" | "users";

export function TenantDetail({
  session,
  id,
  section,
  classId,
  watch,
  platformAdmin,
}: {
  session: AdminSession;
  id: string;
  section: TenantSection;
  classId: string | null;
  watch: boolean;
  platformAdmin: boolean;
}) {
  const tenant = useLoad(() => adminApi.getTenant(session, id), `tenant:${id}`);
  const audit = useLoad(() => adminApi.audit(session, id), `audit:${id}`);

  if (tenant.error instanceof ApiError && tenant.error.status === 403) {
    return <Notice tone="error">You can&apos;t manage this tenant. Ask a platform administrator for access.</Notice>;
  }
  if (tenant.error instanceof ApiError && tenant.error.status === 404) {
    return <Notice tone="error">There&apos;s no tenant with this id.</Notice>;
  }
  if (tenant.error instanceof Error && !tenant.data) return <Notice tone="error">{tenant.error.message}</Notice>;
  if (!tenant.data) return <p className="text-sm text-ink-soft">Loading…</p>;

  const t = tenant.data;
  const refresh = () => {
    tenant.reload();
    audit.reload();
  };
  const accent = t.branding.primaryColor && HEX.test(t.branding.primaryColor) ? t.branding.primaryColor : undefined;

  return (
    <section className="space-y-5">
      <div
        style={accent ? ({ "--accent": accent } as CSSProperties) : undefined}
        className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-4 shadow-card"
      >
        <BrandMark name={t.name} branding={t.branding} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold">{t.name}</p>
          <p className="truncate font-mono text-xs text-ink-faint">
            {t.slug} · {t.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip tone={t.webhookUrl ? "good" : "neutral"}>{t.webhookUrl ? "Webhook set" : "No webhook"}</Chip>
          <Chip tone="neutral">Keeps data {t.retentionDays} days</Chip>
          {t.suspendedAt && <Chip tone="bad">Suspended</Chip>}
          {t.focusScoreEnabled && <Chip tone="warn">Focus score on</Chip>}
        </div>
      </div>

      {/* Keyed by id only: after a save the form already holds the saved values, and keeps its "Saved" status. */}
      {section === "settings" && (
        <>
          <SettingsForm key={t.id} session={session} tenant={t} onSaved={refresh} />
          {platformAdmin && <DangerZone session={session} tenant={t} onChanged={refresh} />}
        </>
      )}
      {section === "keys" && <Keys session={session} tenantId={t.id} onRotated={audit.reload} />}
      {section === "classes" &&
        (classId ? (
          <ClassDetail session={session} tenantId={t.id} sessionId={classId} watch={watch} />
        ) : (
          <ClassList session={session} tenantId={t.id} />
        ))}
      {section === "webhooks" && <TenantWebhooks session={session} tenantId={t.id} />}
      {section === "audit" && (
        <div className="grid items-start gap-5 xl:grid-cols-2">
          <Audit entries={audit.data?.entries} />
          <PlatformAccess session={session} tenantId={t.id} />
        </div>
      )}
      {section === "users" && <Users session={session} tenantId={t.id} />}
    </section>
  );
}

function SettingsForm({ session, tenant, onSaved }: { session: AdminSession; tenant: TenantView; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: tenant.name,
    logoUrl: tenant.branding.logoUrl ?? "",
    faviconUrl: tenant.branding.faviconUrl ?? "",
    primaryColor: tenant.branding.primaryColor ?? "#2563eb",
    contactEmail: tenant.contactEmail ?? "",
    chatSupportUrl: tenant.chatSupportUrl ?? "",
    webhookUrl: tenant.webhookUrl ?? "",
    retentionDays: String(tenant.retentionDays),
    focusScoreEnabled: tenant.focusScoreEnabled,
  });
  const [status, setStatus] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      // PUT replaces every setting, so the whole form is sent.
      await adminApi.updateTenant(session, tenant.id, {
        name: form.name,
        slug: tenant.slug,
        contactEmail: form.contactEmail,
        chatSupportUrl: form.chatSupportUrl,
        webhookUrl: form.webhookUrl,
        branding: { logoUrl: form.logoUrl, faviconUrl: form.faviconUrl, primaryColor: form.primaryColor },
        focusScoreEnabled: form.focusScoreEnabled,
        retentionDays: Number(form.retentionDays),
      });
      setStatus({ tone: "success", text: "Saved." });
      onSaved();
    } catch (err) {
      setStatus({ tone: "error", text: err instanceof Error ? err.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  }

  const accent = HEX.test(form.primaryColor) ? form.primaryColor : "#2563eb";

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold">Settings &amp; branding</h2>
        <div style={{ "--accent": accent } as CSSProperties} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
          <BrandMark name={form.name || "?"} branding={{ logoUrl: form.logoUrl || undefined }} size={28} />
          <span className="text-xs font-semibold">{form.name || "Preview"}</span>
          <span className="rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-white">Join</span>
        </div>
      </div>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" wide>
          <TextInput id="t-name" required maxLength={120} value={form.name} onChange={(e) => set("name")(e.target.value)} />
        </Field>
        <Field label="Logo URL">
          <TextInput id="t-logo" type="url" value={form.logoUrl} onChange={(e) => set("logoUrl")(e.target.value)} placeholder="https://…/logo.png" />
        </Field>
        <Field label="Favicon URL">
          <TextInput id="t-favicon" type="url" value={form.faviconUrl} onChange={(e) => set("faviconUrl")(e.target.value)} placeholder="https://…/favicon.ico" />
        </Field>
        <Field label="Brand colour">
          <div className="flex gap-2">
            <input
              id="t-color-picker"
              type="color"
              value={accent}
              onChange={(e) => set("primaryColor")(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-surface-2 p-1"
              aria-label="Pick brand colour"
            />
            <TextInput id="t-color" value={form.primaryColor} pattern="#[0-9a-fA-F]{6}" onChange={(e) => set("primaryColor")(e.target.value)} className="flex-1 font-mono" />
          </div>
        </Field>
        <Field label="Contact email">
          <TextInput id="t-email" type="email" value={form.contactEmail} onChange={(e) => set("contactEmail")(e.target.value)} />
        </Field>
        <Field label="Chat support URL" hint="Shown to students and teachers as “Support” in class." wide>
          <TextInput id="t-chat" type="url" value={form.chatSupportUrl} onChange={(e) => set("chatSupportUrl")(e.target.value)} />
        </Field>
        <Field label="Webhook URL" hint="Every class event is POSTed here, signed with the webhook secret. Public https only." wide>
          <TextInput id="t-webhook" type="url" value={form.webhookUrl} onChange={(e) => set("webhookUrl")(e.target.value)} />
        </Field>
        <Field label="Keep class data for (days)" hint="Older classes are deleted automatically.">
          <TextInput id="t-retention" type="number" min={1} max={3650} required value={form.retentionDays} onChange={(e) => set("retentionDays")(e.target.value)} />
        </Field>
        <label className="flex items-start gap-3 rounded-lg border border-line p-3 sm:col-span-2">
          <input
            id="t-focus"
            type="checkbox"
            checked={form.focusScoreEnabled}
            onChange={(e) => set("focusScoreEnabled")(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--accent)]"
          />
          <span className="text-sm">
            <b>Inferred focus score</b>
            <span className="block text-xs text-ink-faint">
              Off by default. Keep it off for schools in the EU or UK: the EU AI Act prohibits inferring students&apos; attention in education.
            </span>
          </span>
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </Button>
          {status && <Notice tone={status.tone}>{status.text}</Notice>}
        </div>
      </form>
    </Card>
  );
}

const SECRETS: { kind: SecretKind; label: string; purpose: string }[] = [
  { kind: "launch-key", label: "Launch key", purpose: "Seals class links. Rotating it invalidates links not yet opened." },
  { kind: "webhook-secret", label: "Webhook secret", purpose: "Verifies webhook signatures. Update your receiver right after rotating." },
  { kind: "api-key", label: "API key", purpose: "Reads sessions and events through the pull API." },
];

function Keys({ session, tenantId, onRotated }: { session: AdminSession; tenantId: string; onRotated: () => void }) {
  const [confirming, setConfirming] = useState<SecretKind | null>(null);
  const [revealed, setRevealed] = useState<{ kind: SecretKind; value: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function rotate(kind: SecretKind) {
    setConfirming(null);
    setError(null);
    try {
      const result = await adminApi.rotate(session, tenantId, kind);
      setRevealed({ kind, value: Object.values(result)[0] });
      onRotated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rotate.");
    }
  }

  return (
    <Card className="max-w-3xl">
      <CardTitle>Keys</CardTitle>
      <div className="divide-y divide-line">
      {SECRETS.map((s) => (
        <div key={s.kind} className="space-y-3 py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                <IconKey width={16} height={16} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="text-xs text-ink-faint">{s.purpose}</p>
              </div>
            </div>
            {confirming === s.kind ? (
              <div className="flex shrink-0 gap-1.5">
                <Button variant="danger" onClick={() => rotate(s.kind)}>
                  Rotate now
                </Button>
                <Button onClick={() => setConfirming(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button className="shrink-0" onClick={() => setConfirming(s.kind)}>
                Rotate
              </Button>
            )}
          </div>
          {revealed?.kind === s.kind && <SecretReveal label={`New ${s.label.toLowerCase()}`} value={revealed.value} purpose="The previous one has stopped working." />}
        </div>
      ))}
      </div>
      {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
    </Card>
  );
}

const ACTIONS: Record<string, string> = {
  "tenant.created": "Tenant enrolled",
  "tenant.updated": "Settings changed",
  "api_key.rotated": "API key rotated",
  "launch_key.rotated": "Launch key rotated",
  "webhook_secret.rotated": "Webhook secret rotated",
};

function Audit({ entries }: { entries: AuditEntry[] | undefined }) {
  return (
    <Card className="max-w-3xl">
      <CardTitle aside={entries && <span className="text-xs font-semibold text-ink-faint tabular-nums">{entries.length} entries</span>}>Audit log</CardTitle>
      {!entries && <p className="text-sm text-ink-soft">Loading…</p>}
      {entries?.length === 0 && <p className="text-sm text-ink-soft">No changes yet.</p>}
      <ol className="relative space-y-4 before:absolute before:inset-y-1 before:left-[15px] before:w-px before:bg-line">
        {entries?.map((e, i) => (
          <li key={`${e.at}-${i}`} className="relative flex gap-3">
            <span className="z-[1] grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-faint">
              <IconHistory width={14} height={14} />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-semibold">{ACTIONS[e.action] ?? e.action}</p>
              {e.detail.fields && e.detail.fields.length > 0 && <p className="text-xs text-ink-soft">{e.detail.fields.join(", ")}</p>}
              <p className="text-[11px] text-ink-faint">
                {e.actor} · {new Date(e.at).toLocaleString()}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** Who at the platform looked at this school's class data (platform admins only; logged by the server). */
function PlatformAccess({ session, tenantId }: { session: AdminSession; tenantId: string }) {
  const { data, error } = useLoad(() => adminApi.accessLog(session, tenantId), `access:${tenantId}`);
  return (
    <Card>
      <CardTitle aside={data && <span className="text-xs font-semibold text-ink-faint tabular-nums">{data.entries.length} entries</span>}>
        Platform access
      </CardTitle>
      <p className="-mt-2 mb-3 text-xs text-ink-faint">Every time a platform administrator viewed, downloaded or watched this school&apos;s classes.</p>
      {error instanceof Error && <Notice tone="error">{error.message}</Notice>}
      {!data && <p className="text-sm text-ink-soft">Loading…</p>}
      {data?.entries.length === 0 && <p className="text-sm text-ink-soft">No platform access yet.</p>}
      <ol className="space-y-3">
        {data?.entries.map((e, i) => (
          <li key={`${e.at}-${i}`} className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-faint">
              <IconEye width={14} height={14} />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-semibold">{ACTION[e.action] ?? e.action}</p>
              <p className="text-[11px] text-ink-faint">
                {e.actor} · {dateTime(e.at)}
                {e.sessionId && ` · class ${e.sessionId.slice(0, 8)}`}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** Invite management and user list for the tenant. */
function Users({ session, tenantId }: { session: AdminSession; tenantId: string }) {
  const { data, reload } = useLoad(() => adminApi.listUsers(session, tenantId), `users:${tenantId}`);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [invited, setInvited] = useState<InviteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInvited(null);
    try {
      const result = await adminApi.inviteUser(session, tenantId, email.trim());
      setInvited(result);
      setEmail("");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invite.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(userId: string, userEmail: string) {
    setCopyingId(userId);
    try {
      const result = await adminApi.inviteUser(session, tenantId, userEmail);
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 2000);
      reload();
    } catch {
      // silently ignore clipboard errors
    } finally {
      setCopyingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="max-w-2xl space-y-4">
        <CardTitle>Invite admin user</CardTitle>
        <p className="text-sm text-ink-soft">
          Send an invite link to give someone access to this school's admin console. The link is
          valid for 72 hours; they set their own password.
        </p>
        <form onSubmit={sendInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Email address">
            <TextInput
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="principal@school.example"
            />
          </Field>
          <Button type="submit" variant="primary" disabled={busy || !email.trim()}>
            {busy ? "Inviting…" : "Invite"}
          </Button>
        </form>
        {invited && (
          <SecretReveal
            label="Invite link"
            value={invited.inviteUrl}
            purpose={`Valid for 72 hours. Send this to ${invited.email}.`}
          />
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </Card>

      <Card className="max-w-2xl">
        <CardTitle aside={data && <span className="text-xs font-semibold text-ink-faint tabular-nums">{data.users.length} users</span>}>
          Admin users
        </CardTitle>
        {!data && <p className="text-sm text-ink-soft">Loading…</p>}
        {data?.users.length === 0 && <p className="text-sm text-ink-soft">No admin users yet.</p>}
        <div className="divide-y divide-line">
          {data?.users.map((u: TenantUser) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.email}</p>
                <p className="text-xs text-ink-faint">Invited by {u.invitedBy} · {new Date(u.invitedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {!u.acceptedAt && (
                  <button
                    type="button"
                    onClick={() => copyLink(u.id, u.email)}
                    disabled={copyingId === u.id}
                    className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft hover:border-accent hover:text-accent disabled:opacity-50"
                  >
                    {copiedId === u.id ? "Copied!" : copyingId === u.id ? "…" : "Copy link"}
                  </button>
                )}
                <Chip tone={u.acceptedAt ? "good" : "neutral"}>{u.acceptedAt ? "Active" : "Pending"}</Chip>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** Suspend, resume or delete a school. Platform admins only; both are audit-logged. */
function DangerZone({ session, tenant, onChanged }: { session: AdminSession; tenant: TenantView; onChanged: () => void }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<"suspend" | "delete" | null>(null);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const suspended = !!tenant.suspendedAt;

  async function run(action: () => Promise<unknown>, after: () => void) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setConfirm(null);
      after();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-crit/30">
      <CardTitle>Danger zone</CardTitle>
      <div className="divide-y divide-line">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{suspended ? "Resume this school" : "Suspend this school"}</p>
            <p className="text-xs text-ink-faint">
              {suspended
                ? `Suspended since ${dateTime(tenant.suspendedAt)}. Resuming lets class links, devices and the API work again.`
                : "Class links, devices and the pull API stop working at once. All data is kept, and you can resume any time."}
            </p>
          </div>
          {suspended ? (
            <Button disabled={busy} onClick={() => void run(() => adminApi.resume(session, tenant.id), onChanged)}>
              Resume
            </Button>
          ) : confirm === "suspend" ? (
            <div className="flex gap-2">
              <Button variant="danger" disabled={busy} onClick={() => void run(() => adminApi.suspend(session, tenant.id), onChanged)}>
                Suspend now
              </Button>
              <Button onClick={() => setConfirm(null)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="danger" onClick={() => setConfirm("suspend")}>
              Suspend
            </Button>
          )}
        </div>
        <div className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Delete this school</p>
              <p className="text-xs text-ink-faint">Permanently removes the school and every class, participant, event and delivery. This can&apos;t be undone.</p>
            </div>
            {confirm !== "delete" && (
              <Button variant="danger" onClick={() => { setConfirm("delete"); setSlug(""); }}>
                Delete
              </Button>
            )}
          </div>
          {confirm === "delete" && (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => adminApi.deleteTenant(session, tenant.id, slug), () => router.push("/admin?view=schools"));
              }}
            >
              <Field label={`Type ${tenant.slug} to confirm`}>
                <TextInput id="confirm-slug" value={slug} onChange={(e) => setSlug(e.target.value)} autoComplete="off" className="font-mono" />
              </Field>
              <Button type="submit" variant="danger" disabled={busy || slug !== tenant.slug}>
                Delete forever
              </Button>
              <Button onClick={() => setConfirm(null)}>Cancel</Button>
            </form>
          )}
        </div>
      </div>
      {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
    </Card>
  );
}
