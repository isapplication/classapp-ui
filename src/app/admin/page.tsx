import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminApp } from "@/components/admin/admin-app";

export const metadata: Metadata = { title: "Admin console · Class Analytics" };

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-ink-soft">Loading…</p>}>
      <AdminApp />
    </Suspense>
  );
}
