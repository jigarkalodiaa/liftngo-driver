"use client";

import { useMutation } from "@tanstack/react-query";
import { createTrip } from "@/services/dispatchRest";

export function useCreateTripMutation() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createTrip(body),
  });
}
