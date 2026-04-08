import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "sonner";
import { translateDriver } from "@/lib/i18n/translateStatic";
import type { IncomingOrderRequest } from "@/lib/driver/dummyOrderRequest";
import type { AssignedPickupTrip } from "@/lib/driver/tripAssignment";
import { buildDriverTripSnapshot } from "@/lib/trip/buildDriverTripSnapshot";
import {
  connectDriverSocket,
  emitDriverEvent,
  emitStatusUpdate,
  joinTripRoom,
  leaveTripRoom,
} from "@/lib/socket/driverSocketClient";
import { DriverEventType } from "@/lib/socket/socketEvents";
import { PaymentMode, TripStatus, assertTransition, canTransition } from "@/lib/trip/tripStatus";
import type { DriverTripSnapshot } from "@/lib/trip/tripTypes";
import { appendTripHistory } from "@/lib/driver/tripHistoryStorage";
import { computePaymentWalletEffect } from "@/lib/trip/walletLedger";
import { useDriverWalletStore } from "@/stores/driverWalletStore";

const wallet = () => useDriverWalletStore.getState();

function emitForTransition(tripId: string, _from: TripStatus, to: TripStatus): void {
  emitStatusUpdate(tripId, to);
  if (to === TripStatus.EN_ROUTE_TO_PICKUP) {
    emitDriverEvent({ type: DriverEventType.DRIVER_STARTED_TRIP, tripId, status: to });
  } else if (to === TripStatus.ARRIVED_AT_PICKUP) {
    emitDriverEvent({ type: DriverEventType.DRIVER_ARRIVED_PICKUP, tripId, status: to });
  } else if (to === TripStatus.TRIP_STARTED) {
    emitDriverEvent({ type: DriverEventType.TRIP_STARTED, tripId, status: to });
  } else if (to === TripStatus.ARRIVED_AT_DROP) {
    emitDriverEvent({ type: DriverEventType.DRIVER_ARRIVED_DROP, tripId, status: to });
  } else if (to === TripStatus.TRIP_COMPLETED) {
    emitDriverEvent({ type: DriverEventType.TRIP_COMPLETED, tripId, status: to });
  }
}

type TripStore = {
  activeTrip: DriverTripSnapshot | null;
  actionLoading: boolean;
  paymentMismatchAlert: string | null;
  startFromAssignment: (assigned: AssignedPickupTrip, order: IncomingOrderRequest, driverId: string) => void;
  transitionTo: (next: TripStatus) => Promise<boolean>;
  /**
   * One driver action: ARRIVED_AT_PICKUP → LOADING_CONFIRMED → TRIP_STARTED (valid transitions only).
   * Does not replace backend rules; same emits as three separate transitions.
   */
  completePickupToOnTrip: () => Promise<boolean>;
  /**
   * One driver action from EN_ROUTE_TO_DROP: ARRIVED_AT_DROP → UNLOADING_CONFIRMED → (prepaid) PAYMENT_COMPLETED.
   */
  completeDropToPaymentGate: () => Promise<boolean>;
  applyPaymentCompletion: () => void;
  confirmUnloading: () => Promise<boolean>;
  beginCashCollection: () => Promise<boolean>;
  finalizeCashPayment: (declaredAmountInr: number) => Promise<boolean>;
  completeTrip: () => Promise<boolean>;
  handleRemoteCancel: (tripId: string, reason?: string) => void;
  reset: () => void;
};

async function runTransitionCore(get: () => TripStore, set: (p: Partial<TripStore>) => void, next: TripStatus) {
  const activeTrip = get().activeTrip;
  if (!activeTrip) return false;
  const from = activeTrip.status;
  if (!canTransition(from, next)) return false;
  try {
    assertTransition(from, next);
  } catch {
    return false;
  }
  await new Promise((r) => setTimeout(r, 280));
  const cur = get().activeTrip;
  if (!cur) return false;
  const updated: DriverTripSnapshot = { ...cur, status: next, updatedAt: Date.now() };
  set({ activeTrip: updated });
  emitForTransition(updated.tripId, from, next);
  return true;
}

export const useDriverTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      activeTrip: null,
      actionLoading: false,
      paymentMismatchAlert: null,

      startFromAssignment: (assigned, order, driverId) => {
        const paymentMode =
          order.paymentMode === PaymentMode.CASH || order.paymentMode === PaymentMode.PREPAID
            ? order.paymentMode
            : PaymentMode.PREPAID;
        const snap = buildDriverTripSnapshot(assigned, order, paymentMode);
        connectDriverSocket(driverId);
        joinTripRoom(snap.tripId);
        set({ activeTrip: snap, paymentMismatchAlert: null });
      },

      transitionTo: async (next) => {
        const { activeTrip, actionLoading } = get();
        if (!activeTrip || actionLoading) return false;
        set({ actionLoading: true });
        try {
          const ok = await runTransitionCore(get, set, next);
          if (!ok) toast.error(translateDriver("tripFlow.invalidStep"));
          return ok;
        } finally {
          set({ actionLoading: false });
        }
      },

      completePickupToOnTrip: async () => {
        if (get().actionLoading) return false;
        const trip = get().activeTrip;
        if (!trip) return false;

        let chain: TripStatus[] = [];
        if (trip.status === TripStatus.EN_ROUTE_TO_PICKUP) {
          chain = [TripStatus.ARRIVED_AT_PICKUP, TripStatus.LOADING_CONFIRMED, TripStatus.TRIP_STARTED];
        } else if (trip.status === TripStatus.ARRIVED_AT_PICKUP) {
          chain = [TripStatus.LOADING_CONFIRMED, TripStatus.TRIP_STARTED];
        } else if (trip.status === TripStatus.LOADING_CONFIRMED) {
          chain = [TripStatus.TRIP_STARTED];
        } else {
          return false;
        }

        set({ actionLoading: true });
        try {
          for (const next of chain) {
            const ok = await runTransitionCore(get, set, next);
            if (!ok) {
              toast.error(translateDriver("tripFlow.invalidStep"));
              return false;
            }
          }
          return true;
        } finally {
          set({ actionLoading: false });
        }
      },

      completeDropToPaymentGate: async () => {
        if (get().actionLoading) return false;
        const trip = get().activeTrip;
        if (!trip || trip.status !== TripStatus.EN_ROUTE_TO_DROP) return false;

        set({ actionLoading: true });
        try {
          for (const next of [TripStatus.ARRIVED_AT_DROP, TripStatus.UNLOADING_CONFIRMED]) {
            const ok = await runTransitionCore(get, set, next);
            if (!ok) {
              toast.error(translateDriver("tripFlow.invalidStep"));
              return false;
            }
          }
          const t2 = get().activeTrip;
          if (t2?.paymentMode === PaymentMode.PREPAID) {
            const ok3 = await runTransitionCore(get, set, TripStatus.PAYMENT_COMPLETED);
            if (!ok3) {
              toast.error(translateDriver("tripFlow.invalidStep"));
              return false;
            }
            get().applyPaymentCompletion();
          }
          return true;
        } finally {
          set({ actionLoading: false });
        }
      },

      applyPaymentCompletion: () => {
        const { activeTrip } = get();
        if (!activeTrip || activeTrip.status !== TripStatus.PAYMENT_COMPLETED) return;
        const effect = computePaymentWalletEffect(activeTrip.fareInr, activeTrip.paymentMode);
        wallet().applyTripPayment(effect.walletDelta, effect.earningsDelta);
      },

      confirmUnloading: async () => {
        const ok = await get().transitionTo(TripStatus.UNLOADING_CONFIRMED);
        if (!ok) return false;
        const trip = get().activeTrip;
        if (trip?.paymentMode === PaymentMode.PREPAID) {
          const ok2 = await get().transitionTo(TripStatus.PAYMENT_COMPLETED);
          if (ok2) get().applyPaymentCompletion();
          return ok2;
        }
        return true;
      },

      beginCashCollection: async () => {
        const trip = get().activeTrip;
        if (!trip || trip.status !== TripStatus.UNLOADING_CONFIRMED || trip.paymentMode !== PaymentMode.CASH) {
          return false;
        }
        return get().transitionTo(TripStatus.PAYMENT_PENDING);
      },

      finalizeCashPayment: async (declaredAmountInr) => {
        const trip = get().activeTrip;
        if (!trip || trip.status !== TripStatus.PAYMENT_PENDING || trip.paymentMode !== PaymentMode.CASH) {
          return false;
        }
        if (Math.abs(declaredAmountInr - trip.fareInr) > 0.01) {
          set({
            paymentMismatchAlert: `Trip fare is ₹${trip.fareInr.toFixed(0)}. Confirm with the customer.`,
          });
          toast.error(translateDriver("tripFlow.paymentMismatch"));
          return false;
        }
        set({ paymentMismatchAlert: null });
        const ok = await get().transitionTo(TripStatus.PAYMENT_COMPLETED);
        if (ok) get().applyPaymentCompletion();
        return ok;
      },

      completeTrip: async () => {
        const trip = get().activeTrip;
        if (!trip || trip.status !== TripStatus.PAYMENT_COMPLETED) return false;
        const ok = await get().transitionTo(TripStatus.TRIP_COMPLETED);
        if (ok) {
          wallet().recordTripCompleted();
          leaveTripRoom();
          set({ activeTrip: null, paymentMismatchAlert: null });
        }
        return ok;
      },

      handleRemoteCancel: (tripId, reason) => {
        const { activeTrip } = get();
        if (!activeTrip || activeTrip.tripId !== tripId) return;
        if (activeTrip.status === TripStatus.TRIP_COMPLETED) return;
        appendTripHistory({
          id: tripId,
          orderId: activeTrip.orderId,
          fareInr: activeTrip.fareInr,
          paymentMode: activeTrip.paymentMode,
          completedAt: Date.now(),
          driverShareInr: 0,
          commissionInr: 0,
          outcome: "cancelled",
          cancelReason: reason,
        });
        leaveTripRoom();
        set({ activeTrip: null, paymentMismatchAlert: null });
        toast.error(reason || translateDriver("tripFlow.tripCancelled"));
      },

      reset: () => {
        leaveTripRoom();
        set({ activeTrip: null, actionLoading: false, paymentMismatchAlert: null });
      },
    }),
    {
      name: "liftngo-driver-trip",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeTrip: s.activeTrip }),
    },
  ),
);
