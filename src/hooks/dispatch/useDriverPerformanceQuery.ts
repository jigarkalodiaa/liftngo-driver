"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDriverPerformanceFromNest } from "@/services/driverPerformanceApi";

export const driverPerformanceKeys = {
  all: ["driver-performance"] as const,
};

/**
 * Example query hook: service uses global axios; Bearer from QueryProvider (Nest JWT or session).
 */
export function useDriverPerformanceQuery(enabled = true) {
  return useQuery({
    queryKey: driverPerformanceKeys.all,
    queryFn: () => fetchDriverPerformanceFromNest(),
    enabled,
  });
}
