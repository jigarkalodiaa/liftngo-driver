import { getLiftngoBearerToken } from "@/lib/api/bearerToken";
import { patchDriverLocation } from "@/services/api";

const DEFAULT_MS = 2000;

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: { lat: number; lng: number; heading?: number } | null = null;

export function flushDebouncedDriverLocation(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (pending && getLiftngoBearerToken()) {
    void patchDriverLocation(pending);
  }
  pending = null;
}

export function queueDebouncedDriverLocation(
  loc: { lat: number; lng: number; heading?: number },
  debounceMs = DEFAULT_MS,
): void {
  if (!getLiftngoBearerToken()) return;
  pending = loc;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    const p = pending;
    pending = null;
    if (p && getLiftngoBearerToken()) void patchDriverLocation(p);
  }, debounceMs);
}
