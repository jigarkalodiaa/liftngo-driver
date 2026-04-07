import { io, type Socket } from "socket.io-client";
import type { DriverSegment } from "@/lib/driver/driverSegment";
import { DriverEventType, SocketEvents, type TripSyncPayload } from "@/lib/socket/socketEvents";

const DEFAULT_URL = "http://127.0.0.1:3001";

function socketUrl(): string {
  if (typeof window === "undefined") return DEFAULT_URL;
  return process.env.NEXT_PUBLIC_SOCKET_URL || DEFAULT_URL;
}

let socket: Socket | null = null;
let driverIdCache: string | null = null;

export function getDriverSocket(): Socket | null {
  return socket;
}

export function connectDriverSocket(driverId: string): Socket {
  driverIdCache = driverId;
  if (socket?.connected) {
    socket.emit(SocketEvents.JOIN_DRIVER, { driverId });
    return socket;
  }
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  const s = io(socketUrl(), {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
  });

  s.on("connect", () => {
    s.emit(SocketEvents.JOIN_DRIVER, { driverId });
    const lastTripId = typeof window !== "undefined" ? sessionStorage.getItem("liftngo_last_trip_id") : null;
    if (lastTripId) {
      s.emit(SocketEvents.JOIN_TRIP, { tripId: lastTripId, driverId });
      s.emit(SocketEvents.TRIP_RESYNC_REQUEST, { tripId: lastTripId, driverId });
    }
  });

  s.on("connect_error", () => {
    /* UI can poll; socket.io retries */
  });

  socket = s;
  return s;
}

export function disconnectDriverSocket(): void {
  socket?.disconnect();
  socket = null;
  driverIdCache = null;
}

export function joinTripRoom(tripId: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("liftngo_last_trip_id", tripId);
  }
  const id = driverIdCache || "unknown";
  socket?.emit(SocketEvents.JOIN_TRIP, { tripId, driverId: id });
}

export function leaveTripRoom(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("liftngo_last_trip_id");
  }
}

export function emitDriverEvent(payload: TripSyncPayload): void {
  if (!socket?.connected) return;
  socket.emit(SocketEvents.DRIVER_EVENT, {
    ...payload,
    ts: Date.now(),
    driverId: driverIdCache || undefined,
  });
}

export function emitStatusUpdate(tripId: string, status: string): void {
  emitDriverEvent({
    type: DriverEventType.TRIP_STATUS_UPDATE,
    tripId,
    status,
  });
}

/** Sync availability + partner segment for dispatch priority when socket is connected. */
export function emitDriverAvailability(available: boolean, segment?: DriverSegment): void {
  const s = socket;
  if (!s?.connected || driverIdCache == null) return;
  s.emit(SocketEvents.DRIVER_AVAILABILITY, {
    driverId: driverIdCache,
    available,
    segment,
    ts: Date.now(),
  });
}

export function onTripSync(handler: (payload: TripSyncPayload) => void): () => void {
  const s = socket;
  if (!s) return () => {};
  const fn = (p: TripSyncPayload) => handler(p);
  s.on(SocketEvents.TRIP_SYNC, fn);
  return () => {
    s.off(SocketEvents.TRIP_SYNC, fn);
  };
}

export function onTripCancelled(handler: (payload: { tripId: string; reason?: string }) => void): () => void {
  const s = socket;
  if (!s) return () => {};
  const fn = (p: { tripId: string; reason?: string }) => handler(p);
  s.on(SocketEvents.TRIP_CANCELLED, fn);
  return () => {
    s.off(SocketEvents.TRIP_CANCELLED, fn);
  };
}
