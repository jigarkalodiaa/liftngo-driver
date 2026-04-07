import type { PaymentMode, TripStatus } from "@/lib/trip/tripStatus";

export type TripPlace = {
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
};

/** Serializable active trip — persisted for refresh / resume. */
export type DriverTripSnapshot = {
  tripId: string;
  orderId: string;
  status: TripStatus;
  paymentMode: PaymentMode;
  /** Full trip fare in INR (what customer pays / prepaid amount). */
  fareInr: number;
  pickup: TripPlace;
  drop: TripPlace;
  pickupPhone: string;
  contactName: string;
  updatedAt: number;
};
