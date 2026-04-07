import { useQuery } from "@tanstack/react-query";
import { fetchDriverEarningsDashboard } from "@/services/driverEarningsService";

export const driverEarningsDashboardQueryKey = ["driver", "earnings-dashboard"] as const;

export function useDriverEarningsDashboard(enabled = true) {
  return useQuery({
    queryKey: driverEarningsDashboardQueryKey,
    queryFn: fetchDriverEarningsDashboard,
    enabled,
  });
}
