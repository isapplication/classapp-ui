import type { Metadata } from "next";
import { Suspense } from "react";
import { AcceptInvite } from "@/components/admin/accept-invite";

export const metadata: Metadata = { title: "Accept invite · MyClass" };

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center"><p className="text-sm text-ink-soft">Loading…</p></main>}>
      <AcceptInvite />
    </Suspense>
  );
}
