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
import type { DispatchTrip } from "@/types/dispatch";
import { normalizeStatusToMachine } from "@/lib/dispatch/tripStateMachine";

// ============================================================================
// Types
// ============================================================================

export type CreateTripPayload = Record<string, unknown>;

export type CreateTripResponse = {
  tripId: string;
  trip?: DispatchTrip;
};

export type CancelTripReason = "VEHICLE_BREAKDOWN" | "CUSTOMER_REQUEST" | "OTHER";

// ============================================================================
// Helpers
// ============================================================================

function now(): number {
  return Date.now();
}

function parseTripPayload(raw: unknown): DispatchTrip | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const tripId = typeof o.tripId === "string" ? o.tripId : typeof o.id === "string" ? o.id : null;
  if (!tripId) return null;

  const statusRaw = typeof o.status === "string" ? o.status : "IDLE";
  const machine = normalizeStatusToMachine(statusRaw) ?? "IDLE";

  return {
    tripId,
    orderId: typeof o.orderId === "string" ? o.orderId : undefined,
    machineState: machine,
    rawStatus: statusRaw,
    fareInr: typeof o.fareInr === "number" ? o.fareInr : undefined,
    paymentMode: typeof o.paymentMode === "string" ? o.paymentMode : undefined,
    pickup: o.pickup as DispatchTrip["pickup"],
    drop: o.drop as DispatchTrip["drop"],
    customerId: typeof o.customerId === "string" ? o.customerId : undefined,
    driverId: typeof o.driverId === "string" ? o.driverId : undefined,
    driver: o.driver as DispatchTrip["driver"],
    eventVersion: typeof o.eventVersion === "number" ? o.eventVersion : undefined,
    lastEventAt: typeof o.updatedAt === "number" ? o.updatedAt : typeof o.ts === "number" ? o.ts : now(),
    offerExpiresAt: typeof o.offerExpiresAt === "number" ? o.offerExpiresAt : undefined,
    createdAt: typeof o.createdAt === "number" ? o.createdAt : undefined,
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : undefined,
  };
}

// ============================================================================
// Fetch Active Trip
// ============================================================================

export async function fetchDriverActiveTrip(): Promise<ApiResult<DispatchTrip | null>> {
  const path = API_PATHS.DRIVER_ACTIVE_TRIP;
  logApiRequest("GET", path);

  try {
    const res = await axios.get<unknown>(path, {
      validateStatus: (status) => status === 204 || status === 404 || (status >= 200 && status < 300),
    });

    if (res.status === 404 || res.status === 204) {
      logApiResponse("GET", path, { ok: true });
      return { ok: true, data: null };
    }

    if (res.status < 200 || res.status >= 300) {
      logApiResponse("GET", path, { ok: false, status: res.status });
      return { ok: false, status: res.status, message: res.statusText };
    }

    const json = res.data as unknown;
    const wrapped =
      json && typeof json === "object" && "trip" in (json as object)
        ? (json as { trip: unknown }).trip
        : json;

    logApiResponse("GET", path, { ok: true });
    return { ok: true, data: parseTripPayload(wrapped) };
  } catch (e) {
    const result = toApiErrorWithData<DispatchTrip | null>(e);
    logApiResponse("GET", path, result);
    return result;
  }
}

export async function fetchCustomerCurrentTrip(): Promise<ApiResult<DispatchTrip | null>> {
  const path = API_PATHS.CUSTOMER_CURRENT_TRIP;
  logApiRequest("GET", path);

  try {
    const res = await axios.get<unknown>(path, {
      validateStatus: (status) => status === 204 || status === 404 || (status >= 200 && status < 300),
    });

    if (res.status === 404 || res.status === 204) {
      logApiResponse("GET", path, { ok: true });
      return { ok: true, data: null };
    }

    if (res.status < 200 || res.status >= 300) {
      logApiResponse("GET", path, { ok: false, status: res.status });
      return { ok: false, status: res.status, message: res.statusText };
    }

    const json = res.data as unknown;
    const wrapped =
      json && typeof json === "object" && "trip" in (json as object)
        ? (json as { trip: unknown }).trip
        : json;

    logApiResponse("GET", path, { ok: true });
    return { ok: true, data: parseTripPayload(wrapped) };
  } catch (e) {
    const result = toApiErrorWithData<DispatchTrip | null>(e);
    logApiResponse("GET", path, result);
    return result;
  }
}

// ============================================================================
// Create Trip
// ============================================================================

export async function createTrip(body: CreateTripPayload): Promise<ApiResult<CreateTripResponse>> {
  const path = API_PATHS.TRIPS;
  logApiRequest("POST", path, body);

  try {
    const res = await axios.post<unknown>(path, body);
    const json = res.data as Record<string, unknown>;

    const tripId =
      typeof json.tripId === "string" ? json.tripId : typeof json.id === "string" ? (json.id as string) : "";

    if (!tripId) {
      logApiResponse("POST", path, { ok: false, status: res.status });
      return { ok: false, status: res.status, message: "missing tripId in response" };
    }

    logApiResponse("POST", path, { ok: true });
    return { ok: true, data: { tripId, trip: parseTripPayload(json.trip ?? json) ?? undefined } };
  } catch (e) {
    const result = toApiErrorWithData<CreateTripResponse>(e);
    logApiResponse("POST", path, result);
    return result;
  }
}

// ============================================================================
// Trip Actions
// ============================================================================

export async function acceptTrip(tripId: string): Promise<ApiResultVoid> {
  const path = API_PATHS.tripAccept(tripId);
  logApiRequest("PATCH", path);

  try {
    await axios.patch(path);
    logApiResponse("PATCH", path, { ok: true });
    return { ok: true };
  } catch (e) {
    const result = toApiError(e);
    logApiResponse("PATCH", path, result);
    return result;
  }
}

export async function rejectTrip(tripId: string): Promise<ApiResultVoid> {
  const path = API_PATHS.tripReject(tripId);
  logApiRequest("PATCH", path);

  try {
    await axios.patch(path);
    logApiResponse("PATCH", path, { ok: true });
    return { ok: true };
  } catch (e) {
    const result = toApiError(e);
    logApiResponse("PATCH", path, result);
    return result;
  }
}

export async function cancelTrip(tripId: string): Promise<ApiResultVoid> {
  const path = API_PATHS.tripCancel(tripId);
  logApiRequest("PATCH", path);

  try {
    await axios.patch(path);
    logApiResponse("PATCH", path, { ok: true });
    return { ok: true };
  } catch (e) {
    const result = toApiError(e);
    logApiResponse("PATCH", path, result);
    return result;
  }
}

export async function cancelTripWithReason(tripId: string, reason: CancelTripReason): Promise<ApiResultVoid> {
  const path = API_PATHS.tripCancel(tripId);
  logApiRequest("PATCH", path, { reason });

  try {
    await axios.patch(path, { reason });
    logApiResponse("PATCH", path, { ok: true });
    return { ok: true };
  } catch (e) {
    const result = toApiError(e);
    logApiResponse("PATCH", path, result);
    return result;
  }
}
