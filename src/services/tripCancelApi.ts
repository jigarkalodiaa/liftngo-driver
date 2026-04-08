/**
 * @deprecated Use `@/services/api` instead. This file is kept for backward compatibility.
 */

import axios from "axios";

export type TripCancelResult =
  | { ok: true }
  | { ok: false; status: number; message: string; code?: string };

/**
 * Driver-only path: backend enforces `VEHICLE_BREAKDOWN` as the only allowed driver reason.
 * Bearer via global axios interceptors (QueryProvider).
 */
export async function cancelTripVehicleBreakdown(tripId: string): Promise<TripCancelResult> {
  try {
    await axios.patch(`/trips/${encodeURIComponent(tripId)}/cancel`, { reason: "VEHICLE_BREAKDOWN" });
    return { ok: true };
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const status = e.response?.status ?? 0;
      const raw = e.response?.data;
      let message = e.message;
      let code: string | undefined;
      if (raw && typeof raw === "object") {
        const o = raw as { message?: string; code?: string };
        if (typeof o.message === "string") message = o.message;
        if (typeof o.code === "string") code = o.code;
      } else if (typeof raw === "string") message = raw;
      return { ok: false, status, message, code };
    }
    const message = e instanceof Error ? e.message : "network_error";
    return { ok: false, status: 0, message };
  }
}
