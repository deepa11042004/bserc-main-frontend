"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EmailApiError } from "@/services/emailServer";

export interface EmailQueryState<T> {
  data: T | null;
  error: EmailApiError | Error | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useEmailQuery<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
  opts: { enabled?: boolean; refreshIntervalMs?: number } = {}
): EmailQueryState<T> {
  const { enabled = true, refreshIntervalMs } = opts;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<EmailApiError | Error | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const isMountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (!isMountedRef.current) return;
      setData(result);
    } catch (e) {
      if (!isMountedRef.current) return;
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      return () => {
        isMountedRef.current = false;
      };
    }
    void run();
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (refreshIntervalMs && refreshIntervalMs > 0) {
      intervalId = setInterval(() => {
        void run();
      }, refreshIntervalMs);
    }
    return () => {
      isMountedRef.current = false;
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refreshIntervalMs, ...deps]);

  return { data, error, loading, refresh: run };
}
