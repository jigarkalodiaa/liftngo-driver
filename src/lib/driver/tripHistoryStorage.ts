const KEY = "liftngo-driver-trip-history";
const MAX = 30;

export type TripHistoryOutcome = "completed" | "missed" | "cancelled";

export type TripHistoryEntry = {
  id: string;
  orderId: string;
  fareInr: number;
  paymentMode: string;
  /** When the trip completed, the request expired, or the trip was cancelled. */
  completedAt: number;
  driverShareInr: number;
  commissionInr: number;
  outcome: TripHistoryOutcome;
  /** Server or support message when outcome is cancelled. */
  cancelReason?: string;
};

function normalizeEntry(raw: unknown): TripHistoryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : null;
  if (!id) return null;
  const outcomeRaw = o.outcome;
  const outcome: TripHistoryOutcome =
    outcomeRaw === "missed" || outcomeRaw === "cancelled" ? outcomeRaw : "completed";
  return {
    id,
    orderId: typeof o.orderId === "string" ? o.orderId : id,
    fareInr: typeof o.fareInr === "number" && Number.isFinite(o.fareInr) ? o.fareInr : 0,
    paymentMode: typeof o.paymentMode === "string" ? o.paymentMode : "—",
    completedAt:
      typeof o.completedAt === "number" && Number.isFinite(o.completedAt) ? o.completedAt : Date.now(),
    driverShareInr:
      typeof o.driverShareInr === "number" && Number.isFinite(o.driverShareInr) ? o.driverShareInr : 0,
    commissionInr:
      typeof o.commissionInr === "number" && Number.isFinite(o.commissionInr) ? o.commissionInr : 0,
    outcome,
    cancelReason: typeof o.cancelReason === "string" ? o.cancelReason : undefined,
  };
}

function load(): TripHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.map(normalizeEntry).filter((e): e is TripHistoryEntry => e != null);
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

/** Log a missed incoming request (timeout without accept). */
export function appendMissedTripHistory(order: {
  id: string;
  fareInr: number;
  paymentMode?: string;
}): void {
  const pm = order.paymentMode && order.paymentMode.length > 0 ? order.paymentMode : "—";
  appendTripHistory({
    id: `miss-${order.id}-${Date.now()}`,
    orderId: order.id,
    fareInr: order.fareInr,
    paymentMode: pm,
    completedAt: Date.now(),
    driverShareInr: 0,
    commissionInr: 0,
    outcome: "missed",
  });
}
