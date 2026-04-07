import { z } from "zod";

/** Indian mobile numbers: exactly 10 digits, must start with 7, 8, or 9. */
export const indianPhoneSchema = z
  .string()
  .trim()
  .regex(/^[789]\d{9}$/, "Enter a valid 10-digit Indian mobile number.");

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "OTP must be 4 digits.");

export const sendOtpBodySchema = z.object({
  phone: indianPhoneSchema,
});

export const verifyOtpBodySchema = z.object({
  phone: indianPhoneSchema,
  otp: otpSchema,
});

export const resendOtpBodySchema = z.object({
  phone: indianPhoneSchema,
});

/** Returns true if the partial input so far could become a valid Indian number. */
export function isValidPartialPhone(value: string): boolean {
  if (value.length === 0) return true;
  if (!/^[789]/.test(value)) return false;
  if (value.length > 10) return false;
  return /^\d*$/.test(value);
}
