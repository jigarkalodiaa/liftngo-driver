"use client";

import { useMutation } from "@tanstack/react-query";
import { patchDriverOnline } from "@/services/api";

/**
 * Mutation hook for updating driver online status.
 * Uses centralized API service with consistent error handling.
 */
export function usePatchDriverOnlineMutation() {
  return useMutation({
    mutationFn: (isOnline: boolean) => patchDriverOnline(isOnline),
  });
}
