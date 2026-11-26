/**
 * Public school-selector login page at /login.
 * Callers: app/page.tsx nav "Sign in" and "Sign in to your school" links.
 * No existing /login route — this is new.
 * User instruction: "login (should show all slug) when slug selected then show
 * branding as well otherwise product branding"
 */

import type { Metadata } from "next";
import { SchoolSelector } from "@/components/admin/school-selector";

export const metadata: Metadata = { title: "Sign in · MyClass" };

export default function LoginPage() {
  return <SchoolSelector />;
}
