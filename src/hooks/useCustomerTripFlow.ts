"use client";

import { useCallback } from "react";
import { useCancelTripMutation, useCreateTripMutation } from "@/hooks/dispatch";

/**
 * REST helpers for customer booking (POST /trips, PATCH cancel). Pair with `useCustomerSocket`.
 * Auth: global axios interceptors (QueryProvider).
 */
export function useCustomerTripFlow() {
  const create = useCreateTripMutation();
  const cancelMut = useCancelTripMutation();
  const book = useCallback(
    (body: Record<string, unknown>) => create.mutateAsync(body),
    [create],
  );
  const cancel = useCallback((tripId: string) => cancelMut.mutateAsync(tripId), [cancelMut]);
  return { book, cancel };
}
