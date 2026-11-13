"use client";

import { useEffect } from "react";
import { claimChunkRecovery, isChunkLoadError } from "@/lib/chunk-recovery";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const staleAsset = isChunkLoadError(error);
  useEffect(() => {
    try {
      if (staleAsset && claimChunkRecovery(window.sessionStorage, window.location.pathname)) window.location.reload();
    } catch { /* Manual reload remains available when browser storage is blocked. */ }
  }, [staleAsset]);
  return (
    <main className="mx-auto grid min-h-[60svh] max-w-3xl place-items-center px-6 py-20 text-center">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-danger">{staleAsset ? "Page updated" : "Please try again"}</p>
        <h1 className="mt-3 text-4xl font-medium text-foreground">{staleAsset ? "Reload to continue your booking" : "We cannot load this page right now"}</h1>
        <p className="mt-4 text-muted-foreground">
          {staleAsset ? "A newer version of this page is available. Please reload to continue." : "Please try again in a moment. If this continues, contact our support team."}
        </p>
        <button className="mt-8 min-h-11 bg-primary px-5 text-sm font-medium text-primary-foreground" type="button" onClick={() => staleAsset ? window.location.reload() : retry()}>
          Try again
        </button>
      </div>
    </main>
  );
}
