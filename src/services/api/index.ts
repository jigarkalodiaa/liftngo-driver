/**
 * Centralized API Services
 * 
 * All API calls go through this layer.
 * Pattern: Component → Hook → Service → API Client (axios)
 * 
 * @example
 * // In a hook:
 * import { tripApi } from "@/services/api";
 * const result = await tripApi.acceptTrip(tripId);
 * if (result.ok) { ... }
 */

// Driver APIs
export * as driverApi from "./driverApi";
export {
  patchDriverOnline,
  patchDriverLocation,
  fetchDriverPerformance,
} from "./driverApi";

// Trip APIs
export * as tripApi from "./tripApi";
export {
  fetchDriverActiveTrip,
  fetchCustomerCurrentTrip,
  createTrip,
  acceptTrip,
  rejectTrip,
  cancelTrip,
  cancelTripWithReason,
} from "./tripApi";

// Auth APIs
export * as authApi from "./authApi";
export {
  sendOtp,
  verifyOtp,
  resendOtp,
} from "./authApi";

// Types
export type { ApiResult, ApiResultVoid } from "@/lib/api/apiError";
export type { DriverLocationPayload } from "./driverApi";
export type { CreateTripPayload, CreateTripResponse, CancelTripReason } from "./tripApi";
export type { DriverType, DriverSegmentApi, VerifyOtpResponse } from "./authApi";
