"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { getSocket } from "@/services/socket";
import {
  attachCustomerDispatchEngine,
  reconcileDispatchState,
} from "@/services/socketEvents";
import { useCustomerDispatchStore } from "@/stores/customerDispatchStore";

const SEARCHING_TIMEOUT_MS = 45_000;
const LOCATION_STALE_MS = 30_000;

export type UseCustomerSocketOptions = {
  enabled: boolean;
  /** Dependency only: bump when customer auth changes. REST uses axios interceptor Bearer when set. */
  authToken: string | null;
};

/**
 * Customer dispatch: socket engine + reconciliation + searching timeout + driver location staleness.
 */
export function useCustomerSocket(options: UseCustomerSocketOptions) {
  const { enabled, authToken } = options;

  const { isSearching, driverLocation } = useCustomerDispatchStore(
    useShallow((s) => ({
      isSearching: s.isSearching,
      driverLocation: s.driverLocation,
    }))
  );

  useEffect(() => {
    if (!enabled) return;
    const s = getSocket();
    if (!s) return;

    const detach = attachCustomerDispatchEngine(s);

    const runSync = () => {
      void reconcileDispatchState("CUSTOMER");
    };

    const onReconnect = () => {
      runSync();
    };

    s.on("connect", runSync);
    s.on("reconnect", onReconnect);
    if (s.connected) runSync();

    return () => {
      s.off("connect", runSync);
      s.off("reconnect", onReconnect);
      detach();
    };
  }, [enabled, authToken]);

  useEffect(() => {
    if (!isSearching) {
      useCustomerDispatchStore.getState().setNeedsSearchRetry(false);
      return;
    }
    const id = window.setTimeout(() => {
      useCustomerDispatchStore.getState().setNeedsSearchRetry(true);
    }, SEARCHING_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [isSearching]);

  useEffect(() => {
    if (!driverLocation) {
      useCustomerDispatchStore.getState().markLocationStale(false);
      return;
    }
    const id = window.setInterval(() => {
      const stale = Date.now() - driverLocation.updatedAt > LOCATION_STALE_MS;
      useCustomerDispatchStore.getState().markLocationStale(stale);
    }, 5000);
    return () => window.clearInterval(id);
  }, [driverLocation]);
}
