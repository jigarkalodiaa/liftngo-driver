"use client";

import { useMutation } from "@tanstack/react-query";
import { driverDispatchRejectTrip } from "@/services/dispatchActions";

/**
 * Mutation hook for rejecting a dispatch trip.
 * Handles store locks + REST call with optimistic updates and rollback.
 */
export function useRejectDispatchTripMutation() {
  return useMutation({
    mutationFn: (tripId: string) => driverDispatchRejectTrip(tripId),
  });
}
