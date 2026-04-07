import { TripStatus } from "@/lib/trip/tripStatus";

/** Ordered active phases for linear progress (excludes TRIP_COMPLETED — trip clears). */
export const TRIP_PROGRESS_STATUSES: TripStatus[] = [
  TripStatus.ASSIGNED,
  TripStatus.EN_ROUTE_TO_PICKUP,
  TripStatus.ARRIVED_AT_PICKUP,
  TripStatus.LOADING_CONFIRMED,
  TripStatus.TRIP_STARTED,
  TripStatus.EN_ROUTE_TO_DROP,
  TripStatus.ARRIVED_AT_DROP,
  TripStatus.UNLOADING_CONFIRMED,
  TripStatus.PAYMENT_PENDING,
  TripStatus.PAYMENT_COMPLETED,
];

/** 0–1 inclusive for progress bar. */
export function tripProgressFraction(status: TripStatus): number {
  if (status === TripStatus.TRIP_COMPLETED) return 1;
  const i = TRIP_PROGRESS_STATUSES.indexOf(status);
  if (i < 0) return 0;
  const last = TRIP_PROGRESS_STATUSES.length - 1;
  return last === 0 ? 1 : i / last;
}

export function tripProgressStepIndex(status: TripStatus): number {
  if (status === TripStatus.TRIP_COMPLETED) return TRIP_PROGRESS_STATUSES.length;
  const i = TRIP_PROGRESS_STATUSES.indexOf(status);
  return i < 0 ? 0 : i;
}
