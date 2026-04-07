const KEY = "liftngo-driver-notifications-read";

export function loadReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return new Set();
    return new Set(v.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function saveReadNotificationIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify([...ids]));
}

/** Fixed notification ids (copy lives in i18n `dashboard.notif*` keys). */
export const DRIVER_NOTIFICATION_IDS = ["welcome", "tips", "payout"] as const;

export type DriverNotificationId = (typeof DRIVER_NOTIFICATION_IDS)[number];
