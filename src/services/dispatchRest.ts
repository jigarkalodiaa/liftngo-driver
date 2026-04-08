/**
 * @deprecated Use `@/services/api` instead. This file is kept for backward compatibility.
 * All new code should import from `@/services/api`.
 */

import axios from "axios";
import {
  getCustomerCurrentTripPath,
  getDriverActiveTripPath,
  getDriverOnlinePatchPath,
} from "@/config/dispatchPaths";
import type { DispatchTrip } from "@/types/dispatch";
import { normalizeStatusToMachine } from "@/lib/dispatch/tripStateMachine";

export type DispatchRestError = { ok: false; status: number; message: string };
export type DispatchRestOk<T> = { ok: true; data: T };

function now() {
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

function axiosToDispatchError(e: unknown): DispatchRestError {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status ?? 0;
    const raw = e.response?.data;
    let message = e.message;
    if (typeof raw === "string") message = raw;
    else if (raw && typeof raw === "object" && "message" in raw && typeof (raw as { message: unknown }).message === "string") {
      message = (raw as { message: string }).message;
    }
    return { ok: false, status, message };
  }
  const message = e instanceof Error ? e.message : "network_error";
  return { ok: false, status: 0, message };
}

export async function fetchDriverActiveTrip(): Promise<DispatchRestOk<DispatchTrip | null> | DispatchRestError> {
  try {
    const res = await axios.get<unknown>(getDriverActiveTripPath(), {
      validateStatus: (status) => status === 204 || status === 404 || (status >= 200 && status < 300),
    });
    if (res.status === 404 || res.status === 204) return { ok: true, data: null };
    if (res.status < 200 || res.status >= 300) {
      return { ok: false, status: res.status, message: res.statusText };
    }
    const json = res.data as unknown;
    const wrapped =
      json && typeof json === "object" && "trip" in (json as object)
        ? (json as { trip: unknown }).trip
        : json;
    return { ok: true, data: parseTripPayload(wrapped) };
  } catch (e) {
    return axiosToDispatchError(e);
  }
}

export async function fetchCustomerCurrentTrip(): Promise<DispatchRestOk<DispatchTrip | null> | DispatchRestError> {
  try {
    const res = await axios.get<unknown>(getCustomerCurrentTripPath(), {
      validateStatus: (status) => status === 204 || status === 404 || (status >= 200 && status < 300),
    });
    if (res.status === 404 || res.status === 204) return { ok: true, data: null };
    if (res.status < 200 || res.status >= 300) {
      return { ok: false, status: res.status, message: res.statusText };
    }
    const json = res.data as unknown;
    const wrapped =
      json && typeof json === "object" && "trip" in (json as object)
        ? (json as { trip: unknown }).trip
        : json;
    return { ok: true, data: parseTripPayload(wrapped) };
  } catch (e) {
    return axiosToDispatchError(e);
  }
}

export async function createTrip(
  body: Record<string, unknown>,
): Promise<DispatchRestOk<{ tripId: string; trip?: DispatchTrip }> | DispatchRestError> {
  try {
    const res = await axios.post<unknown>("/trips", body);
    const json = res.data as Record<string, unknown>;
    const tripId =
      typeof json.tripId === "string" ? json.tripId : typeof json.id === "string" ? (json.id as string) : "";
    if (!tripId) return { ok: false, status: res.status, message: "missing tripId in response" };
    return { ok: true, data: { tripId, trip: parseTripPayload(json.trip ?? json) ?? undefined } };
  } catch (e) {
    return axiosToDispatchError(e);
  }
}

export async function cancelTrip(tripId: string): Promise<{ ok: true } | DispatchRestError> {
  try {
    await axios.patch(`/trips/${encodeURIComponent(tripId)}/cancel`);
    return { ok: true };
  } catch (e) {
    return axiosToDispatchError(e);
  }
}

export async function patchDriverOnline(isOnline: boolean): Promise<{ ok: true } | DispatchRestError> {
  try {
    await axios.patch(getDriverOnlinePatchPath(), { isOnline });
    return { ok: true };
  } catch (e) {
    return axiosToDispatchError(e);
  }
}

export async function patchDriverLocation(loc: {
  lat: number;
  lng: number;
  heading?: number;
}): Promise<{ ok: true } | DispatchRestError> {
  try {
    await axios.patch("/drivers/location", loc);
    return { ok: true };
  } catch (e) {
    return axiosToDispatchError(e);
  }
}
