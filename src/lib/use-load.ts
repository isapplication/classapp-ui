"use client";

import { useEffect, useEffectEvent, useState } from "react";

/** Loads data for a key; reload() fetches again. Keeps the previous data while reloading. */
export function useLoad<T>(load: () => Promise<T>, key: string) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: T; error?: unknown }>({ key: "" });
  const run = useEffectEvent(load);
  const requestKey = `${key}#${version}`;

  useEffect(() => {
    let live = true;
    run().then(
      (data) => live && setResult({ key: requestKey, data }),
      (error: unknown) => live && setResult((r) => ({ key: requestKey, data: r.data, error })),
    );
    return () => {
      live = false;
    };
  }, [requestKey]);

  return {
    data: result.data,
    error: result.key === requestKey ? result.error : undefined,
    loading: result.key !== requestKey,
    reload: () => setVersion((v) => v + 1),
  };
}
