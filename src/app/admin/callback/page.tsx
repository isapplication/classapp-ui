import type { Metadata } from "next";
import { Suspense } from "react";
import { SsoCallback } from "@/components/admin/sso-callback";

export const metadata: Metadata = { title: "Signing in · MyClass", referrer: "no-referrer" };

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <SsoCallback />
    </Suspense>
  );
}
