"use client";

import { useMutation } from "@tanstack/react-query";
import { driverDispatchAcceptTrip } from "@/services/dispatchActions";

/**
 * React Query mutation wrapping accept flow (store locks + REST via `acceptTrip` service + axios auth).
 */
export function useAcceptDispatchTripMutation() {
  return useMutation({
    mutationFn: (tripId: string) => driverDispatchAcceptTrip(tripId),
  });
}
