import { isDriverLocale } from "@/lib/i18n/constants";
import { DRIVER_LOCALE_KEY } from "@/lib/i18n/constants";
import type { DriverLocale } from "@/lib/i18n/constants";
import { driverDictionaries } from "@/lib/i18n/dictionaries";
import { resolveMessage } from "@/lib/i18n/getMessage";

/** For Zustand / non-React code: reads locale from `localStorage`. */
export function translateDriver(
  path: string,
  vars?: Record<string, string | number>,
): string {
  if (typeof window === "undefined") return path;
  const raw = localStorage.getItem(DRIVER_LOCALE_KEY);
  const loc: DriverLocale = isDriverLocale(raw) ? raw : "en";
  return resolveMessage(driverDictionaries, loc, path, vars);
}
