import { z } from "zod";

export const pucNumberSchema = z
  .string()
  .trim()
  .min(5, "Enter PUC number.")
  .max(40, "PUC number is too long.");

/** DD/MM/YYYY e.g. 10/10/2024 */
export const pucExpiryDateSchema = z
  .string()
  .trim()
  .regex(
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    "Use format DD/MM/YYYY (e.g. 10/10/2024).",
  );

export const vehiclePucExtractedSchema = z.object({
  pucNumber: pucNumberSchema,
  expiryDate: pucExpiryDateSchema,
});

export type VehiclePucExtractedData = z.infer<typeof vehiclePucExtractedSchema>;
