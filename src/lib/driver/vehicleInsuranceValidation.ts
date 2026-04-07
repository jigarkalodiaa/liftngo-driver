import { z } from "zod";

export const insurancePolicyNumberSchema = z
  .string()
  .trim()
  .min(5, "Enter policy number.")
  .max(48, "Policy number is too long.");

/** e.g. 22-Apr-2026 */
export const insuranceExpiryDateSchema = z
  .string()
  .trim()
  .regex(
    /^\d{1,2}-[A-Za-z]{3}-\d{4}$/,
    "Use format DD-MMM-YYYY (e.g. 22-Apr-2026).",
  );

export const vehicleInsuranceExtractedSchema = z.object({
  policyNumber: insurancePolicyNumberSchema,
  expiryDate: insuranceExpiryDateSchema,
});

export type VehicleInsuranceExtractedData = z.infer<typeof vehicleInsuranceExtractedSchema>;
