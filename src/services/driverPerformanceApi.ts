import axios from "axios";
import { DriverSegment, type DriverSegmentPayload } from "@/lib/driver/driverSegment";

const NEST_JWT_KEY = "liftngo_nest_access_token";

export type DriverPerformanceApiSnapshot = {
  performanceScore: number;
  cancellationScore: number;
  segment: DriverSegment;
  tripWindowCount: number;
  completedTrips: number;
  missedTrips: number;
  driverCancelledTrips: number;
  breakdownSuspended: boolean;
  breakdownSuspendedUntil: string | null;
};

export function getNestAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NEST_JWT_KEY);
}

export function setNestAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(NEST_JWT_KEY, token);
  else localStorage.removeItem(NEST_JWT_KEY);
}

/**
 * Fetches driver performance from Nest. Uses global axios (QueryProvider interceptors).
 */
export async function fetchDriverPerformanceFromNest(): Promise<DriverPerformanceApiSnapshot | null> {
  if (!getNestAccessToken()) return null;
  try {
    const res = await axios.get<Partial<DriverPerformanceApiSnapshot> & { data?: DriverPerformanceApiSnapshot }>(
      "/drivers/performance",
    );
    const data = res.data;
    const body = data?.data ?? data;
    if (
      typeof body?.performanceScore !== "number" ||
      typeof body?.cancellationScore !== "number" ||
      !body?.segment
    ) {
      return null;
    }
    return body as DriverPerformanceApiSnapshot;
  } catch {
    return null;
  }
}

/** Maps Nest snapshot to existing segment payload shape for partner-tier UI. */
export function snapshotToTagging(s: DriverPerformanceApiSnapshot): DriverSegmentPayload {
  return {
    performanceScore: s.performanceScore,
    cancellationRatePct: s.cancellationScore,
    segment: s.segment,
  };
}
