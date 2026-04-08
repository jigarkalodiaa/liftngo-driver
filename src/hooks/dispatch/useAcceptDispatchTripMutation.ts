"use client";

import { useMutation } from "@tanstack/react-query";
import { driverDispatchAcceptTrip } from "@/services/dispatchActions";

/**
 * Mutation hook for accepting a dispatch trip.
 * Handles store locks + REST call with optimistic updates and rollback.
 */
export function useAcceptDispatchTripMutation() {
  return useMutation({
    mutationFn: (tripId: string) => driverDispatchAcceptTrip(tripId),
  });
}
