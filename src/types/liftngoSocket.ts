/** Roles expected by LiftNGo Socket.IO auth: `{ userId, role }`. */
export type LiftngoSocketRole = "DRIVER" | "CUSTOMER";

/** Driver on a trip (customer-facing). */
export type LiftngoDriver = {
  id: string;
  name?: string;
  phone?: string;
  vehicleLabel?: string;
  photoUrl?: string;
  rating?: number;
};

export type LiftngoPlace = {
  title?: string;
  subtitle?: string;
  lat?: number;
  lng?: number;
};

/** Core trip shape — extend as backend contract stabilizes. */
export type LiftngoTrip = {
  tripId: string;
  orderId?: string;
  status?: string;
  fareInr?: number;
  paymentMode?: string;
  pickup?: LiftngoPlace;
  drop?: LiftngoPlace;
  customerId?: string;
  driverId?: string;
  driver?: LiftngoDriver;
  /** Server timestamps (ms) if provided */
  createdAt?: number;
  updatedAt?: number;
};

export type LiftngoLatLng = {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt?: number;
};

/** --- Driver inbound events --- */

export type TripNewPayload = Partial<LiftngoTrip> & { tripId: string };

export type TripIdPayload = {
  tripId: string;
  reason?: string;
};

export type TripStatusPayload = {
  tripId: string;
  status: string;
  trip?: Partial<LiftngoTrip>;
};

/** --- Customer inbound events --- */

export type TripAcceptedPayload = {
  tripId: string;
  trip?: Partial<LiftngoTrip>;
  driver?: LiftngoDriver;
};

export type TripSearchingPayload = {
  tripId: string;
};

export type TripExpiredPayload = {
  tripId: string;
  message?: string;
};

export type LocationUpdatePayload = {
  tripId: string;
  lat: number;
  lng: number;
  heading?: number;
  updatedAt?: number;
};

/** Emit: join trip room */
export type JoinTripEmitPayload = {
  tripId: string;
  role: LiftngoSocketRole;
};
