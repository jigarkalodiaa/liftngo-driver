/**
 * @deprecated Use `@/services/api` instead. This file is kept for backward compatibility.
 */

import axios from "axios";

export type TripRestError = {
  ok: false;
  status: number;
  message: string;
};

export type TripRestOk = { ok: true };

function axiosErrorToTripRest(e: unknown): TripRestError {
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

/** Accept trip — Bearer via global axios interceptors (QueryProvider). */
export async function acceptTrip(tripId: string): Promise<TripRestOk | TripRestError> {
  try {
    await axios.patch(`/trips/${encodeURIComponent(tripId)}/accept`);
    return { ok: true };
  } catch (e) {
    return axiosErrorToTripRest(e);
  }
}

export async function rejectTrip(tripId: string): Promise<TripRestOk | TripRestError> {
  try {
    await axios.patch(`/trips/${encodeURIComponent(tripId)}/reject`);
    return { ok: true };
  } catch (e) {
    return axiosErrorToTripRest(e);
  }
}
