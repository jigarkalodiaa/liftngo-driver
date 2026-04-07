import { create } from "zustand";
import { mergeMachineState, normalizeStatusToMachine } from "@/lib/dispatch/tripStateMachine";
import type { DispatchDriver, DispatchLocation, DispatchTrip, TripMachineState } from "@/types/dispatch";

type State = {
  currentTrip: DispatchTrip | null;
  driverLocation: DispatchLocation | null;
  tripMachineState: TripMachineState;
  isSearching: boolean;
  searchingStartedAt: number | null;
  needsSearchRetry: boolean;
  driverLocationStale: boolean;
  lastEventAt: number;
  eventVersion: number | undefined;
  lastMessage: string | null;
};

type Actions = {
  applySearching: (tripId: string, partial?: Partial<DispatchTrip>, meta?: { ts?: number; version?: number }) => void;
  applyAccepted: (
    tripId: string,
    trip?: Partial<DispatchTrip>,
    driver?: DispatchDriver,
    meta?: { ts?: number; version?: number },
  ) => void;
  applyExpired: (tripId: string, message?: string, meta?: { ts?: number; version?: number }) => void;
  applyCancelled: (tripId: string, reason?: string, meta?: { ts?: number; version?: number }) => void;
  applyStatus: (
    tripId: string,
    status: string,
    partial?: Partial<DispatchTrip>,
    meta?: { ts?: number; version?: number },
  ) => void;
  applyLocation: (
    tripId: string,
    loc: Omit<DispatchLocation, "updatedAt"> & { updatedAt?: number },
    meta?: { ts?: number; version?: number },
  ) => void;
  setFromServerTrip: (trip: DispatchTrip | null) => void;
  setNeedsSearchRetry: (v: boolean) => void;
  markLocationStale: (v: boolean) => void;
  reset: () => void;
};

const initial: State = {
  currentTrip: null,
  driverLocation: null,
  tripMachineState: "IDLE",
  isSearching: false,
  searchingStartedAt: null,
  needsSearchRetry: false,
  driverLocationStale: false,
  lastEventAt: 0,
  eventVersion: undefined,
  lastMessage: null,
};

function bumpMeta(
  s: State,
  meta?: { ts?: number; version?: number },
): { lastEventAt: number; eventVersion: number | undefined } | null {
  const ts = meta?.ts ?? Date.now();
  const ver = meta?.version;
  if (ver != null && s.eventVersion != null && ver < s.eventVersion) return null;
  if (ts + 2 < s.lastEventAt && ver == null) return null;
  return {
    lastEventAt: Math.max(s.lastEventAt, ts),
    eventVersion: ver != null ? Math.max(s.eventVersion ?? 0, ver) : s.eventVersion,
  };
}

export const useCustomerDispatchStore = create<State & Actions>((set, get) => ({
  ...initial,

  applySearching: (tripId, partial, meta) => {
    const s = get();
    const m = bumpMeta(s, meta);
    if (!m) return;
    set({
      isSearching: true,
      needsSearchRetry: false,
      searchingStartedAt: Date.now(),
      currentTrip: { tripId, machineState: "SEARCHING", lastEventAt: m.lastEventAt, ...partial },
      tripMachineState: "SEARCHING",
      driverLocation: null,
      lastEventAt: m.lastEventAt,
      eventVersion: m.eventVersion,
      lastMessage: null,
    });
  },

  applyAccepted: (tripId, trip, driver, meta) => {
    const s = get();
    const m = bumpMeta(s, meta);
    if (!m && s.currentTrip?.tripId === tripId) return;
    if (s.currentTrip && s.currentTrip.tripId !== tripId) return;
    const base =
      s.currentTrip?.tripId === tripId
        ? s.currentTrip
        : { tripId, machineState: "IDLE" as const, lastEventAt: 0 };
    const lastAt = m?.lastEventAt ?? Math.max(base.lastEventAt, meta?.ts ?? Date.now());
    const merged: DispatchTrip = {
      ...base,
      ...trip,
      tripId,
      driver: driver ?? trip?.driver ?? base.driver,
      machineState: mergeMachineState(base.machineState, "ASSIGNED"),
      lastEventAt: lastAt,
      eventVersion: m?.eventVersion ?? meta?.version ?? base.eventVersion,
    };
    set({
      currentTrip: merged,
      tripMachineState: "ASSIGNED",
      isSearching: false,
      needsSearchRetry: false,
      lastEventAt: merged.lastEventAt,
      eventVersion: merged.eventVersion,
      lastMessage: null,
    });
  },

  applyExpired: (tripId, message, meta) => {
    const s = get();
    if (s.currentTrip && s.currentTrip.tripId !== tripId) return;
    const m = bumpMeta(s, meta);
    if (!m) return;
    set({
      tripMachineState: "EXPIRED",
      isSearching: false,
      lastMessage: message ?? "No drivers available",
      lastEventAt: m.lastEventAt,
      eventVersion: m.eventVersion,
    });
  },

  applyCancelled: (tripId, reason, meta) => {
    const s = get();
    if (s.currentTrip && s.currentTrip.tripId !== tripId) return;
    const m = bumpMeta(s, meta);
    if (!m) return;
    set({
      tripMachineState: "CANCELLED",
      isSearching: false,
      lastMessage: reason ?? "Trip cancelled",
      lastEventAt: m.lastEventAt,
      eventVersion: m.eventVersion,
    });
  },

  applyStatus: (tripId, status, partial, meta) => {
    const s = get();
    if (!s.currentTrip || s.currentTrip.tripId !== tripId) return;
    const m = bumpMeta(s, meta);
    if (!m) return;
    const normalized = normalizeStatusToMachine(status);
    const nextMachine = normalized
      ? mergeMachineState(s.tripMachineState, normalized)
      : s.tripMachineState;
    const mergedTrip: DispatchTrip = {
      ...s.currentTrip,
      ...partial,
      tripId,
      rawStatus: status,
      machineState: nextMachine,
      lastEventAt: m.lastEventAt,
      eventVersion: m.eventVersion,
    };
    set({
      currentTrip: mergedTrip,
      tripMachineState: nextMachine,
      lastEventAt: m.lastEventAt,
      eventVersion: m.eventVersion,
    });
  },

  applyLocation: (tripId, loc, meta) => {
    const s = get();
    if (!s.currentTrip || s.currentTrip.tripId !== tripId) return;
    const m = bumpMeta(s, meta);
    if (!m) return;
    set({
      driverLocation: {
        lat: loc.lat,
        lng: loc.lng,
        heading: loc.heading,
        speed: loc.speed,
        updatedAt: loc.updatedAt ?? Date.now(),
      },
      driverLocationStale: false,
      lastEventAt: m.lastEventAt,
      eventVersion: m.eventVersion,
    });
  },

  setFromServerTrip: (trip) => {
    if (!trip) {
      set(initial);
      return;
    }
    set({
      currentTrip: trip,
      tripMachineState: trip.machineState,
      isSearching: trip.machineState === "SEARCHING",
      searchingStartedAt: trip.machineState === "SEARCHING" ? Date.now() : null,
      lastEventAt: trip.lastEventAt,
      eventVersion: trip.eventVersion,
    });
  },

  setNeedsSearchRetry: (v) => set({ needsSearchRetry: v }),

  markLocationStale: (v) => set({ driverLocationStale: v }),

  reset: () => set(initial),
}));
