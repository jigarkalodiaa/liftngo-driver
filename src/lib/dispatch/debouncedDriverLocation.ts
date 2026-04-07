import { patchDriverLocation } from "@/services/dispatchRest";

const DEFAULT_MS = 2000;

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: { lat: number; lng: number; heading?: number } | null = null;
let pendingToken: string | null = null;

export function flushDebouncedDriverLocation(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (pending && pendingToken != null) {
    void patchDriverLocation(pending, pendingToken);
  }
  pending = null;
  pendingToken = null;
}

export function queueDebouncedDriverLocation(
  loc: { lat: number; lng: number; heading?: number },
  token: string | null,
  debounceMs = DEFAULT_MS,
): void {
  if (token == null) return;
  pending = loc;
  pendingToken = token;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    const p = pending;
    const t = pendingToken;
    pending = null;
    pendingToken = null;
    if (p && t) void patchDriverLocation(p, t);
  }, debounceMs);
}
