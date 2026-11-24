"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/lib/admin-api";
import { clearSession, principalOf, useAdminSession } from "@/lib/admin-session";
import { AppShell, navItemClass, type ShellNavItem } from "../app-shell";
import {
  IconActivity,
  IconBuilding,
  IconHistory,
  IconKey,
  IconLogOut,
  IconMonitor,
  IconSliders,
  IconVideo,
  IconWifi,
} from "../icons";
import { Card, Chip, Spinner } from "../ui";
import { ClassList } from "./class-list";
import { EnrolTenant } from "./enrol-tenant";
import { Overview, PlatformAudit } from "./overview";
import { SignIn } from "./sign-in";
import { TenantDetail, type TenantSection } from "./tenant-detail";
import { TenantList } from "./tenant-list";
import { FailedWebhooks } from "./webhooks";

type PlatformView = "overview" | "schools" | "new" | "live" | "classes" | "webhooks" | "audit";

const PLATFORM: Record<PlatformView, { label: string; title: string; subtitle: string; icon: ReactNode; nav: boolean }> = {
  overview: { label: "Overview", title: "Overview", subtitle: "The whole platform at a glance", icon: <IconActivity />, nav: true },
  schools: { label: "Schools", title: "Schools", subtitle: "Schools, institutes and tutors using Class Analytics", icon: <IconBuilding />, nav: true },
  new: { label: "Enrol school", title: "Enrol a school", subtitle: "Creates the school and its keys", icon: <IconBuilding />, nav: false },
  live: { label: "Live now", title: "Live now", subtitle: "Every class running right now, across all schools", icon: <IconVideo />, nav: true },
  classes: { label: "All classes", title: "All classes", subtitle: "Every class at every school, newest first", icon: <IconMonitor />, nav: true },
  webhooks: { label: "Failed webhooks", title: "Failed webhooks", subtitle: "Deliveries that failed or are retrying, across all schools", icon: <IconWifi />, nav: true },
  audit: { label: "Access & audit log", title: "Access & audit log", subtitle: "Every admin action and sign-in, newest first", icon: <IconHistory />, nav: true },
};

const SECTIONS: Record<TenantSection, { label: string; title: string; subtitle: string; icon: ReactNode }> = {
  settings: { label: "Settings", title: "Settings & branding", subtitle: "Name, branding, support links, webhook, retention", icon: <IconSliders /> },
  keys: { label: "Keys", title: "Keys", subtitle: "Launch key, webhook secret and pull API key", icon: <IconKey /> },
  classes: { label: "Classes", title: "Classes", subtitle: "This school's classes, live and past", icon: <IconMonitor /> },
  webhooks: { label: "Webhooks", title: "Webhooks", subtitle: "Deliveries to this school's webhook, with re-send", icon: <IconWifi /> },
  audit: { label: "Audit", title: "Audit", subtitle: "Changes to this school, and platform access to its data", icon: <IconHistory /> },
};

export function AdminApp() {
  const session = useAdminSession();
  const params = useSearchParams();

  if (session === undefined) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Spinner />
      </main>
    );
  }
  if (session === null) return <SignIn />;

  const principal = principalOf(session);
  const viewParam = params.get("view") as PlatformView | null;
  const view: PlatformView = viewParam && viewParam in PLATFORM ? viewParam : "overview";
  const sectionParam = params.get("section") as TenantSection | null;
  const section: TenantSection = sectionParam && sectionParam in SECTIONS ? sectionParam : "settings";
  const tenantId = principal.platformAdmin ? params.get("tenant") : principal.tenantAdmin ? principal.tenantId : null;
  const classId = params.get("class");
  const watch = params.get("watch") === "1";

  const nav: ShellNavItem[] = [];
  if (principal.platformAdmin) {
    (Object.keys(PLATFORM) as PlatformView[])
      .filter((key) => PLATFORM[key].nav)
      .forEach((key) =>
        nav.push({
          key,
          label: PLATFORM[key].label,
          icon: PLATFORM[key].icon,
          href: key === "overview" ? "/admin" : `/admin?view=${key}`,
          active: !tenantId && (view === key || (key === "schools" && view === "new")),
        }),
      );
  }
  if (tenantId) {
    (Object.keys(SECTIONS) as TenantSection[]).forEach((key, i) =>
      nav.push({
        key: `tenant-${key}`,
        label: SECTIONS[key].label,
        icon: SECTIONS[key].icon,
        href: `/admin?${principal.platformAdmin ? `tenant=${tenantId}&` : ""}section=${key}`,
        active: section === key,
        group: i === 0 ? "School" : undefined,
      }),
    );
  }

  let title: string;
  let subtitle: string;
  let content: ReactNode;
  if (tenantId) {
    ({ title, subtitle } = SECTIONS[section]);
    if (section === "classes" && classId) {
      title = watch ? "Watching live" : "Class detail";
      subtitle = watch ? "Read-only, as the teacher sees it" : "Participants, events and downloads";
    }
    content = (
      <TenantDetail
        session={session}
        id={tenantId}
        section={section}
        classId={classId}
        watch={watch}
        platformAdmin={principal.platformAdmin}
      />
    );
  } else if (principal.platformAdmin) {
    ({ title, subtitle } = PLATFORM[view]);
    content = {
      overview: <Overview session={session} />,
      schools: <TenantList session={session} />,
      new: <EnrolTenant session={session} />,
      live: <ClassList key="live" session={session} initialStatus="live" lockStatus />,
      classes: <ClassList key="all" session={session} />,
      webhooks: <FailedWebhooks session={session} />,
      audit: <PlatformAudit session={session} />,
    }[view];
  } else {
    title = "No admin access";
    subtitle = principal.label;
    content = (
      <Card className="max-w-md">
        <h2 className="text-base font-bold">No admin access</h2>
        <p className="mt-1 text-sm text-ink-soft">
          You&apos;re signed in, but your account has no Class Analytics admin role. Ask your administrator to grant one.
        </p>
      </Card>
    );
  }

  const role = principal.platformAdmin ? "Platform admin" : principal.tenantAdmin ? "School admin" : "No admin role";
  return (
    <AppShell
      brand={{
        mark: <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-accent text-base font-extrabold text-white">C</span>,
        name: "Class Analytics",
        sub: "Admin console",
      }}
      navLabel={principal.platformAdmin ? "Platform" : undefined}
      nav={nav}
      footer={
        <>
          <div className="hidden px-3 py-2 lg:block">
            <p className="truncate text-[13px] font-semibold">{principal.label}</p>
            <div className="mt-1">
              <Chip tone={principal.platformAdmin || principal.tenantAdmin ? "good" : "warn"}>{role}</Chip>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout(session).then(clearSession)}
            className={navItemClass}
            aria-label="Sign out"
            title="Sign out"
          >
            <IconLogOut />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </>
      }
      title={title}
      subtitle={subtitle}
    >
      {content}
    </AppShell>
  );
}
