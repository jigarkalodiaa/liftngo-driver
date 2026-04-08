"use client";

import { useMutation } from "@tanstack/react-query";
import { cancelTrip } from "@/services/dispatchRest";

export function useCancelTripMutation() {
  return useMutation({
    mutationFn: (tripId: string) => cancelTrip(tripId),
  });
}
