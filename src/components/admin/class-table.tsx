"use client";

import Link from "next/link";
import type { ClassRow } from "@/lib/admin-api";
import { PROVIDER, dateTime, since } from "@/lib/format";
import { Chip, Dot } from "../ui";

export function classHref(c: Pick<ClassRow, "tenantId" | "id">) {
  return `/admin?tenant=${c.tenantId}&section=classes&class=${c.id}`;
}

/** Classes as a table: live ones first in the data, linked to their detail page. */
export function ClassTable({ classes, showSchool, empty }: { classes: ClassRow[]; showSchool: boolean; empty: string }) {
  if (classes.length === 0) {
    return <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line bg-surface-2/60 text-[11px] uppercase tracking-wider text-ink-faint">
          <tr>
            <th className="px-4 py-3 font-semibold">Class</th>
            {showSchool && <th className="px-4 py-3 font-semibold">School</th>}
            <th className="px-4 py-3 font-semibold">Started</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">People</th>
            <th className="px-4 py-3 font-semibold">Cameras on</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => {
            const live = !c.endedAt;
            return (
              <tr key={c.id} className="border-b border-line transition-colors last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3">
                  <Link href={classHref(c)} className="font-semibold hover:text-accent hover:underline">
                    {c.title ?? c.externalId}
                  </Link>
                  <p className="text-xs text-ink-faint">
                    {PROVIDER[c.provider] ?? c.provider} · {c.externalId}
                  </p>
                </td>
                {showSchool && <td className="px-4 py-3 text-ink-soft">{c.tenantName}</td>}
                <td className="px-4 py-3 text-ink-soft tabular-nums">{dateTime(c.startedAt)}</td>
                <td className="px-4 py-3">
                  {live ? (
                    <Chip tone="good">
                      <Dot tone="good" pulse /> Live · {since(c.startedAt)}
                    </Chip>
                  ) : (
                    <Chip tone="neutral">Ended · {since(c.startedAt, c.endedAt)}</Chip>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">{live ? `${c.online} online / ${c.participants}` : c.participants}</td>
                <td className="px-4 py-3 tabular-nums">{live ? c.camerasOn : "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
