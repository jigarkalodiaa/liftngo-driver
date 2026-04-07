import { useDriverDispatchStore } from "@/stores/driverDispatchStore";

export const DRIVER_OFFER_TTL_MS = 14_000;

const offerTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function clearDriverOfferTimer(tripId: string): void {
  const t = offerTimers.get(tripId);
  if (t) clearTimeout(t);
  offerTimers.delete(tripId);
}

export function scheduleDriverOfferExpiry(tripId: string, ttlMs = DRIVER_OFFER_TTL_MS): void {
  clearDriverOfferTimer(tripId);
  offerTimers.set(
    tripId,
    setTimeout(() => {
      useDriverDispatchStore.getState().expireAvailableIfUnlocked(tripId);
      offerTimers.delete(tripId);
    }, ttlMs),
  );
}

export function clearAllDriverOfferTimers(): void {
  for (const id of [...offerTimers.keys()]) clearDriverOfferTimer(id);
}
