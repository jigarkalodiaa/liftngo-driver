import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";

/** Same key as {@link getNestAccessToken} in driverPerformanceApi — kept here to avoid circular imports with the axios client. */
const NEST_JWT_KEY = "liftngo_nest_access_token";

/**
 * Bearer for Liftngo REST: prefer Nest access JWT, else driver session token from OTP.
 * Used only by the axios client request interceptor (browser).
 */
export function getLiftngoBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  const nest = localStorage.getItem(NEST_JWT_KEY);
  if (nest?.trim()) return nest.trim();
  return localStorage.getItem(DRIVER_AUTH_TOKEN_KEY)?.trim() || null;
}
