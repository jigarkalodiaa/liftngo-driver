"use client";

import { useMutation } from "@tanstack/react-query";
import { createTrip, type CreateTripPayload } from "@/services/api";

/**
 * Mutation hook for creating a new trip.
 * Uses centralized API service with consistent error handling.
 */
export function useCreateTripMutation() {
  return useMutation({
    mutationFn: (body: CreateTripPayload) => createTrip(body),
  });
}
