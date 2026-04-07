import { create } from "zustand";
import { mergeMachineState, normalizeStatusToMachine } from "@/lib/dispatch/tripStateMachine";
import type { DispatchTrip, TripMachineState } from "@/types/dispatch";

export type DriverActionLock = "accept" | "reject";

type State = {
  availableTrips: Map<string, DispatchTrip>;
  activeTrip: DispatchTrip | null;
  isOnline: boolean;
  lastSocketSyncAt: number | null;
  actionLocks: Map<string, DriverActionLock>;
  externalBusyTripIds: Set<string>;
};

type Actions = {
  upsertAvailableOffer: (trip: DispatchTrip) => void;
  removeAvailableTrip: (tripId: string) => void;
  expireAvailableIfUnlocked: (tripId: string) => void;
  clearAvailableTrips: () => void;
  setActiveTrip: (trip: DispatchTrip | null) => void;
  mergeActiveTripFromSocket: (tripId: string, status: string, partial?: Partial<DispatchTrip>, meta?: { ts?: number; version?: number }) => void;
  setActiveTripFromServer: (trip: DispatchTrip | null) => void;
  setIsOnline: (v: boolean) => void;
  touchLastSocketSync: () => void;
  lockAction: (tripId: string, kind: DriverActionLock) => void;
  unlockAction: (tripId: string) => void;
  markExternalBusy: (tripId: string) => void;
  clearExternalBusy: (tripId: string) => void;
  reset: () => void;
};

const initial: State = {
  availableTrips: new Map(),
  activeTrip: null,
  isOnline: false,
  lastSocketSyncAt: null,
  actionLocks: new Map(),
  externalBusyTripIds: new Set(),
};

export const useDriverDispatchStore = create<State & Actions>((set, get) => ({
  ...initial,

  upsertAvailableOffer: (trip) =>
    set((s) => {
      const next = new Map(s.availableTrips);
      const prev = next.get(trip.tripId);
      if (prev) {
        if (
          trip.eventVersion != null &&
          prev.eventVersion != null &&
          trip.eventVersion < prev.eventVersion
        ) {
          return s;
        }
        if (trip.lastEventAt < prev.lastEventAt - 1) return s;
      }
      next.set(trip.tripId, { ...prev, ...trip, tripId: trip.tripId });
      return { availableTrips: next };
    }),

  removeAvailableTrip: (tripId) =>
    set((s) => {
      const next = new Map(s.availableTrips);
      next.delete(tripId);
      return { availableTrips: next };
    }),

  expireAvailableIfUnlocked: (tripId) => {
    const s = get();
    if (s.actionLocks.has(tripId) || s.externalBusyTripIds.has(tripId)) return;
    if (!s.availableTrips.has(tripId)) return;
    const next = new Map(s.availableTrips);
    next.delete(tripId);
    set({ availableTrips: next });
  },

  clearAvailableTrips: () => set({ availableTrips: new Map() }),

  setActiveTrip: (trip) => set({ activeTrip: trip }),

  setActiveTripFromServer: (trip) =>
    set((s) => {
      if (!trip) return { activeTrip: null };
      const next = new Map(s.availableTrips);
      next.delete(trip.tripId);
      return { activeTrip: trip, availableTrips: next };
    }),

  mergeActiveTripFromSocket: (tripId, status, partial, meta) =>
    set((s) => {
      const cur = s.activeTrip;
      if (!cur || cur.tripId !== tripId) return s;
      const incomingTs = meta?.ts ?? Date.now();
      const incomingVer = meta?.version;
      if (
        incomingVer != null &&
        cur.eventVersion != null &&
        incomingVer < cur.eventVersion
      ) {
        return s;
      }
      if (incomingTs + 2 < cur.lastEventAt) return s;
      const normalized = normalizeStatusToMachine(status);
      const nextMachine: TripMachineState = normalized
        ? mergeMachineState(cur.machineState, normalized)
        : cur.machineState;
      const merged: DispatchTrip = {
        ...cur,
        ...partial,
        tripId,
        rawStatus: status,
        machineState: nextMachine,
        lastEventAt: Math.max(cur.lastEventAt, incomingTs),
        eventVersion:
          incomingVer != null
            ? Math.max(cur.eventVersion ?? 0, incomingVer)
            : cur.eventVersion,
      };
      return { activeTrip: merged };
    }),

  setIsOnline: (v) => set({ isOnline: v }),

  touchLastSocketSync: () => set({ lastSocketSyncAt: Date.now() }),

  lockAction: (tripId, kind) =>
    set((s) => {
      const next = new Map(s.actionLocks);
      next.set(tripId, kind);
      return { actionLocks: next };
    }),

  unlockAction: (tripId) =>
    set((s) => {
      const next = new Map(s.actionLocks);
      next.delete(tripId);
      return { actionLocks: next };
    }),

  markExternalBusy: (tripId) =>
    set((s) => {
      const next = new Set(s.externalBusyTripIds);
      next.add(tripId);
      return { externalBusyTripIds: next };
    }),

  clearExternalBusy: (tripId) =>
    set((s) => {
      const next = new Set(s.externalBusyTripIds);
      next.delete(tripId);
      return { externalBusyTripIds: next };
    }),

  reset: () => set({ ...initial, availableTrips: new Map(), actionLocks: new Map(), externalBusyTripIds: new Set() }),
}));
