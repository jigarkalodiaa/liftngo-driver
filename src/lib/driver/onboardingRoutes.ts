/**
 * New-driver KYC order (after OTP for new users):
 * Aadhaar → PAN → Driving license → Selfie → Vehicle → … → Bank details → Application review (pending
 * verification, up to ~24 working hours) → Dashboard once approved.
 */
export const DRIVER_ONBOARDING = {
  aadhaar: "/driver/aadhaar",
  pan: "/driver/pan",
  drivingLicense: "/driver/driving-license",
  selfie: "/driver/selfie",
  vehicleType: "/driver/vehicle-type",
  vehicleDetails: "/driver/vehicle-details",
  vehicleOwner: "/driver/vehicle-owner",
  vehicleRc: "/driver/vehicle-rc",
  vehicleInsurance: "/driver/vehicle-insurance",
  vehiclePuc: "/driver/vehicle-puc",
  vehiclePhotos: "/driver/vehicle-photos",
  bankDetails: "/driver/bank-details",
  applicationReview: "/driver/application-review",
  dashboard: "/driver/dashboard",
  login: "/driver/login",
} as const;
