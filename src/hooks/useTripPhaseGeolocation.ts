"use client";

import { useEffect, useRef, useState } from "react";
import { emitDriverEvent } from "@/lib/socket/driverSocketClient";
import { DriverEventType } from "@/lib/socket/socketEvents";
import { TripStatus } from "@/lib/trip/tripStatus";
import type { DriverTripSnapshot } from "@/lib/trip/tripTypes";
import { haversineDistanceM } from "@/lib/trip/geo";

const EMIT_MIN_MS = 5000;

/** Driver must be within this distance of pickup to use merged “Start trip”. */
export const TRIP_PICKUP_RADIUS_M = 130;
/** Driver must be within this distance of drop to use merged “Complete delivery”. */
export const TRIP_DROP_RADIUS_M = 130;

export type TripGeolocationSnapshot = {
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  nearPickup: boolean;
  nearDrop: boolean;
  /** At least one GPS fix received while watching. */
  ready: boolean;
  /** Browser / user denied geolocation — proximity checks cannot run. */
  permissionDenied: boolean;
};

const initial: TripGeolocationSnapshot = {
  lat: null,
  lng: null,
  accuracyM: null,
  nearPickup: false,
  nearDrop: false,
  ready: false,
  permissionDenied: false,
};

/**
 * Single watch: throttled socket emits on en-route phases + proximity for pickup/drop CTAs.
 */
export function useTripPhaseGeolocation(
  trip: DriverTripSnapshot | null,
  onGpsDenied?: () => void,
): TripGeolocationSnapshot {
  const [state, setState] = useState<TripGeolocationSnapshot>(initial);

  const lastEmitAt = useRef(0);
  const watchId = useRef<number | null>(null);
  const deniedOnce = useRef(false);
  const prevNearPickup = useRef(false);
  const prevNearDrop = useRef(false);
  const tripRef = useRef(trip);
  tripRef.current = trip;

  useEffect(() => {
    deniedOnce.current = false;
  }, [trip?.tripId]);

  const status = trip?.status;
  const shouldWatch =
    !!trip &&
    (status === TripStatus.EN_ROUTE_TO_PICKUP ||
      status === TripStatus.ARRIVED_AT_PICKUP ||
      status === TripStatus.LOADING_CONFIRMED ||
      status === TripStatus.EN_ROUTE_TO_DROP);

  useEffect(() => {
    prevNearPickup.current = false;
    prevNearDrop.current = false;
  }, [status]);

  useEffect(() => {
    if (!shouldWatch || typeof navigator === "undefined" || !navigator.geolocation) {
      setState(initial);
      return;
    }

    const opts: PositionOptions = { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 };

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const tr = tripRef.current;
        if (!tr) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy ?? null;
        const st = tr.status;

        const dPickup = haversineDistanceM(lat, lng, tr.pickup.lat, tr.pickup.lng);
        const dDrop = haversineDistanceM(lat, lng, tr.drop.lat, tr.drop.lng);
        const nearPickup = dPickup <= TRIP_PICKUP_RADIUS_M;
        const nearDrop = dDrop <= TRIP_DROP_RADIUS_M;

        if (st === TripStatus.EN_ROUTE_TO_PICKUP && nearPickup && !prevNearPickup.current) {
          navigator.vibrate?.(25);
        }
        prevNearPickup.current = nearPickup;
        if (st === TripStatus.EN_ROUTE_TO_DROP && nearDrop && !prevNearDrop.current) {
          navigator.vibrate?.(25);
        }
        prevNearDrop.current = nearDrop;

        setState({
          lat,
          lng,
          accuracyM: acc,
          nearPickup,
          nearDrop,
          ready: true,
          permissionDenied: false,
        });

        const emitOk = st === TripStatus.EN_ROUTE_TO_PICKUP || st === TripStatus.EN_ROUTE_TO_DROP;
        const now = Date.now();
        if (emitOk && now - lastEmitAt.current >= EMIT_MIN_MS) {
          lastEmitAt.current = now;
          emitDriverEvent({
            type: DriverEventType.DRIVER_LOCATION_UPDATE,
            tripId: tr.tripId,
            lat,
            lng,
          });
        }
      },
      (err: GeolocationPositionError) => {
        if (err.code === 1 && !deniedOnce.current) {
          deniedOnce.current = true;
          setState((s) => ({ ...s, permissionDenied: true, ready: false }));
          onGpsDenied?.();
        }
      },
      opts,
    );

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [shouldWatch, onGpsDenied]);

  if (!shouldWatch) {
    return initial;
  }

  return state;
}
