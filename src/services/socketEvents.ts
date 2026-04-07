import { toast } from "sonner";
import { playTripOfferSound } from "@/lib/socket/playTripOfferSound";
import { dispatchSocketLog } from "@/lib/dispatch/socketDebug";
import type { Socket } from "socket.io-client";
import {
  emitJoinTrip,
  getSocketSession,
  LIFTNGO_SOCKET_EVENTS,
} from "@/services/socket";
import {
  fetchCustomerCurrentTrip,
  fetchDriverActiveTrip,
} from "@/services/dispatchRest";
import { useCustomerDispatchStore } from "@/stores/customerDispatchStore";
import { useDriverDispatchStore } from "@/stores/driverDispatchStore";
import type { DispatchTrip, LiftngoSocketRole, SocketEventMap } from "@/types/dispatch";
import { normalizeStatusToMachine } from "@/lib/dispatch/tripStateMachine";
import {
  clearAllDriverOfferTimers,
  clearDriverOfferTimer,
  DRIVER_OFFER_TTL_MS,
  scheduleDriverOfferExpiry,
} from "@/lib/dispatch/offerTimers";

const notifiedNewTripIds = new Set<string>();

function buildDriverOfferFromPayload(p: SocketEventMap["trip:new"]): DispatchTrip {
  const ts = p.ts ?? Date.now();
  const expires = p.expiresAt ?? ts + DRIVER_OFFER_TTL_MS;
  return {
    tripId: p.tripId,
    orderId: p.orderId,
    machineState: "IDLE",
    rawStatus: "OFFER",
    fareInr: p.fareInr,
    paymentMode: p.paymentMode,
    pickup: p.pickup,
    drop: p.drop,
    customerId: p.customerId,
    lastEventAt: ts,
    eventVersion: p.version,
    offerExpiresAt: expires,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function resetDriverTripOfferNotifications(): void {
  notifiedNewTripIds.clear();
}

export function detachAllDispatchTimers(): void {
  clearAllDriverOfferTimers();
  notifiedNewTripIds.clear();
}

/** After reconnect: REST truth + rejoin rooms. */
export async function reconcileDispatchState(
  role: LiftngoSocketRole,
  token: string | null,
): Promise<void> {
  dispatchSocketLog("socket", "reconcile:start", { role });
  if (role === "DRIVER") {
    const r = await fetchDriverActiveTrip(token);
    if (r.ok) {
      if (r.data) {
        useDriverDispatchStore.getState().setActiveTripFromServer(r.data);
        emitJoinTrip(r.data.tripId, "DRIVER");
      } else {
        useDriverDispatchStore.getState().setActiveTripFromServer(null);
      }
    }
    useDriverDispatchStore.getState().touchLastSocketSync();
  } else {
    const r = await fetchCustomerCurrentTrip(token);
    if (r.ok) {
      if (r.data) {
        useCustomerDispatchStore.getState().setFromServerTrip(r.data);
        emitJoinTrip(r.data.tripId, "CUSTOMER");
      } else {
        useCustomerDispatchStore.getState().reset();
      }
    }
    useCustomerDispatchStore.getState().markLocationStale(false);
  }
  dispatchSocketLog("socket", "reconcile:done", { role });
}

export type AttachDispatchEngineOptions = {
  notifyNewTrip?: boolean;
  playSoundOnNewTrip?: boolean;
};

/** Centralized driver-side socket handlers (dispatch store + timers + toasts). */
export function attachDriverDispatchEngine(
  socket: Socket,
  options?: AttachDispatchEngineOptions,
): () => void {
  const notify = options?.notifyNewTrip !== false;
  const sound = options?.playSoundOnNewTrip !== false;

  const onNew = (raw: unknown) => {
    const p = raw as SocketEventMap["trip:new"];
    if (!p?.tripId) return;
    dispatchSocketLog("driver", LIFTNGO_SOCKET_EVENTS.TRIP_NEW, p);
    const trip = buildDriverOfferFromPayload(p);
    useDriverDispatchStore.getState().upsertAvailableOffer(trip);
    scheduleDriverOfferExpiry(trip.tripId);
    const first = !notifiedNewTripIds.has(p.tripId);
    if (first) notifiedNewTripIds.add(p.tripId);
    if (first && notify) {
      toast.info("New trip request", { description: p.orderId ?? p.tripId });
    }
    if (first && sound) playTripOfferSound();
  };

  const onMissed = (raw: unknown) => {
    const p = raw as SocketEventMap["trip:missed"];
    if (!p?.tripId) return;
    dispatchSocketLog("driver", LIFTNGO_SOCKET_EVENTS.TRIP_MISSED, p);
    clearDriverOfferTimer(p.tripId);
    useDriverDispatchStore.getState().removeAvailableTrip(p.tripId);
  };

  const onCancelled = (raw: unknown) => {
    const p = raw as SocketEventMap["trip:cancelled"];
    if (!p?.tripId) return;
    dispatchSocketLog("driver", LIFTNGO_SOCKET_EVENTS.TRIP_CANCELLED, p);
    clearDriverOfferTimer(p.tripId);
    useDriverDispatchStore.getState().removeAvailableTrip(p.tripId);
    const active = useDriverDispatchStore.getState().activeTrip;
    if (active?.tripId === p.tripId) {
      useDriverDispatchStore.getState().setActiveTrip(null);
    }
    toast.message("Trip cancelled", { description: p.tripId });
  };

  const onStatus = (raw: unknown) => {
    const p = raw as SocketEventMap["trip:status"];
    if (!p?.tripId || !p.status) return;
    dispatchSocketLog("driver", LIFTNGO_SOCKET_EVENTS.TRIP_STATUS, p);
    const d = useDriverDispatchStore.getState();
    if (d.activeTrip?.tripId === p.tripId) {
      d.mergeActiveTripFromSocket(p.tripId, p.status, p.trip, { ts: p.ts, version: p.version });
      return;
    }
    if (d.availableTrips.has(p.tripId)) {
      const prev = d.availableTrips.get(p.tripId)!;
      const normalized = normalizeStatusToMachine(p.status);
      d.upsertAvailableOffer({
        ...prev,
        ...p.trip,
        tripId: p.tripId,
        rawStatus: p.status,
        machineState: normalized ?? prev.machineState,
        lastEventAt: Math.max(prev.lastEventAt, p.ts ?? Date.now()),
        eventVersion:
          p.version != null ? Math.max(prev.eventVersion ?? 0, p.version) : prev.eventVersion,
      });
    }
  };

  socket.on(LIFTNGO_SOCKET_EVENTS.TRIP_NEW, onNew);
  socket.on(LIFTNGO_SOCKET_EVENTS.TRIP_MISSED, onMissed);
  socket.on(LIFTNGO_SOCKET_EVENTS.TRIP_CANCELLED, onCancelled);
  socket.on(LIFTNGO_SOCKET_EVENTS.TRIP_STATUS, onStatus);

  return () => {
    socket.off(LIFTNGO_SOCKET_EVENTS.TRIP_NEW, onNew);
    socket.off(LIFTNGO_SOCKET_EVENTS.TRIP_MISSED, onMissed);
    socket.off(LIFTNGO_SOCKET_EVENTS.TRIP_CANCELLED, onCancelled);
    socket.off(LIFTNGO_SOCKET_EVENTS.TRIP_STATUS, onStatus);
  };
}

export function attachCustomerDispatchEngine(socket: Socket): () => void {
  const onSearching = (raw: unknown) => {
    const p = raw as SocketEventMap["trip:searching"];
    if (!p?.tripId) return;
    dispatchSocketLog("customer", LIFTNGO_SOCKET_EVENTS.TRIP_SEARCHING, p);
    useCustomerDispatchStore.getState().applySearching(p.tripId, undefined, {
      ts: p.ts,
      version: p.version,
    });
  };

  const onAccepted = (raw: unknown) => {
    const p = raw as SocketEventMap["trip:accepted"];
    if (!p?.tripId) return;
    dispatchSocketLog("customer", LIFTNGO_SOCKET_EVENTS.TRIP_ACCEPTED, p);
    useCustomerDispatchStore.getState().applyAccepted(p.tripId, p.trip, p.driver, {
      ts: p.ts,
      version: p.version,
    });
    const sess = getSocketSession();
    if (sess?.role === "CUSTOMER") {
      emitJoinTrip(p.tripId, "CUSTOMER");
    }
    toast.success("Driver assigned", { description: p.driver?.name ?? p.tripId });
  };

  const onExpired = (raw: unknown) => {
    const p = raw as SocketEventMap["trip:expired"];
    if (!p?.tripId) return;
    dispatchSocketLog("customer", LIFTNGO_SOCKET_EVENTS.TRIP_EXPIRED, p);
    useCustomerDispatchStore.getState().applyExpired(p.tripId, p.message, {
      ts: p.ts,
      version: p.version,
    });
    toast.error("No drivers available", { description: p.message });
  };

  const onCancelled = (raw: unknown) => {
    const p = raw as SocketEventMap["trip:cancelled"];
    if (!p?.tripId) return;
    dispatchSocketLog("customer", LIFTNGO_SOCKET_EVENTS.TRIP_CANCELLED, p);
    useCustomerDispatchStore.getState().applyCancelled(p.tripId, p.reason, {
      ts: p.ts,
      version: p.version,
    });
    toast.message("Trip cancelled", { description: p.reason });
  };

  const onStatus = (raw: unknown) => {
    const p = raw as SocketEventMap["trip:status"];
    if (!p?.tripId || !p.status) return;
    dispatchSocketLog("customer", LIFTNGO_SOCKET_EVENTS.TRIP_STATUS, p);
    useCustomerDispatchStore.getState().applyStatus(p.tripId, p.status, p.trip, {
      ts: p.ts,
      version: p.version,
    });
  };

  const onLocation = (raw: unknown) => {
    const p = raw as SocketEventMap["location:update"];
    if (!p?.tripId) return;
    dispatchSocketLog("customer", LIFTNGO_SOCKET_EVENTS.LOCATION_UPDATE, p);
    useCustomerDispatchStore.getState().applyLocation(
      p.tripId,
      {
        lat: p.lat,
        lng: p.lng,
        heading: p.heading,
        updatedAt: p.updatedAt ?? p.ts,
      },
      { ts: p.ts, version: p.version },
    );
  };

  socket.on(LIFTNGO_SOCKET_EVENTS.TRIP_SEARCHING, onSearching);
  socket.on(LIFTNGO_SOCKET_EVENTS.TRIP_ACCEPTED, onAccepted);
  socket.on(LIFTNGO_SOCKET_EVENTS.TRIP_EXPIRED, onExpired);
  socket.on(LIFTNGO_SOCKET_EVENTS.TRIP_CANCELLED, onCancelled);
  socket.on(LIFTNGO_SOCKET_EVENTS.TRIP_STATUS, onStatus);
  socket.on(LIFTNGO_SOCKET_EVENTS.LOCATION_UPDATE, onLocation);

  return () => {
    socket.off(LIFTNGO_SOCKET_EVENTS.TRIP_SEARCHING, onSearching);
    socket.off(LIFTNGO_SOCKET_EVENTS.TRIP_ACCEPTED, onAccepted);
    socket.off(LIFTNGO_SOCKET_EVENTS.TRIP_EXPIRED, onExpired);
    socket.off(LIFTNGO_SOCKET_EVENTS.TRIP_CANCELLED, onCancelled);
    socket.off(LIFTNGO_SOCKET_EVENTS.TRIP_STATUS, onStatus);
    socket.off(LIFTNGO_SOCKET_EVENTS.LOCATION_UPDATE, onLocation);
  };
}
