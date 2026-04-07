import { z } from "zod";

/** Indian PAN: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F) */
export function createPanNumberSchema(t: (path: string) => string) {
  return z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, t("errors.pan.panInvalid"));
}

export function createPanFormSchema(t: (path: string) => string) {
  return z.object({
    panNumber: createPanNumberSchema(t),
    nameOnCard: z
      .string()
      .trim()
      .min(2, t("errors.pan.nameMin"))
      .max(120, t("errors.pan.nameMax")),
  });
}

export type PanFormData = z.infer<ReturnType<typeof createPanFormSchema>>;
