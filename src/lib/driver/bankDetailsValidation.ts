import { z } from "zod";

export const accountHolderNameSchema = z
  .string()
  .trim()
  .min(2, "Enter name as per bank record.")
  .max(120, "Name is too long.");

/** Indian bank account: 9–18 digits */
export const bankAccountNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{9,18}$/, "Enter a valid 9–18 digit account number.");

/** Indian IFSC: 4 letters, 0, then 6 alphanumeric (e.g. SBIN0001234) */
export const ifscCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC (e.g. SBIN0001234).");

export const bankDetailsFormSchema = z.object({
  accountHolderName: accountHolderNameSchema,
  accountNumber: bankAccountNumberSchema,
  ifscCode: ifscCodeSchema,
});

export type BankDetailsFormData = z.infer<typeof bankDetailsFormSchema>;
