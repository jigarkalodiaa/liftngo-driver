/** Socket.IO event names — driver → server → rooms. */
export const SocketEvents = {
  /** Client → server: join trip room for sync. */
  JOIN_TRIP: "join_trip",
  JOIN_DRIVER: "join_driver",
  /** Client → server: driver is available / not available for assignments (body: { driverId, available, segment?, ts }). */
  DRIVER_AVAILABILITY: "driver:availability",
  /** Driver payload hub. */
  DRIVER_EVENT: "driver:event",
  /** Server → client: broadcast trip sync. */
  TRIP_SYNC: "trip:sync",
  TRIP_CANCELLED: "trip:cancelled",
  TRIP_RESYNC_REQUEST: "trip:resync_request",
  TRIP_RESYNC_STATE: "trip:resync_state",
} as const;

/** Payload `type` field for DRIVER_EVENT / trip:sync. */
export const DriverEventType = {
  DRIVER_STARTED_TRIP: "DRIVER_STARTED_TRIP",
  DRIVER_ARRIVED_PICKUP: "DRIVER_ARRIVED_PICKUP",
  TRIP_STARTED: "TRIP_STARTED",
  DRIVER_LOCATION_UPDATE: "DRIVER_LOCATION_UPDATE",
  DRIVER_ARRIVED_DROP: "DRIVER_ARRIVED_DROP",
  TRIP_COMPLETED: "TRIP_COMPLETED",
  TRIP_STATUS_UPDATE: "TRIP_STATUS_UPDATE",
} as const;

export type DriverEventTypeName = (typeof DriverEventType)[keyof typeof DriverEventType];

export type TripSyncPayload = {
  type: DriverEventTypeName | string;
  tripId: string;
  driverId?: string;
  status?: string;
  lat?: number;
  lng?: number;
  ts?: number;
};
