const KEY = "liftngo-driver-trip-history";
const MAX = 30;

export type TripHistoryEntry = {
  id: string;
  orderId: string;
  fareInr: number;
  paymentMode: string;
  completedAt: number;
  driverShareInr: number;
  commissionInr: number;
};

function load(): TripHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as TripHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: TripHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
}

export function loadTripHistory(): TripHistoryEntry[] {
  return load();
}

export function appendTripHistory(entry: TripHistoryEntry): void {
  const prev = load();
  save([entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, MAX));
}
