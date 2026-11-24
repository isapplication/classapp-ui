"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveSession } from "@/lib/admin-session";
import { finishSso } from "@/lib/oidc";
import { Card, Spinner } from "../ui";

export function SsoCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // the authorization code is single-use
    started.current = true;
    finishSso(new URLSearchParams(params.toString()))
      .then((token) => {
        saveSession({ kind: "sso", token });
        router.replace("/admin");
      })
      .catch((e: Error) => setError(e.message));
  }, [params, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      {error ? (
        <Card className="max-w-sm">
          <h1 className="text-base font-bold">Sign-in didn&apos;t complete</h1>
          <p className="mt-1 text-sm text-ink-soft">{error}</p>
          <Link href="/admin" className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
            Back to sign-in
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-sm text-ink-soft">Signing you in…</p>
        </div>
      )}
    </main>
  );
}
