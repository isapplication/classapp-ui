"use client";

import { useState } from "react";
import { adminApi, type ClassRow } from "@/lib/admin-api";
import type { AdminSession } from "@/lib/admin-session";
import { useLoad } from "@/lib/use-load";
import { Button, Card } from "../ui";
import { ClassTable } from "./class-table";
import { Notice, TextInput } from "./fields";

type Status = "all" | "live" | "ended";

/** All classes (every school, for platform admins) or one school's, with status tabs and search. */
export function ClassList({
  session,
  tenantId,
  initialStatus = "all",
  lockStatus = false,
}: {
  session: AdminSession;
  tenantId?: string;
  initialStatus?: Status;
  lockStatus?: boolean;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [extra, setExtra] = useState<{ rows: ClassRow[]; more: boolean } | null>(null);
  const filters = { status: status === "all" ? undefined : status, q: q || undefined };
  const first = useLoad(
    () => (tenantId ? adminApi.tenantClasses(session, tenantId, filters) : adminApi.classes(session, filters)),
    `classes:${tenantId ?? "all"}:${status}:${q}`,
  );
  const rows = [...(first.data?.sessions ?? []), ...(extra?.rows ?? [])];
  const more = extra ? extra.more : (first.data?.more ?? false);

  async function loadMore() {
    const params = { ...filters, offset: rows.length };
    const page = tenantId ? await adminApi.tenantClasses(session, tenantId, params) : await adminApi.classes(session, params);
    setExtra({ rows: [...(extra?.rows ?? []), ...page.sessions], more: page.more });
  }

  return (
    <Card className="p-0 sm:p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        {!lockStatus && (
          <div className="flex rounded-lg border border-line bg-surface-2 p-0.5" role="tablist" aria-label="Class status">
            {(["all", "live", "ended"] as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={status === s}
                onClick={() => {
                  setStatus(s);
                  setExtra(null);
                }}
                className={`min-h-8 rounded-md px-3 text-[13px] font-semibold capitalize transition ${status === s ? "bg-surface text-ink shadow-card" : "text-ink-soft hover:text-ink"}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="ml-auto flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search.trim());
            setExtra(null);
          }}
        >
          <TextInput
            id="class-search"
            aria-label="Search classes"
            placeholder={tenantId ? "Search title or id" : "Search class or school"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-9 w-56"
          />
          <Button type="submit" className="min-h-9 px-3">
            Search
          </Button>
        </form>
      </div>
      {first.error instanceof Error && (
        <div className="p-4">
          <Notice tone="error">{first.error.message}</Notice>
        </div>
      )}
      {!first.data && first.loading ? (
        <p className="px-4 py-8 text-center text-sm text-ink-soft">Loading…</p>
      ) : (
        <ClassTable
          classes={rows}
          showSchool={!tenantId}
          empty={status === "live" ? "No classes are live right now." : q ? "No classes match." : "No classes yet."}
        />
      )}
      {more && (
        <div className="border-t border-line p-3 text-center">
          <Button onClick={() => void loadMore()}>Load more</Button>
        </div>
      )}
    </Card>
  );
}
