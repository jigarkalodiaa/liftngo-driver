import type { IncomingOrderRequest } from "@/lib/driver/dummyOrderRequest";
import type { AssignedPickupTrip } from "@/lib/driver/tripAssignment";
import { PaymentMode, TripStatus } from "@/lib/trip/tripStatus";
import type { DriverTripSnapshot } from "@/lib/trip/tripTypes";

/** Approx. Rohini Sector 15 — replace with API. */
const DROP_LAT = 28.7495;
const DROP_LNG = 77.12;

export function buildDriverTripSnapshot(
  assigned: AssignedPickupTrip,
  order: IncomingOrderRequest,
  paymentMode: PaymentMode,
): DriverTripSnapshot {
  const fareInr = order.fareInr;
  return {
    tripId: `trip_${order.id}`,
    orderId: order.id,
    status: TripStatus.ASSIGNED,
    paymentMode,
    fareInr,
    pickup: {
      title: order.pickup.title,
      subtitle: order.pickup.subtitle,
      lat: assigned.lat,
      lng: assigned.lng,
    },
    drop: {
      title: order.drop.title,
      subtitle: order.drop.subtitle,
      lat: DROP_LAT,
      lng: DROP_LNG,
    },
    pickupPhone: assigned.pickupPhone,
    contactName: assigned.contactName,
    updatedAt: Date.now(),
  };
}
