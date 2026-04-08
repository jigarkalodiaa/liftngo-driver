import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeWalletBalanceInr, walletShortfallToMinimum } from "@/lib/driver/walletConstants";

type WalletState = {
  walletBalance: number;
  /** Net driver benefit credited for dashboard “earnings” display. */
  todayEarnings: number;
  completedTrips: number;
  applyTripPayment: (walletDelta: number, earningsDelta: number) => void;
  /** Call when trip reaches TRIP_COMPLETED (after payment settled). */
  recordTripCompleted: () => void;
  /** Top-up (e.g. after successful payment). Unlocks trips when balance ≥ minimum. */
  creditTopUp: (amountInr: number) => void;
  /** Pay exactly enough to reach minimum balance (demo / until real gateway is wired). */
  payMinimumShortfall: () => number;
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
      creditTopUp: (amountInr) => {
        if (!Number.isFinite(amountInr) || amountInr <= 0) return;
        const { walletBalance } = get();
        set({
          walletBalance: Math.round((walletBalance + amountInr) * 100) / 100,
        });
      },
      payMinimumShortfall: () => {
        const short = walletShortfallToMinimum(get().walletBalance);
        if (short <= 0) return 0;
        get().creditTopUp(short);
        return short;
      },
      reset: () => set(initial),
    }),
    {
      name: "liftngo-driver-wallet",
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const c = current as WalletState;
        const p = persisted as Partial<
          Pick<WalletState, "walletBalance" | "todayEarnings" | "completedTrips">
        > | null;
        if (!p || typeof p !== "object") return c;
        return {
          ...c,
          walletBalance: normalizeWalletBalanceInr(p.walletBalance ?? c.walletBalance),
          todayEarnings: normalizeWalletBalanceInr(p.todayEarnings ?? c.todayEarnings),
          completedTrips: Math.max(0, Math.floor(Number(p.completedTrips ?? c.completedTrips) || 0)),
        };
      },
    },
  ),
);
