/** Strict driver trip lifecycle — no skipping states. */
export const TripStatus = {
  ASSIGNED: "ASSIGNED",
  EN_ROUTE_TO_PICKUP: "EN_ROUTE_TO_PICKUP",
  ARRIVED_AT_PICKUP: "ARRIVED_AT_PICKUP",
  LOADING_CONFIRMED: "LOADING_CONFIRMED",
  TRIP_STARTED: "TRIP_STARTED",
  EN_ROUTE_TO_DROP: "EN_ROUTE_TO_DROP",
  ARRIVED_AT_DROP: "ARRIVED_AT_DROP",
  UNLOADING_CONFIRMED: "UNLOADING_CONFIRMED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  TRIP_COMPLETED: "TRIP_COMPLETED",
} as const;

export type TripStatus = (typeof TripStatus)[keyof typeof TripStatus];

export const PaymentMode = {
  CASH: "CASH",
  PREPAID: "PREPAID",
} as const;

export type PaymentMode = (typeof PaymentMode)[keyof typeof PaymentMode];

const ALLOWED: Record<TripStatus, TripStatus[]> = {
  [TripStatus.ASSIGNED]: [TripStatus.EN_ROUTE_TO_PICKUP],
  [TripStatus.EN_ROUTE_TO_PICKUP]: [TripStatus.ARRIVED_AT_PICKUP],
  [TripStatus.ARRIVED_AT_PICKUP]: [TripStatus.LOADING_CONFIRMED],
  [TripStatus.LOADING_CONFIRMED]: [TripStatus.TRIP_STARTED],
  [TripStatus.TRIP_STARTED]: [TripStatus.EN_ROUTE_TO_DROP],
  [TripStatus.EN_ROUTE_TO_DROP]: [TripStatus.ARRIVED_AT_DROP],
  [TripStatus.ARRIVED_AT_DROP]: [TripStatus.UNLOADING_CONFIRMED],
  [TripStatus.UNLOADING_CONFIRMED]: [TripStatus.PAYMENT_PENDING, TripStatus.PAYMENT_COMPLETED],
  [TripStatus.PAYMENT_PENDING]: [TripStatus.PAYMENT_COMPLETED],
  [TripStatus.PAYMENT_COMPLETED]: [TripStatus.TRIP_COMPLETED],
  [TripStatus.TRIP_COMPLETED]: [],
};

export function canTransition(from: TripStatus, to: TripStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: TripStatus, to: TripStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid trip transition: ${from} → ${to}`);
  }
}

/** After unloading: cash must go through payment pending; prepaid skips to completed. */
export function unloadingTargets(paymentMode: PaymentMode): TripStatus[] {
  return paymentMode === PaymentMode.CASH
    ? [TripStatus.PAYMENT_PENDING]
    : [TripStatus.PAYMENT_COMPLETED];
}
