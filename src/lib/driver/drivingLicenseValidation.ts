import { z } from "zod";

/** Permissive Indian DL number (alphanumeric, hyphens, slashes; mock e.g. DL-20230059281). */
export const dlNumberSchema = z
  .string()
  .trim()
  .min(8, "Enter a valid DL number.")
  .max(40, "DL number is too long.")
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9/\-\s]{7,39}$/,
    "Enter a valid DL number.",
  );

function parseDdMmYyyy(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

export const dlExpirySchema = z
  .string()
  .trim()
  .refine((s) => parseDdMmYyyy(s) !== null, "Use a valid date (DD/MM/YYYY).")
  .refine((s) => {
    const dt = parseDdMmYyyy(s);
    if (!dt) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dt >= today;
  }, "Expiry must be today or in the future.");

export const drivingLicenseFormSchema = z.object({
  dlNumber: dlNumberSchema,
  expiryDate: dlExpirySchema,
});

export type DrivingLicenseFormData = z.infer<typeof drivingLicenseFormSchema>;
