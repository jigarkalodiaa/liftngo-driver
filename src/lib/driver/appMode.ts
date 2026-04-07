import { TripStatus } from "@/lib/trip/tripStatus";
import type { DriverTripSnapshot } from "@/lib/trip/tripTypes";

/**
 * Flow-centred app mode: in TRIP_MODE the product treats the active trip as the only
 * primary surface (see DriverTripModeGate + full-screen trip UI), not ad-hoc nav locks.
 */
export const DriverAppMode = {
  TRIP_MODE: "TRIP_MODE",
  IDLE_MODE: "IDLE_MODE",
} as const;

export type DriverAppMode = (typeof DriverAppMode)[keyof typeof DriverAppMode];

/** Canonical home for live trip UX (map + lifecycle). */
export const DRIVER_TRIP_HOME_PATH = "/driver/dashboard";

export function getDriverAppMode(activeTrip: DriverTripSnapshot | null): DriverAppMode {
  if (!activeTrip || activeTrip.status === TripStatus.TRIP_COMPLETED) {
    return DriverAppMode.IDLE_MODE;
  }
  return DriverAppMode.TRIP_MODE;
}

export function isDriverTripMode(activeTrip: DriverTripSnapshot | null): boolean {
  return getDriverAppMode(activeTrip) === DriverAppMode.TRIP_MODE;
}
