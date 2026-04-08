"use client";

import { useMutation } from "@tanstack/react-query";
import { cancelTripVehicleBreakdown } from "@/services/tripCancelApi";

export function useCancelTripVehicleBreakdownMutation() {
  return useMutation({
    mutationFn: (tripId: string) => cancelTripVehicleBreakdown(tripId),
  });
}
