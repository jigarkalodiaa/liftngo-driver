import { z } from "zod";
import { indianPhoneSchema } from "@/lib/driver/validation";

export const ownerFullNameSchema = z
  .string()
  .trim()
  .min(2, "Enter the owner's full name.")
  .max(120, "Name is too long.");

export const ownerInformationFormSchema = z.object({
  fullName: ownerFullNameSchema,
  phone: indianPhoneSchema,
});

export type OwnerInformationFormData = z.infer<typeof ownerInformationFormSchema>;
