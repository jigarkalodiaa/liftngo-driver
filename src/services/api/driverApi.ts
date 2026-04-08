"use client";

import axios from "axios";
import { API_PATHS } from "@/lib/api/apiPaths";
import {
  type ApiResult,
  type ApiResultVoid,
  toApiError,
  toApiErrorWithData,
  logApiRequest,
  logApiResponse,
} from "@/lib/api/apiError";
import type { DriverPerformanceApiSnapshot } from "@/services/driverPerformanceApi";

// ============================================================================
// Types
// ============================================================================

export type DriverLocationPayload = {
  lat: number;
  lng: number;
  heading?: number;
};

// ============================================================================
// Driver Online Status
// ============================================================================

export async function patchDriverOnline(isOnline: boolean): Promise<ApiResultVoid> {
  const path = API_PATHS.DRIVER_ONLINE;
  logApiRequest("PATCH", path, { isOnline });

  try {
    await axios.patch(path, { isOnline });
    logApiResponse("PATCH", path, { ok: true });
    return { ok: true };
  } catch (e) {
    const result = toApiError(e);
    logApiResponse("PATCH", path, result);
    return result;
  }
}

// ============================================================================
// Driver Location
// ============================================================================

export async function patchDriverLocation(loc: DriverLocationPayload): Promise<ApiResultVoid> {
  const path = API_PATHS.DRIVER_LOCATION;
  logApiRequest("PATCH", path, loc);

  try {
    await axios.patch(path, loc);
    logApiResponse("PATCH", path, { ok: true });
    return { ok: true };
  } catch (e) {
    const result = toApiError(e);
    logApiResponse("PATCH", path, result);
    return result;
  }
}

// ============================================================================
// Driver Performance
// ============================================================================

export async function fetchDriverPerformance(): Promise<ApiResult<DriverPerformanceApiSnapshot | null>> {
  const path = API_PATHS.DRIVER_PERFORMANCE;
  logApiRequest("GET", path);

  try {
    const res = await axios.get<Partial<DriverPerformanceApiSnapshot> & { data?: DriverPerformanceApiSnapshot }>(path);
    const data = res.data;
    const body = data?.data ?? data;

    if (
      typeof body?.performanceScore !== "number" ||
      typeof body?.cancellationScore !== "number" ||
      !body?.segment
    ) {
      logApiResponse("GET", path, { ok: true });
      return { ok: true, data: null };
    }

    logApiResponse("GET", path, { ok: true });
    return { ok: true, data: body as DriverPerformanceApiSnapshot };
  } catch (e) {
    const result = toApiErrorWithData<DriverPerformanceApiSnapshot | null>(e);
    logApiResponse("GET", path, result);
    return result;
  }
}
