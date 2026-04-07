import type { PaymentMode } from "@/lib/trip/tripStatus";

/** Replace with payload from customer booking / push when API is wired. */
export type IncomingOrderRequest = {
  id: string;
  serviceType: string;
  fareInr: number;
  distanceMinutes: number;
  distanceKm: number;
  pickup: { title: string; subtitle: string };
  drop: { title: string; subtitle: string };
  paymentMode?: PaymentMode;
};

export const DUMMY_INCOMING_ORDER: IncomingOrderRequest = {
  id: "ord_demo_1",
  serviceType: "Flash Delivery",
  fareInr: 350,
  distanceMinutes: 20,
  distanceKm: 8.4,
  paymentMode: "CASH",
  pickup: {
    title: "Lajpat Nagar",
    subtitle: "Sector 4, Central Market Area",
  },
  drop: {
    title: "Rohini",
    subtitle: "Sector 15, Near Metro Station",
  },
};

/** Seconds before the request auto-expires (driver did not accept). */
export const ORDER_REQUEST_TIMEOUT_SEC = 30;
