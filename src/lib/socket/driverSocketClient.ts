import type { Socket } from "socket.io-client";
import type { DriverSegment } from "@/lib/driver/driverSegment";
import {
  connectSocket,
  disconnectSocket,
  emitJoinTrip,
  getSocket,
  getSocketSession,
  LIFTNGO_SOCKET_EVENTS,
} from "@/services/socket";
import { DriverEventType, SocketEvents, type TripSyncPayload } from "@/lib/socket/socketEvents";
import type { TripStatusPayload } from "@/types/liftngoSocket";

/** Legacy + LiftNGo: join driver channel and restore trip room after (re)connect. */
function onDriverLegacyConnect() {
  const sess = getSocketSession();
  if (!sess || sess.role !== "DRIVER") return;
  const s = getSocket();
  if (!s) return;
  const driverId = sess.userId;
  s.emit(SocketEvents.JOIN_DRIVER, { driverId });
  const lastTripId = typeof window !== "undefined" ? sessionStorage.getItem("liftngo_last_trip_id") : null;
  if (lastTripId) {
    s.emit(SocketEvents.JOIN_TRIP, { tripId: lastTripId, driverId });
    emitJoinTrip(lastTripId, "DRIVER");
    s.emit(SocketEvents.TRIP_RESYNC_REQUEST, { tripId: lastTripId, driverId });
  }
}

type SocketWithLegacy = Socket & { _liftngoDriverLegacy?: boolean };

function ensureDriverLegacyConnectListener() {
  const s = getSocket() as SocketWithLegacy | null;
  if (!s) return;
  if (s._liftngoDriverLegacy) {
    if (s.connected) onDriverLegacyConnect();
    return;
  }
  s.on("connect", onDriverLegacyConnect);
  s._liftngoDriverLegacy = true;
  if (s.connected) onDriverLegacyConnect();
}

export function getDriverSocket(): Socket | null {
  return getSocket();
}

/**
 * Driver entry point: shared auth socket + legacy `join_driver` / trip room behaviour.
 */
export function connectDriverSocket(driverId: string): Socket {
  const s = connectSocket(driverId, "DRIVER");
  ensureDriverLegacyConnectListener();
  return s;
}

export function disconnectDriverSocket(): void {
  const s = getSocket() as SocketWithLegacy | null;
  if (s) {
    s.off("connect", onDriverLegacyConnect);
    delete s._liftngoDriverLegacy;
  }
  disconnectSocket();
}

export function joinTripRoom(tripId: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("liftngo_last_trip_id", tripId);
  }
  const sess = getSocketSession();
  const s = getSocket();
  if (!s) return;
  const driverId = sess?.role === "DRIVER" ? sess.userId : "unknown";
  s.emit(SocketEvents.JOIN_TRIP, { tripId, driverId });
  if (sess?.role === "DRIVER") {
    emitJoinTrip(tripId, "DRIVER");
  }
}

export function leaveTripRoom(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("liftngo_last_trip_id");
  }
}

export function emitDriverEvent(payload: TripSyncPayload): void {
  const s = getSocket();
  if (!s?.connected) return;
  s.emit(SocketEvents.DRIVER_EVENT, {
    ...payload,
    ts: Date.now(),
    driverId: getSocketSession()?.userId,
  });
}

export function emitStatusUpdate(tripId: string, status: string): void {
  emitDriverEvent({
    type: DriverEventType.TRIP_STATUS_UPDATE,
    tripId,
    status,
  });
}

export function emitDriverAvailability(available: boolean, segment?: DriverSegment): void {
  const s = getSocket();
  const driverId = getSocketSession()?.userId;
  if (!s?.connected || driverId == null) return;
  s.emit(SocketEvents.DRIVER_AVAILABILITY, {
    driverId,
    available,
    segment,
    ts: Date.now(),
  });
}

/** Legacy `trip:sync` plus backend `trip:status` (mapped into the same handler shape). */
export function onTripSync(handler: (payload: TripSyncPayload) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};

  const onLegacy = (p: TripSyncPayload) => handler(p);

  const onLiftngoStatus = (p: TripStatusPayload) => {
    handler({
      type: DriverEventType.TRIP_STATUS_UPDATE,
      tripId: p.tripId,
      status: p.status,
    });
  };

  s.on(SocketEvents.TRIP_SYNC, onLegacy);
  s.on(LIFTNGO_SOCKET_EVENTS.TRIP_STATUS, onLiftngoStatus);
  return () => {
    s.off(SocketEvents.TRIP_SYNC, onLegacy);
    s.off(LIFTNGO_SOCKET_EVENTS.TRIP_STATUS, onLiftngoStatus);
  };
}

export function onTripCancelled(handler: (payload: { tripId: string; reason?: string }) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  const fn = (p: { tripId: string; reason?: string }) => handler(p);
  s.on(SocketEvents.TRIP_CANCELLED, fn);
  return () => {
    s.off(SocketEvents.TRIP_CANCELLED, fn);
  };
}
