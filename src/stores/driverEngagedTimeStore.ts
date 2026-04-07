import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Local calendar day key (YYYY-MM-DD) in the user's timezone. */
function localDayKey(): string {
  return new Date().toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
}

type EngagedTimeStore = {
  /** Total engaged seconds counted for `dayKey` (resets when the local day changes). */
  todaySeconds: number;
  dayKey: string;
  /** Wall time of last pulse — not persisted. */
  lastPulseAtMs: number | null;
  /** Advance the clock when the driver is engaged and the tab is visible. */
  pulse: (engaged: boolean) => void;
  reset: () => void;
};

const MAX_DELTA_MS = 120_000;

export const useDriverEngagedTimeStore = create<EngagedTimeStore>()(
  persist(
    (set, get) => ({
      todaySeconds: 0,
      dayKey: "",
      lastPulseAtMs: null,

      pulse: (engaged) => {
        const visible = typeof document !== "undefined" && document.visibilityState === "visible";
        const now = Date.now();
        const dk = localDayKey();
        let { todaySeconds, dayKey, lastPulseAtMs } = get();

        if (!dayKey || dk !== dayKey) {
          todaySeconds = 0;
          dayKey = dk;
          lastPulseAtMs = null;
        }

        if (!engaged || !visible) {
          set({ todaySeconds, dayKey, lastPulseAtMs: now });
          return;
        }

        const prev = lastPulseAtMs ?? now;
        const deltaMs = Math.min(Math.max(0, now - prev), MAX_DELTA_MS);
        const addSec = Math.floor(deltaMs / 1000);
        set({
          todaySeconds: todaySeconds + addSec,
          dayKey: dk,
          lastPulseAtMs: now,
        });
      },

      reset: () => set({ todaySeconds: 0, dayKey: localDayKey(), lastPulseAtMs: null }),
    }),
    {
      name: "liftngo-driver-engaged-time",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ todaySeconds: s.todaySeconds, dayKey: s.dayKey }),
      merge: (persisted, current) => {
        const p = persisted as Partial<Pick<EngagedTimeStore, "todaySeconds" | "dayKey">> | undefined;
        const dk = localDayKey();
        if (!p?.dayKey || p.dayKey !== dk) {
          return { ...current, todaySeconds: 0, dayKey: dk, lastPulseAtMs: null };
        }
        return {
          ...current,
          todaySeconds: typeof p.todaySeconds === "number" ? p.todaySeconds : 0,
          dayKey: p.dayKey,
          lastPulseAtMs: null,
        };
      },
    },
  ),
);

export function engagedTimeMinutesParts(totalSeconds: number): { hours: number; minutes: number } {
  const m = Math.floor(totalSeconds / 60);
  return { hours: Math.floor(m / 60), minutes: m % 60 };
}
