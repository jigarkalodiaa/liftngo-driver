import { z } from "zod";

/** Localized messages via `t("errors.aadhaar.*")` */
export function createAadhaarFormSchema(t: (path: string) => string) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, t("errors.aadhaar.nameMin"))
      .max(100, t("errors.aadhaar.nameMax")),
    phone: z
      .string()
      .trim()
      .regex(/^[789]\d{9}$/, t("errors.aadhaar.phoneInvalid")),
    aadhaarNumber: z
      .string()
      .trim()
      .regex(/^\d{12}$/, t("errors.aadhaar.aadhaarDigits")),
    address: z
      .string()
      .trim()
      .min(5, t("errors.aadhaar.addressMin"))
      .max(300, t("errors.aadhaar.addressMax")),
    region: z.string().trim().min(1, t("errors.aadhaar.region")),
    consent: z.literal(true, { message: t("errors.aadhaar.consent") }),
  });
}

export type AadhaarFormData = z.infer<ReturnType<typeof createAadhaarFormSchema>>;

export const REGIONS = [
  "Khatushyam",
  "Delhi NCR",
  "Jaipur",
  "Sikar",
  "Nagaur",
  "Jhunjhunu",
  "Churu",
  "Other",
] as const;
