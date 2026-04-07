/** Performance score (0–100) must stay below this for a missed trip to count toward suspension. */
export const SUSPENSION_PERFORMANCE_THRESHOLD = 33;

export const SUSPENSION_FIRST_DAYS = 2;
export const SUSPENSION_SECOND_DAYS = 7;

const MS_PER_DAY = 86_400_000;

export function suspensionEndMsFromNow(days: number): number {
  return Date.now() + days * MS_PER_DAY;
}

export function formatSuspensionEndDate(ms: number, localeTag: string): string {
  return new Date(ms).toLocaleString(localeTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
