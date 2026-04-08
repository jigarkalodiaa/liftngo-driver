/**
 * Centralized API path configuration.
 * All API endpoints are defined here for easy maintenance and consistency.
 */

const env = (key: string, fallback: string): string =>
  (typeof process !== "undefined" ? process.env[key]?.trim() : undefined) || fallback;

export const API_PATHS = {
  // Driver
  DRIVER_ONLINE: env("NEXT_PUBLIC_DISPATCH_DRIVER_ONLINE_PATH", "/drivers/online"),
  DRIVER_ACTIVE_TRIP: env("NEXT_PUBLIC_DISPATCH_DRIVER_ACTIVE_PATH", "/driver/active-trip"),
  DRIVER_LOCATION: "/drivers/location",
  DRIVER_PERFORMANCE: "/drivers/performance",

  // Customer
  CUSTOMER_CURRENT_TRIP: env("NEXT_PUBLIC_DISPATCH_CUSTOMER_CURRENT_PATH", "/trips/customer/current"),

  // Trips
  TRIPS: "/trips",
  tripById: (id: string) => `/trips/${encodeURIComponent(id)}`,
  tripAccept: (id: string) => `/trips/${encodeURIComponent(id)}/accept`,
  tripReject: (id: string) => `/trips/${encodeURIComponent(id)}/reject`,
  tripCancel: (id: string) => `/trips/${encodeURIComponent(id)}/cancel`,

  // Auth (internal Next.js routes)
  SEND_OTP: "/api/send-otp",
  VERIFY_OTP: "/api/verify-otp",
  RESEND_OTP: "/api/resend-otp",
} as const;

export type ApiPathKey = keyof typeof API_PATHS;
