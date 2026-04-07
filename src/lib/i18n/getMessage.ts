import type { DriverLocale } from "@/lib/i18n/constants";

/** Nested message tree → dot path e.g. `login.title` */
export function getMessage(
  dict: Record<string, unknown>,
  path: string,
): string | undefined {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object" || !(p in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

export function resolveMessage(
  dictionaries: Record<DriverLocale, Record<string, unknown>>,
  locale: DriverLocale,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const primary = getMessage(dictionaries[locale], path);
  const fallback = getMessage(dictionaries.en, path);
  const raw = primary ?? fallback ?? path;
  return interpolate(raw, vars);
}
