export const DRIVER_LOCALE_KEY = "liftngo_driver_locale";

export type DriverLocale = "en" | "hi";

export function isDriverLocale(v: string | null): v is DriverLocale {
  return v === "en" || v === "hi";
}
