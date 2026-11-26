import type { Metadata } from "next";
import { Suspense } from "react";
import { SchoolSignIn } from "@/components/admin/school-sign-in";

export const metadata: Metadata = { title: "School admin sign-in · MyClass" };

export default function SchoolLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-ink-soft">Loading…</p>}>
      <SchoolSignInWrapper params={params} />
    </Suspense>
  );
}

async function SchoolSignInWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SchoolSignIn slug={slug} />;
}
