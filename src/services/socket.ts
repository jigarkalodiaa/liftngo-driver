import { io, type Socket } from "socket.io-client";
import { clearAllDriverOfferTimers } from "@/lib/dispatch/offerTimers";
import { dispatchSocketLog } from "@/lib/dispatch/socketDebug";
import { useLiftngoSocketRuntimeStore } from "@/stores/liftngoSocketRuntimeStore";
import type { JoinTripEmitPayload, LiftngoSocketRole } from "@/types/liftngoSocket";

const DEFAULT_WS = "http://localhost:3001";

/** Canonical event names from LiftNGo backend. */
export const LIFTNGO_SOCKET_EVENTS = {
  JOIN_TRIP: "join:trip",
  TRIP_NEW: "trip:new",
  TRIP_MISSED: "trip:missed",
  TRIP_CANCELLED: "trip:cancelled",
  TRIP_STATUS: "trip:status",
  TRIP_ACCEPTED: "trip:accepted",
  TRIP_SEARCHING: "trip:searching",
  TRIP_EXPIRED: "trip:expired",
  LOCATION_UPDATE: "location:update",
} as const;

export function getSocketUrl(): string {
  if (typeof window === "undefined") return DEFAULT_WS;
  return process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || DEFAULT_WS;
}

let socket: Socket | null = null;
let currentUserId: string | null = null;
let currentRole: LiftngoSocketRole | null = null;

/** Named handlers so we never strip other modules’ listeners. */
function onRuntimeConnect() {
  const st = useLiftngoSocketRuntimeStore.getState();
  st.setReconnecting(false);
  st.setLastError(null);
  st.setConnected(true);
  dispatchSocketLog("socket", "connect", getSocketSession());
}

function onRuntimeDisconnect(reason: string) {
  const st = useLiftngoSocketRuntimeStore.getState();
  st.setConnected(false);
  st.setLastDisconnectReason(reason);
  if (reason !== "io server disconnect") {
    st.setReconnecting(true);
  }
}

function onRuntimeConnectError(err: unknown) {
  const st = useLiftngoSocketRuntimeStore.getState();
  const message = err instanceof Error ? err.message : String(err);
  st.setLastError(message || "connect_error");
  st.setReconnecting(true);
}

function onRuntimeReconnect() {
  const st = useLiftngoSocketRuntimeStore.getState();
  st.setReconnecting(false);
  st.setLastError(null);
}

function bindRuntimeListeners(s: Socket): void {
  s.on("connect", onRuntimeConnect);
  s.on("disconnect", onRuntimeDisconnect);
  s.on("connect_error", onRuntimeConnectError);
  s.on("reconnect", onRuntimeReconnect);
}

function unbindRuntimeListeners(s: Socket): void {
  s.off("connect", onRuntimeConnect);
  s.off("disconnect", onRuntimeDisconnect);
  s.off("connect_error", onRuntimeConnectError);
  s.off("reconnect", onRuntimeReconnect);
}

/**
 * Singleton Socket.IO client with auth `{ userId, role }`.
 * Call after login; use `disconnectSocket` on logout.
 */
export function connectSocket(userId: string, role: LiftngoSocketRole): Socket {
  if (!userId) {
    throw new Error("connectSocket: userId is required");
  }

  if (socket?.connected && currentUserId === userId && currentRole === role) {
    return socket;
  }

  disconnectSocket();

  currentUserId = userId;
  currentRole = role;

  const s = io(getSocketUrl(), {
    auth: { userId, role },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15_000,
    randomizationFactor: 0.5,
    timeout: 20_000,
  });

  bindRuntimeListeners(s);
  socket = s;

  if (s.connected) {
    useLiftngoSocketRuntimeStore.getState().setConnected(true);
  }

  return s;
}

export function getSocket(): Socket | null {
  return socket;
}

export function getSocketSession(): { userId: string; role: LiftngoSocketRole } | null {
  if (!currentUserId || !currentRole) return null;
  return { userId: currentUserId, role: currentRole };
}

export function disconnectSocket(): void {
  clearAllDriverOfferTimers();
  if (socket) {
    unbindRuntimeListeners(socket);
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  currentUserId = null;
  currentRole = null;
  useLiftngoSocketRuntimeStore.getState().reset();
}

/** Join a trip room (driver or customer). */
export function emitJoinTrip(tripId: string, role: LiftngoSocketRole): void {
  const s = getSocket();
  if (!s?.connected) return;
  const payload: JoinTripEmitPayload = { tripId, role };
  dispatchSocketLog("socket", LIFTNGO_SOCKET_EVENTS.JOIN_TRIP, payload);
  s.emit(LIFTNGO_SOCKET_EVENTS.JOIN_TRIP, payload);
}

/** Alias for production API parity with spec. */
export const connect = connectSocket;
export const disconnect = disconnectSocket;
