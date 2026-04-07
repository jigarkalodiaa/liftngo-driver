import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AvailabilityStore = {
  /** Driver chose to receive trip offers (product "online"). Persisted across app restarts. */
  isReceivingTrips: boolean;
  setReceivingTrips: (value: boolean) => void;
  reset: () => void;
};

export const useDriverAvailabilityStore = create<AvailabilityStore>()(
  persist(
    (set) => ({
      isReceivingTrips: false,
      setReceivingTrips: (value) => set({ isReceivingTrips: value }),
      reset: () => set({ isReceivingTrips: false }),
    }),
    {
      name: "liftngo-driver-availability",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ isReceivingTrips: s.isReceivingTrips }),
    },
  ),
);
