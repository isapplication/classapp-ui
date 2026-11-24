"use client";

import { useState } from "react";
import type { Consent, LaunchResult } from "@/lib/types";
import { AppShell, ShellLink, type ShellNavItem } from "./app-shell";
import { DevicePanel } from "./device-panel";
import { HostLive } from "./host-live";
import { IconExternal, IconMessage, IconMonitor, IconUsers } from "./icons";
import { BrandMark } from "./ui";

type View = "class" | "device";

/** The class beside the meeting. The host sees the whole class and their own device; a student sees their device. */
export function ClassRoom({ launch, initialConsent }: { launch: LaunchResult; initialConsent: Consent }) {
  const { tenant } = launch;
  const host = launch.role === "host";
  const [view, setView] = useState<View>(host ? "class" : "device");

  const nav: ShellNavItem[] = host
    ? [
        { key: "class", label: "Whole class", icon: <IconUsers />, active: view === "class", onClick: () => setView("class") },
        { key: "device", label: "My device", icon: <IconMonitor />, active: view === "device", onClick: () => setView("device") },
      ]
    : [{ key: "device", label: "My device", icon: <IconMonitor />, active: true }];

  const who = [launch.name, host ? "Host" : null].filter(Boolean).join(" · ");
  const title = view === "class" ? "Whole class" : host ? "My device" : (launch.meetingTitle ?? "Your class");
  const subtitle = [launch.meetingTitle && view === "class" ? launch.meetingTitle : null, who || null].filter(Boolean).join(" · ");

  return (
    <AppShell
      brand={{ mark: <BrandMark name={tenant.name} branding={tenant.branding} size={34} />, name: tenant.name, sub: "Class analytics" }}
      navLabel="Class"
      nav={nav}
      footer={
        <>
          <ShellLink href={launch.meetingUrl} icon={<IconExternal />} label="Open meeting" external />
          {tenant.chatSupportUrl && <ShellLink href={tenant.chatSupportUrl} icon={<IconMessage />} label="Support" external />}
        </>
      }
      title={title}
      subtitle={subtitle || tenant.name}
    >
      {/* Both views stay mounted so switching never restarts the camera or the live stream. */}
      {host && (
        <div hidden={view !== "class"}>
          <HostLive launch={launch} heading={false} />
        </div>
      )}
      <div hidden={view !== "device"} className={host ? "" : "mx-auto max-w-5xl"}>
        <DevicePanel launch={launch} initialConsent={initialConsent} compact={host} />
      </div>
    </AppShell>
  );
}
