import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  SUSPENSION_FIRST_DAYS,
  SUSPENSION_PERFORMANCE_THRESHOLD,
  SUSPENSION_SECOND_DAYS,
  suspensionEndMsFromNow,
} from "@/lib/driver/driverSuspension";

export type SuspensionTier = "none" | "first" | "second" | "permanent";

type SuspensionStore = {
  /** Count of missed-trip events while performance was below threshold. */
  missStrikes: number;
  suspendedUntilMs: number | null;
  permanent: boolean;
  /** Clear ended temporary suspensions (not permanent). */
  refreshFromClock: () => void;
  /**
   * Call when a trip request expires without accept. Only counts toward strikes if
   * `performanceScore` is strictly below {@link SUSPENSION_PERFORMANCE_THRESHOLD}.
   */
  recordMissWhenBelowThreshold: (performanceScore: number) => {
    tier: SuspensionTier;
    strikes: number;
    applied: boolean;
  };
  isSuspended: () => boolean;
  reset: () => void;
};

export const useDriverSuspensionStore = create<SuspensionStore>()(
  persist(
    (set, get) => ({
      missStrikes: 0,
      suspendedUntilMs: null,
      permanent: false,

      refreshFromClock: () => {
        const { permanent, suspendedUntilMs } = get();
        if (permanent) return;
        if (suspendedUntilMs != null && Date.now() >= suspendedUntilMs) {
          set({ suspendedUntilMs: null });
        }
      },

      recordMissWhenBelowThreshold: (performanceScore) => {
        get().refreshFromClock();
        if (performanceScore >= SUSPENSION_PERFORMANCE_THRESHOLD) {
          return { tier: "none" as const, strikes: get().missStrikes, applied: false };
        }
        const strikes = get().missStrikes + 1;
        const now = Date.now();
        let tier: SuspensionTier = "none";
        let suspendedUntilMs: number | null = null;
        let permanent = false;

        if (strikes === 1) {
          suspendedUntilMs = suspensionEndMsFromNow(SUSPENSION_FIRST_DAYS);
          tier = "first";
        } else if (strikes === 2) {
          suspendedUntilMs = suspensionEndMsFromNow(SUSPENSION_SECOND_DAYS);
          tier = "second";
        } else {
          permanent = true;
          tier = "permanent";
        }

        set({
          missStrikes: strikes,
          suspendedUntilMs: permanent ? null : suspendedUntilMs,
          permanent,
        });
        return { tier, strikes, applied: true };
      },

      isSuspended: () => {
        get().refreshFromClock();
        const { permanent, suspendedUntilMs } = get();
        if (permanent) return true;
        return suspendedUntilMs != null && Date.now() < suspendedUntilMs;
      },

      reset: () => set({ missStrikes: 0, suspendedUntilMs: null, permanent: false }),
    }),
    {
      name: "liftngo-driver-suspension",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        missStrikes: s.missStrikes,
        suspendedUntilMs: s.suspendedUntilMs,
        permanent: s.permanent,
      }),
    },
  ),
);
