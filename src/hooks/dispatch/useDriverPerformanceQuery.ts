"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDriverPerformance } from "@/services/api";
import { getNestAccessToken } from "@/services/driverPerformanceApi";

export const driverPerformanceKeys = {
  all: ["driver-performance"] as const,
};

/**
 * Query hook for fetching driver performance data.
 * Uses centralized API service with consistent error handling.
 */
export function useDriverPerformanceQuery(enabled = true) {
  return useQuery({
    queryKey: driverPerformanceKeys.all,
    queryFn: async () => {
      if (!getNestAccessToken()) return null;
      const result = await fetchDriverPerformance();
      return result.ok ? result.data : null;
    },
    enabled,
  });
}
