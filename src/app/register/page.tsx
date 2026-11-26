import type { Metadata } from "next";
import { RegisterFlow } from "@/components/admin/register-flow";

export const metadata: Metadata = { title: "Create account · MyClass" };

export default function RegisterPage() {
  return <RegisterFlow />;
}
