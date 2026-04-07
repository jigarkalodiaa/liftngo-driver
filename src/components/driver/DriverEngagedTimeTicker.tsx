"use client";

import { useEffect } from "react";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import { useDriverAvailabilityStore } from "@/stores/driverAvailabilityStore";
import { useDriverEngagedTimeStore } from "@/stores/driverEngagedTimeStore";
import { useDriverSuspensionStore } from "@/stores/driverSuspensionStore";
import { useDriverTripStore } from "@/stores/driverTripStore";

/**
 * Accumulates today's engaged seconds across all /driver/* surfaces:
 * app tab visible + logged in + (active trip OR online for offers, not suspended).
 */
export default function DriverEngagedTimeTicker() {
  useEffect(() => {
    const pulse = () => {
      useDriverSuspensionStore.getState().refreshFromClock();
      const suspendedNow = useDriverSuspensionStore.getState().isSuspended();
      const trip = useDriverTripStore.getState().activeTrip;
      const receiving = useDriverAvailabilityStore.getState().isReceivingTrips;
      const authed = typeof localStorage !== "undefined" && Boolean(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY));
      const isEngaged = authed && (Boolean(trip) || (receiving && !suspendedNow));
      useDriverEngagedTimeStore.getState().pulse(isEngaged);
    };

    pulse();
    const id = window.setInterval(pulse, 5000);
    document.addEventListener("visibilitychange", pulse);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", pulse);
    };
  }, []);

  return null;
}
