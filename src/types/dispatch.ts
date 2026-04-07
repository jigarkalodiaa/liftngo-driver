/** Strict trip lifecycle for dispatch UX (maps to backend statuses). */
export type TripMachineState =
  | "IDLE"
  | "SEARCHING"
  | "ASSIGNED"
  | "ARRIVING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type LiftngoSocketRole = "DRIVER" | "CUSTOMER";

export type DispatchDriver = {
  id: string;
  name?: string;
  phone?: string;
  vehicleLabel?: string;
  photoUrl?: string;
  rating?: number;
};

export type DispatchLocation = {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt: number;
};

/** Canonical trip document in the client dispatch layer. */
export type DispatchTrip = {
  tripId: string;
  orderId?: string;
  /** Normalized machine state (derived + socket). */
  machineState: TripMachineState;
  /** Raw backend status string when useful for display */
  rawStatus?: string;
  fareInr?: number;
  paymentMode?: string;
  pickup?: { title?: string; subtitle?: string; lat?: number; lng?: number };
  drop?: { title?: string; subtitle?: string; lat?: number; lng?: number };
  customerId?: string;
  driverId?: string;
  driver?: DispatchDriver;
  /** Monotonic event ordering from server (preferred) */
  eventVersion?: number;
  /** Last applied server or client event time (ms) */
  lastEventAt: number;
  /** When driver must respond (client or server) */
  offerExpiresAt?: number;
  createdAt?: number;
  updatedAt?: number;
};

/** Envelope for stale-event filtering (attach to any inbound payload). */
export type DispatchEventMeta = {
  tripId: string;
  ts?: number;
  version?: number;
};

export type SocketEventMap = {
  "trip:new": Partial<DispatchTrip> & { tripId: string; ts?: number; version?: number; expiresAt?: number };
  "trip:missed": { tripId: string; ts?: number; version?: number; reason?: string };
  "trip:cancelled": { tripId: string; ts?: number; version?: number; reason?: string };
  "trip:status": {
    tripId: string;
    status: string;
    trip?: Partial<DispatchTrip>;
    ts?: number;
    version?: number;
  };
  "trip:searching": { tripId: string; ts?: number; version?: number };
  "trip:accepted": {
    tripId: string;
    trip?: Partial<DispatchTrip>;
    driver?: DispatchDriver;
    ts?: number;
    version?: number;
  };
  "trip:expired": { tripId: string; message?: string; ts?: number; version?: number };
  "location:update": {
    tripId: string;
    lat: number;
    lng: number;
    heading?: number;
    updatedAt?: number;
    ts?: number;
    version?: number;
  };
  "join:trip": { tripId: string; role: LiftngoSocketRole };
};

export type SocketEventName = keyof SocketEventMap;
