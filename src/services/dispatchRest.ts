import { getLiftngoApiBaseUrl } from "@/config/liftngoApi";
import { getCustomerCurrentTripPath, getDriverActiveTripPath } from "@/config/dispatchPaths";
import type { DispatchTrip } from "@/types/dispatch";
import { normalizeStatusToMachine } from "@/lib/dispatch/tripStateMachine";

export type DispatchRestError = { ok: false; status: number; message: string };
export type DispatchRestOk<T> = { ok: true; data: T };

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

const base = () => getLiftngoApiBaseUrl().replace(/\/$/, "");

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

export async function fetchDriverActiveTrip(
  token: string | null,
): Promise<DispatchRestOk<DispatchTrip | null> | DispatchRestError> {
  try {
    const res = await fetch(`${base()}${getDriverActiveTripPath()}`, {
      method: "GET",
      headers: authHeaders(token),
      credentials: "include",
    });
    if (res.status === 404 || res.status === 204) return { ok: true, data: null };
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, message: text || res.statusText };
    }
    const json = (await res.json()) as unknown;
    const wrapped =
      json && typeof json === "object" && "trip" in (json as object)
        ? (json as { trip: unknown }).trip
        : json;
    return { ok: true, data: parseTripPayload(wrapped) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "network_error";
    return { ok: false, status: 0, message };
  }
}

export async function fetchCustomerCurrentTrip(
  token: string | null,
): Promise<DispatchRestOk<DispatchTrip | null> | DispatchRestError> {
  try {
    const res = await fetch(`${base()}${getCustomerCurrentTripPath()}`, {
      method: "GET",
      headers: authHeaders(token),
      credentials: "include",
    });
    if (res.status === 404 || res.status === 204) return { ok: true, data: null };
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, message: text || res.statusText };
    }
    const json = (await res.json()) as unknown;
    const wrapped =
      json && typeof json === "object" && "trip" in (json as object)
        ? (json as { trip: unknown }).trip
        : json;
    return { ok: true, data: parseTripPayload(wrapped) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "network_error";
    return { ok: false, status: 0, message };
  }
}

export async function createTrip(
  body: Record<string, unknown>,
  token: string | null,
): Promise<DispatchRestOk<{ tripId: string; trip?: DispatchTrip }> | DispatchRestError> {
  try {
    const res = await fetch(`${base()}/trips`, {
      method: "POST",
      headers: authHeaders(token),
      credentials: "include",
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, status: res.status, message: text || res.statusText };
    let json: unknown = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = {};
    }
    const o = json as Record<string, unknown>;
    const tripId =
      typeof o.tripId === "string" ? o.tripId : typeof o.id === "string" ? (o.id as string) : "";
    if (!tripId) return { ok: false, status: res.status, message: "missing tripId in response" };
    return { ok: true, data: { tripId, trip: parseTripPayload(o.trip ?? o) ?? undefined } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "network_error";
    return { ok: false, status: 0, message };
  }
}

export async function cancelTrip(
  tripId: string,
  token: string | null,
): Promise<{ ok: true } | DispatchRestError> {
  try {
    const res = await fetch(`${base()}/trips/${encodeURIComponent(tripId)}/cancel`, {
      method: "PATCH",
      headers: authHeaders(token),
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, message: text || res.statusText };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "network_error";
    return { ok: false, status: 0, message };
  }
}

export async function patchDriverOnline(
  online: boolean,
  token: string | null,
): Promise<{ ok: true } | DispatchRestError> {
  try {
    const res = await fetch(`${base()}/drivers/online`, {
      method: "PATCH",
      headers: authHeaders(token),
      credentials: "include",
      body: JSON.stringify({ online }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, message: text || res.statusText };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "network_error";
    return { ok: false, status: 0, message };
  }
}

export async function patchDriverLocation(
  loc: { lat: number; lng: number; heading?: number },
  token: string | null,
): Promise<{ ok: true } | DispatchRestError> {
  try {
    const res = await fetch(`${base()}/drivers/location`, {
      method: "PATCH",
      headers: authHeaders(token),
      credentials: "include",
      body: JSON.stringify(loc),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, message: text || res.statusText };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "network_error";
    return { ok: false, status: 0, message };
  }
}
