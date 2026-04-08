"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { connectDriverSocket, disconnectDriverSocket } from "@/lib/socket/driverSocketClient";
import { connectSocket, disconnectSocket, getSocket } from "@/services/socket";
import { useLiftngoSocketRuntimeStore } from "@/stores/liftngoSocketRuntimeStore";
import type { LiftngoSocketRole } from "@/types/liftngoSocket";

export type UseSocketOptions = {
  enabled?: boolean;
};

/**
 * Connects Socket.IO when `userId` is set; disconnects when `userId` is cleared (logout) or `enabled` is false.
 * Drivers use `connectDriverSocket` (auth + legacy join). Customers use `connectSocket` only.
 * Intentionally does **not** disconnect on unmount so in-app navigation keeps the socket.
 */
export function useSocket(userId: string | null, role: LiftngoSocketRole, options?: UseSocketOptions) {
  const enabled = options?.enabled !== false;

  const { connected, reconnecting, lastError, lastDisconnectReason } = useLiftngoSocketRuntimeStore(
    useShallow((s) => ({
      connected: s.connected,
      reconnecting: s.reconnecting,
      lastError: s.lastError,
      lastDisconnectReason: s.lastDisconnectReason,
    }))
  );

  useEffect(() => {
    if (!enabled || !userId) {
      if (role === "DRIVER") disconnectDriverSocket();
      else disconnectSocket();
      return;
    }
    if (role === "DRIVER") connectDriverSocket(userId);
    else connectSocket(userId, role);
  }, [userId, role, enabled]);

  return {
    socket: getSocket(),
    connected,
    reconnecting,
    lastError,
    lastDisconnectReason,
  };
}
