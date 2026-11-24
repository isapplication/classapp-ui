"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { adminApi, type CreatedTenant } from "@/lib/admin-api";
import type { AdminSession } from "@/lib/admin-session";
import { Button, Card } from "../ui";
import { Field, Notice, TextInput } from "./fields";
import { SecretReveal } from "./secret-reveal";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function EnrolTenant({ session }: { session: AdminSession }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<CreatedTenant | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setCreated(await adminApi.createTenant(session, { name, slug, contactEmail, webhookUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enrol the tenant.");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <section className="max-w-2xl space-y-4">
        <h2 className="text-lg font-bold">{created.name} is enrolled</h2>
        <Notice tone="info">Copy these now. They are never shown again; if one is lost, rotate it from the tenant page.</Notice>
        <SecretReveal label="Launch key" value={created.launchKey} purpose="The tenant's system seals class links with it." />
        <SecretReveal label="Webhook secret" value={created.webhookSecret} purpose="Verifies the X-ClassApp-Signature on webhook deliveries." />
        <SecretReveal label="API key" value={created.apiKey} purpose="Reads sessions and events through the pull API." />
        <Link
          href={`/admin?tenant=${created.id}`}
          className="inline-flex min-h-10 items-center rounded-lg border border-accent bg-accent px-4 text-sm font-semibold text-white hover:brightness-110"
        >
          I&apos;ve saved them, open the tenant
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-2xl space-y-4">
      <Card>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" wide>
            <TextInput
              id="enrol-name"
              value={name}
              required
              maxLength={120}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              placeholder="Oakridge International"
            />
          </Field>
          <Field label="Slug" hint="Lowercase letters, digits and hyphens. Can't be changed later.">
            <TextInput
              id="enrol-slug"
              value={slug}
              required
              pattern="[a-z0-9](?:[a-z0-9\-]{0,38}[a-z0-9])?"
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value);
              }}
            />
          </Field>
          <Field label="Contact email">
            <TextInput id="enrol-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </Field>
          <Field label="Webhook URL" hint="Optional now; events are pushed here once set. Must be public https." wide>
            <TextInput id="enrol-webhook" type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.school.example/class-analytics" />
          </Field>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Enrolling…" : "Enrol tenant"}
            </Button>
            <span className="text-xs text-ink-faint">Branding and the rest can be set on the tenant page.</span>
          </div>
        </form>
      </Card>
      {error && <Notice tone="error">{error}</Notice>}
    </section>
  );
}
