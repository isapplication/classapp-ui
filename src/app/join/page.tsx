import type { Metadata } from "next";
import { JoinFlow } from "@/components/join-flow";

export const metadata: Metadata = {
  title: "Joining class",
  referrer: "no-referrer",
};

export default function JoinPage() {
  return <JoinFlow />;
}
