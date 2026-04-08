/** PATCH body: `{ isOnline: boolean }`. Override if your API path differs. */
export function getDriverOnlinePatchPath(): string {
  return process.env.NEXT_PUBLIC_DISPATCH_DRIVER_ONLINE_PATH?.trim() || "/drivers/online";
}

/**
 * GET current active trip for reconcile. Override if your API path differs.
 * (Legacy default `/trips/driver/active` is not valid on all backends.)
 */
export function getDriverActiveTripPath(): string {
  return process.env.NEXT_PUBLIC_DISPATCH_DRIVER_ACTIVE_PATH?.trim() || "/driver/active-trip";
}

export function getCustomerCurrentTripPath(): string {
  return process.env.NEXT_PUBLIC_DISPATCH_CUSTOMER_CURRENT_PATH?.trim() || "/trips/customer/current";
}
