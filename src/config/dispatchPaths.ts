/** Override if your Nest routes differ. */
export function getDriverActiveTripPath(): string {
  return process.env.NEXT_PUBLIC_DISPATCH_DRIVER_ACTIVE_PATH?.trim() || "/trips/driver/active";
}

export function getCustomerCurrentTripPath(): string {
  return process.env.NEXT_PUBLIC_DISPATCH_CUSTOMER_CURRENT_PATH?.trim() || "/trips/customer/current";
}
