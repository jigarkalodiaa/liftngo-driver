import { broadcastAcceptLock, broadcastAcceptRelease } from "@/lib/dispatch/tabLeader";
import { acceptTrip, rejectTrip } from "@/services/tripRest";
import { useDriverDispatchStore } from "@/stores/driverDispatchStore";
import type { DispatchTrip } from "@/types/dispatch";

export type DispatchActionResult = { ok: true } | { ok: false; message: string; status?: number };

/**
 * Accept with trip locking, optimistic removal, rollback on REST failure, multi-tab signal.
 * Auth: Bearer from axios interceptor (`getLiftngoBearerToken`).
 */
export async function driverDispatchAcceptTrip(tripId: string): Promise<DispatchActionResult> {
  const store = useDriverDispatchStore.getState();
  if (store.actionLocks.has(tripId) || store.externalBusyTripIds.has(tripId)) {
    return { ok: false, message: "Trip is locked" };
  }
  const snapshot = store.availableTrips.get(tripId);
  if (!snapshot) {
    return { ok: false, message: "Offer no longer available" };
  }

  broadcastAcceptLock(tripId);
  store.lockAction(tripId, "accept");
  store.removeAvailableTrip(tripId);

  try {
    const res = await acceptTrip(tripId);
    if (!res.ok) {
      store.upsertAvailableOffer(snapshot);
      store.unlockAction(tripId);
      broadcastAcceptRelease(tripId);
      return { ok: false, message: res.message, status: res.status };
    }
    store.unlockAction(tripId);
    broadcastAcceptRelease(tripId);
    return { ok: true };
  } catch (e) {
    store.upsertAvailableOffer(snapshot);
    store.unlockAction(tripId);
    broadcastAcceptRelease(tripId);
    const message = e instanceof Error ? e.message : "network_error";
    return { ok: false, message };
  }
}

export async function driverDispatchRejectTrip(tripId: string): Promise<DispatchActionResult> {
  const store = useDriverDispatchStore.getState();
  if (store.actionLocks.has(tripId)) {
    return { ok: false, message: "Action in progress" };
  }
  const snapshot = store.availableTrips.get(tripId);
  store.lockAction(tripId, "reject");
  store.removeAvailableTrip(tripId);
  try {
    const res = await rejectTrip(tripId);
    store.unlockAction(tripId);
    if (!res.ok) {
      if (snapshot) store.upsertAvailableOffer(snapshot);
      return { ok: false, message: res.message, status: res.status };
    }
    return { ok: true };
  } catch (e) {
    store.unlockAction(tripId);
    if (snapshot) store.upsertAvailableOffer(snapshot);
    const message = e instanceof Error ? e.message : "network_error";
    return { ok: false, message };
  }
}

/** Restore offer if reject failed and server still shows trip open (optional server sync). */
export function restoreDriverOffer(trip: DispatchTrip): void {
  useDriverDispatchStore.getState().upsertAvailableOffer(trip);
}
