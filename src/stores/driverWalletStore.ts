import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type WalletState = {
  walletBalance: number;
  /** Net driver benefit credited for dashboard “earnings” display. */
  todayEarnings: number;
  completedTrips: number;
  applyTripPayment: (walletDelta: number, earningsDelta: number) => void;
  /** Call when trip reaches TRIP_COMPLETED (after payment settled). */
  recordTripCompleted: () => void;
  reset: () => void;
};

const initial = {
  walletBalance: 0,
  todayEarnings: 0,
  completedTrips: 0,
};

export const useDriverWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      ...initial,
      applyTripPayment: (walletDelta, earningsDelta) => {
        const { walletBalance, todayEarnings } = get();
        set({
          walletBalance: Math.round((walletBalance + walletDelta) * 100) / 100,
          todayEarnings: Math.round((todayEarnings + earningsDelta) * 100) / 100,
        });
      },
      recordTripCompleted: () => {
        set({ completedTrips: get().completedTrips + 1 });
      },
      reset: () => set(initial),
    }),
    {
      name: "liftngo-driver-wallet",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
