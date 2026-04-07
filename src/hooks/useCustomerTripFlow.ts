"use client";

import { useCallback } from "react";
import { cancelTrip, createTrip } from "@/services/dispatchRest";

/**
 * REST helpers for customer booking (POST /trips, PATCH cancel). Pair with `useCustomerSocket`.
 */
export function useCustomerTripFlow(authToken: string | null) {
  const book = useCallback(
    (body: Record<string, unknown>) => createTrip(body, authToken),
    [authToken],
  );
  const cancel = useCallback(
    (tripId: string) => cancelTrip(tripId, authToken),
    [authToken],
  );
  return { book, cancel };
}
