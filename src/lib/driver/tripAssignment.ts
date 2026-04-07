import type { IncomingOrderRequest } from "@/lib/driver/dummyOrderRequest";

/** Full pickup details after the trip is assigned to this driver (from API in production). */
export type AssignedPickupTrip = {
  orderId: string;
  contactName: string;
  /** 10-digit Indian mobile (no country code). */
  pickupPhone: string;
  addressLine1: string;
  addressLine2: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

/**
 * Set to a value between 0 and 1 to randomly simulate another driver winning the race
 * (for testing the “stay tuned” message). Default 0 = you always win the mock assign.
 */
export const MOCK_TRIP_LOST_PROBABILITY = 0;

/** Approx. Lajpat Nagar Central Market — replace with API coordinates. */
const PICKUP_LAT = 28.5756;
const PICKUP_LNG = 77.245;

export function buildAssignedPickupTrip(order: IncomingOrderRequest): AssignedPickupTrip {
  return {
    orderId: order.id,
    contactName: "Customer (pickup)",
    pickupPhone: "9876543210",
    addressLine1: order.pickup.title,
    addressLine2: order.pickup.subtitle,
    fullAddress: `${order.pickup.subtitle}, ${order.pickup.title}, New Delhi 110024`,
    lat: PICKUP_LAT,
    lng: PICKUP_LNG,
  };
}

/**
 * Mock: first driver to complete accept wins. Replace with POST /trips/:id/accept.
 * Returns `ok: false` when another driver already accepted (or random loss if probability &gt; 0).
 */
export async function tryAssignTrip(
  order: IncomingOrderRequest,
): Promise<{ ok: true; trip: AssignedPickupTrip } | { ok: false }> {
  await new Promise((r) => setTimeout(r, 750));
  if (MOCK_TRIP_LOST_PROBABILITY > 0 && Math.random() < MOCK_TRIP_LOST_PROBABILITY) {
    return { ok: false };
  }
  return { ok: true, trip: buildAssignedPickupTrip(order) };
}

export function mapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function openStreetMapEmbedUrl(lat: number, lng: number): string {
  const pad = 0.012;
  const minLon = lng - pad;
  const minLat = lat - pad;
  const maxLon = lng + pad;
  const maxLat = lat + pad;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function telPickupHref(phone10: string): string {
  const d = phone10.replace(/\D/g, "").slice(-10);
  return `tel:+91${d}`;
}
