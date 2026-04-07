import { getLiftngoApiBaseUrl, mergeLiftngoFetchHeaders } from "@/config/liftngoApi";

export type TripRestError = {
  ok: false;
  status: number;
  message: string;
};

export type TripRestOk = { ok: true };

function authHeaders(token: string | null): HeadersInit {
  const h = new Headers({ "Content-Type": "application/json" });
  if (token) h.set("Authorization", `Bearer ${token}`);
  return mergeLiftngoFetchHeaders(h);
}

export async function acceptTrip(tripId: string, token: string | null): Promise<TripRestOk | TripRestError> {
  const base = getLiftngoApiBaseUrl().replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/trips/${encodeURIComponent(tripId)}/accept`, {
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

export async function rejectTrip(tripId: string, token: string | null): Promise<TripRestOk | TripRestError> {
  const base = getLiftngoApiBaseUrl().replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/trips/${encodeURIComponent(tripId)}/reject`, {
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
