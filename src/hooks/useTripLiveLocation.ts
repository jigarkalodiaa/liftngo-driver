"use client";

import { useEffect, useRef } from "react";
import { emitDriverEvent } from "@/lib/socket/driverSocketClient";
import { DriverEventType } from "@/lib/socket/socketEvents";

const MIN_INTERVAL_MS = 5000;

/**
 * Emits DRIVER_LOCATION_UPDATE while `enabled` (en route phases). Throttled.
 * Handles permission denied with a one-time toast via callback.
 */
export function useTripLiveLocation(
  tripId: string | null,
  enabled: boolean,
  onGpsDenied?: () => void,
): void {
  const lastEmit = useRef(0);
  const watchId = useRef<number | null>(null);
  const deniedRef = useRef(false);

  useEffect(() => {
    if (!tripId || !enabled || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    const options: PositionOptions = { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 };

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastEmit.current < MIN_INTERVAL_MS) return;
        lastEmit.current = now;
        emitDriverEvent({
          type: DriverEventType.DRIVER_LOCATION_UPDATE,
          tripId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err: GeolocationPositionError) => {
        if (err.code === 1 && !deniedRef.current) {
          deniedRef.current = true;
          onGpsDenied?.();
        }
      },
      options,
    );

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [tripId, enabled, onGpsDenied]);
}
