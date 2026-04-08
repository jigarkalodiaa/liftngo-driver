"use client";

import { create } from "zustand";
import {
  fetchDriverPerformanceFromNest,
  getNestAccessToken,
  snapshotToTagging,
  type DriverPerformanceApiSnapshot,
} from "@/services/driverPerformanceApi";
import { buildDriverSegmentPayload, type DriverSegmentPayload } from "@/lib/driver/driverSegment";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import { getDriverTaggingFromToken } from "@/lib/driver/authToken";

const BROADCAST_KEY = "liftngo-driver-performance";

type State = {
  /** From Nest when available; otherwise null and UI falls back to session token. */
  serverSnapshot: DriverPerformanceApiSnapshot | null;
  loading: boolean;
  lastFetchedAt: number | null;
  /** Milliseconds until breakdown suspension ends (client clock). */
  breakdownEndsAtMs: number | null;
  fetchPerformance: () => Promise<void>;
  /** Call after breakdown cancel / multi-tab sync. */
  invalidate: () => void;
  effectiveTagging: () => DriverSegmentPayload | null;
  isBreakdownSuspended: () => boolean;
  breakdownCountdownLabel: () => string | null;
};

function parseBroadcast(raw: string | null): DriverPerformanceApiSnapshot | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DriverPerformanceApiSnapshot;
  } catch {
    return null;
  }
}

export const useDriverPerformanceStore = create<State>((set, get) => ({
  serverSnapshot: null,
  loading: false,
  lastFetchedAt: null,
  breakdownEndsAtMs: null,

  effectiveTagging: () => {
    const snap = get().serverSnapshot;
    if (snap) return snapshotToTagging(snap);
    if (typeof window === "undefined") return null;
    return getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY));
  },

  isBreakdownSuspended: () => {
    const snap = get().serverSnapshot;
    if (!snap?.breakdownSuspended) return false;
    if (!snap.breakdownSuspendedUntil) return true;
    return Date.now() < new Date(snap.breakdownSuspendedUntil).getTime();
  },

  breakdownCountdownLabel: () => {
    const snap = get().serverSnapshot;
    if (!snap?.breakdownSuspendedUntil) return null;
    const end = new Date(snap.breakdownSuspendedUntil).getTime();
    const left = end - Date.now();
    if (left <= 0) return null;
    const h = Math.floor(left / 3_600_000);
    const m = Math.ceil((left % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  },

  invalidate: () => {
    void get().fetchPerformance();
  },

  fetchPerformance: async () => {
    const token = getNestAccessToken();
    if (!token) {
      set({
        serverSnapshot: null,
        breakdownEndsAtMs: null,
        lastFetchedAt: Date.now(),
      });
      return;
    }
    set({ loading: true });
    try {
      const snap = await fetchDriverPerformanceFromNest();
      set({
        serverSnapshot: snap,
        loading: false,
        lastFetchedAt: Date.now(),
        breakdownEndsAtMs: snap?.breakdownSuspendedUntil
          ? new Date(snap.breakdownSuspendedUntil).getTime()
          : null,
      });
      if (snap && typeof localStorage !== "undefined") {
        localStorage.setItem(BROADCAST_KEY, JSON.stringify(snap));
      }
    } finally {
      set({ loading: false });
    }
  },
}));

/** Token-only fallback for first paint (no Nest). */
export function fallbackTaggingFromSession(): DriverSegmentPayload | null {
  if (typeof window === "undefined") return null;
  const fromToken = getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY));
  if (fromToken) return fromToken;
  return buildDriverSegmentPayload({ performanceScore: 100, cancellationRatePct: 0 });
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== BROADCAST_KEY || e.newValue == null) return;
    const snap = parseBroadcast(e.newValue);
    if (snap) {
      useDriverPerformanceStore.setState({
        serverSnapshot: snap,
        breakdownEndsAtMs: snap.breakdownSuspendedUntil
          ? new Date(snap.breakdownSuspendedUntil).getTime()
          : null,
        lastFetchedAt: Date.now(),
      });
    }
  });
}
