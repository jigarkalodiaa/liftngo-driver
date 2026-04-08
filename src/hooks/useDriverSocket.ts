"use client";

import { useEffect } from "react";
import { getDispatchTabId, subscribeDispatchTabMessages } from "@/lib/dispatch/tabLeader";
import { getSocket } from "@/services/socket";
import {
  attachDriverDispatchEngine,
  detachAllDispatchTimers,
  reconcileDispatchState,
  resetDriverTripOfferNotifications,
} from "@/services/socketEvents";
import { useDriverDispatchStore } from "@/stores/driverDispatchStore";
import type { AttachDispatchEngineOptions } from "@/services/socketEvents";

export type UseDriverSocketOptions = AttachDispatchEngineOptions & {
  enabled: boolean;
  /** When this changes (e.g. after login), reconciliation runs again. REST Bearer comes from axios interceptor. */
  authToken: string | null;
};

/**
 * Wires the centralized dispatch engine + tab sync + REST reconciliation on connect/reconnect.
 * No trip business logic in components — handlers live in `socketEvents.ts`.
 */
export function useDriverSocket(options: UseDriverSocketOptions) {
  const { enabled, authToken, notifyNewTrip, playSoundOnNewTrip } = options;

  useEffect(() => {
    if (!enabled) {
      detachAllDispatchTimers();
      return;
    }
    const s = getSocket();
    if (!s) return;

    const detachEngine = attachDriverDispatchEngine(s, { notifyNewTrip, playSoundOnNewTrip });

    const runSync = () => {
      void reconcileDispatchState("DRIVER");
    };

    const onReconnect = () => {
      resetDriverTripOfferNotifications();
      runSync();
    };

    s.on("connect", runSync);
    s.on("reconnect", onReconnect);
    if (s.connected) runSync();

    const offTab = subscribeDispatchTabMessages((msg) => {
      if (msg.type === "accept_lock" && msg.tabId !== getDispatchTabId()) {
        useDriverDispatchStore.getState().markExternalBusy(msg.tripId);
      }
      if (msg.type === "accept_release" && msg.tabId !== getDispatchTabId()) {
        useDriverDispatchStore.getState().clearExternalBusy(msg.tripId);
      }
    });

    return () => {
      detachAllDispatchTimers();
      s.off("connect", runSync);
      s.off("reconnect", onReconnect);
      detachEngine();
      offTab();
    };
  }, [enabled, authToken, notifyNewTrip, playSoundOnNewTrip]);
}
