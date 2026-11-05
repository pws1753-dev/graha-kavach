"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `refresh` every few minutes and again when the customer comes back to
 * the tab, so a courier update shows up on a page that is already open.
 * The first load is the caller's job.
 */
export function useAutoRefresh(refresh: () => void, enabled = true, intervalMs = 5 * 60 * 1000) {
  const latest = useRef(refresh);

  useEffect(() => {
    latest.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") latest.current();
    }, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") latest.current();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, intervalMs]);
}
