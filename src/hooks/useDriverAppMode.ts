import { useMemo } from "react";
import { getDriverAppMode, type DriverAppMode } from "@/lib/driver/appMode";
import { useDriverTripStore } from "@/stores/driverTripStore";

export function useDriverAppMode(): DriverAppMode {
  const activeTrip = useDriverTripStore((s) => s.activeTrip);
  return useMemo(() => getDriverAppMode(activeTrip), [activeTrip]);
}
