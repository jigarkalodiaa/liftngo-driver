"use client";

import { useMutation } from "@tanstack/react-query";
import { cancelTrip } from "@/services/api";

/**
 * Mutation hook for cancelling a trip.
 * Uses centralized API service with consistent error handling.
 */
export function useCancelTripMutation() {
  return useMutation({
    mutationFn: (tripId: string) => cancelTrip(tripId),
  });
}
