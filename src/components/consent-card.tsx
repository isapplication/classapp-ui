import type { Consent, LaunchResult } from "@/lib/types";
import type { ReactNode } from "react";
import { IconActivity, IconEye, IconShield, IconVideo } from "./icons";
import { BrandMark, Button, Card } from "./ui";

const PROVIDER: Record<LaunchResult["provider"], string> = { zoom: "Zoom", teams: "Microsoft Teams", meet: "Google Meet" };

export function ConsentCard({ launch, onChoose }: { launch: LaunchResult; onChoose: (consent: Consent) => void }) {
  const { tenant } = launch;
  const host = launch.role === "host";
  return (
    <Card className="view-in w-full max-w-md p-6 text-left shadow-lift sm:p-7">
      <div className="flex items-center gap-3">
        <BrandMark name={tenant.name} branding={tenant.branding} />
        <div>
          <p className="text-sm font-bold">{tenant.name}</p>
          <p className="text-xs text-ink-faint">{PROVIDER[launch.provider]} class</p>
        </div>
      </div>

      <h1 className="mt-5 text-xl font-bold text-balance">
        {launch.name ? `Hi ${launch.name}, ` : ""}you&apos;re joining {launch.meetingTitle ?? "your class"}
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        The class opens in a new window. This page stays open beside it and shows class analytics computed on your device.
      </p>

      <ul className="mt-5 space-y-3">
        <Point icon={<IconActivity width={16} height={16} />} title="Measured on this device">
          Whether you&apos;re facing the screen, where you look, how many people are at the camera, speaking time and network
          quality.
        </Point>
        <Point icon={<IconShield width={16} height={16} />} title="Never leaves this device">
          No video or audio is recorded or sent. Only those values.
        </Point>
        <Point icon={<IconEye width={16} height={16} />} title="Seen by">
          {host ? "You and" : "Your teacher and"} {tenant.name}.
        </Point>
      </ul>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <Button variant="primary" className="flex-1" onClick={() => onChoose("granted")}>
          <IconVideo width={16} height={16} />
          Join with analytics
        </Button>
        <Button className="flex-1" onClick={() => onChoose("declined")}>
          Join without analytics
        </Button>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Without analytics you still join the class; only &ldquo;analytics off&rdquo; is shared. You can turn analytics on or off at any time.
      </p>
    </Card>
  );
}

function Point({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">{icon}</span>
      <span className="text-[13px] leading-relaxed text-ink-soft">
        <b className="block text-ink">{title}</b>
        {children}
      </span>
    </li>
  );
}
