import type { DriverVehicleCategory } from "@/context/DriverVehicleContext";

export const DRIVER_ONBOARDING_PROFILE_KEY = "liftngo-driver-onboarding-profile";

/** Non-sensitive fields the driver entered during onboarding; merged over time. */
export type DriverOnboardingProfileSnapshot = {
  aadhaarName?: string;
  phone?: string;
  region?: string;
  panHolderName?: string;
  panNumber?: string;
  bankAccountHolderName?: string;
  vehicleCategory?: DriverVehicleCategory;
  registrationNumber?: string;
  vehicleTypeDetail?: string;
  bodyType?: string;
  isVehicleOwner?: boolean;
  rcOwnerName?: string;
  rcOwnerPhone?: string;
};

function safeParse(raw: string | null): DriverOnboardingProfileSnapshot {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) return v as DriverOnboardingProfileSnapshot;
  } catch {
    /* ignore */
  }
  return {};
}

export function loadDriverOnboardingProfile(): DriverOnboardingProfileSnapshot {
  if (typeof window === "undefined") return {};
  return safeParse(localStorage.getItem(DRIVER_ONBOARDING_PROFILE_KEY));
}

export function mergeDriverOnboardingProfile(patch: Partial<DriverOnboardingProfileSnapshot>): void {
  if (typeof window === "undefined") return;
  const prev = loadDriverOnboardingProfile();
  const next = { ...prev, ...patch };
  localStorage.setItem(DRIVER_ONBOARDING_PROFILE_KEY, JSON.stringify(next));
}

export function clearDriverOnboardingProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRIVER_ONBOARDING_PROFILE_KEY);
}
