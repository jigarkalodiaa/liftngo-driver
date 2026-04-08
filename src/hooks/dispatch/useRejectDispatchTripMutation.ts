"use client";

import { useMutation } from "@tanstack/react-query";
import { driverDispatchRejectTrip } from "@/services/dispatchActions";

export function useRejectDispatchTripMutation() {
  return useMutation({
    mutationFn: (tripId: string) => driverDispatchRejectTrip(tripId),
  });
}
