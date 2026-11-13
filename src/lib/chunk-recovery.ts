/** Recognise deployment asset failures without retrying payment/network requests. */
export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { name?: unknown; message?: unknown };
  return value.name === "ChunkLoadError" || (typeof value.message === "string" && /loading (?:css )?chunk .+ failed|failed to fetch dynamically imported module|importing a module script failed|css_chunk_load_failed/i.test(value.message));
}

export function claimChunkRecovery(storage: Pick<Storage, "getItem" | "setItem">, pathname: string, now = Date.now()): boolean {
  const key = `gk:chunk-recovery:${pathname}`;
  try {
    const previous = Number(storage.getItem(key));
    if (previous > 0 && now - previous < 60_000) return false;
    storage.setItem(key, String(now));
    return true;
  } catch {
    return false;
  }
}
