"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DRIVER_TRIP_HOME_PATH,
  DriverAppMode,
  getDriverAppMode,
} from "@/lib/driver/appMode";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import { useDriverTripStore } from "@/stores/driverTripStore";

function hasAuthToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY));
}

/**
 * While the driver has an active trip (TRIP_MODE) and a session, keep them on the trip
 * home surface instead of secondary /driver routes. No disabled buttons — the meaningful
 * UI is simply the dashboard + full-screen trip layer.
 */
export default function DriverTripModeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTrip = useDriverTripStore((s) => s.activeTrip);
  const [storeHydrated, setStoreHydrated] = useState(false);

  useEffect(() => {
    const p = useDriverTripStore.persist;
    if (!p) {
      setStoreHydrated(true);
      return;
    }
    if (p.hasHydrated()) {
      setStoreHydrated(true);
      return;
    }
    return p.onFinishHydration(() => setStoreHydrated(true));
  }, []);

  const mode = getDriverAppMode(activeTrip);

  useEffect(() => {
    if (!storeHydrated) return;
    if (mode !== DriverAppMode.TRIP_MODE) return;
    if (!hasAuthToken()) return;
    if (pathname === DRIVER_TRIP_HOME_PATH) return;
    router.replace(DRIVER_TRIP_HOME_PATH);
  }, [storeHydrated, mode, pathname, router]);

  return <>{children}</>;
}
