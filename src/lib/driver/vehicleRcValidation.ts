import { z } from "zod";
import { vehicleRegistrationSchema } from "@/lib/driver/vehicleValidation";

export { vehicleRegistrationSchema };

export const vehicleRcOwnerNameSchema = z
  .string()
  .trim()
  .min(2, "Enter owner name as on RC.")
  .max(120, "Name is too long.");

export const vehicleRcExtractedSchema = z.object({
  vehicleNumber: vehicleRegistrationSchema,
  ownerName: vehicleRcOwnerNameSchema,
});

export type VehicleRcExtractedData = z.infer<typeof vehicleRcExtractedSchema>;
