import { z } from "zod";

/** Loose Indian registration: e.g. MH 12 AB 1234 */
export const vehicleRegistrationSchema = z
  .string()
  .trim()
  .min(8, "Enter a valid vehicle number.")
  .max(20, "Vehicle number is too long.")
  .regex(
    /^[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{3,4}$/i,
    "Use format e.g. MH 12 AB 1234",
  );

export const vehicleDetailsFormSchema = z.object({
  registrationNumber: vehicleRegistrationSchema,
  vehicleTypeDetail: z.string().trim().min(1, "Select vehicle type."),
  bodyType: z.string().trim().min(1, "Select body type."),
  isOwner: z.boolean(),
});

export type VehicleDetailsFormData = z.infer<typeof vehicleDetailsFormSchema>;

export const VEHICLE_TYPE_OPTIONS = [
  "2 Wheeler",
  "3 Wheeler EV",
  "3 Wheeler",
  "4 Wheeler",
  "Mini Truck",
  "Pickup",
] as const;

export const BODY_TYPE_OPTIONS = ["Close", "Open", "Flatbed", "Container"] as const;

/** True when selected type is electric (no PUC required). */
export function isElectricVehicleType(vehicleTypeDetail: string): boolean {
  const t = vehicleTypeDetail.trim();
  if (!t) return false;
  return /\bev\b/i.test(t) || /electric/i.test(t);
}
