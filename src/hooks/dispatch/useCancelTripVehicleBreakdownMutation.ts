"use client";

import { useMutation } from "@tanstack/react-query";
import { cancelTripWithReason } from "@/services/api";

/**
 * Mutation hook for cancelling a trip due to vehicle breakdown.
 * Uses centralized API service with consistent error handling.
 */
export function useCancelTripVehicleBreakdownMutation() {
  return useMutation({
    mutationFn: (tripId: string) => cancelTripWithReason(tripId, "VEHICLE_BREAKDOWN"),
  });
}
