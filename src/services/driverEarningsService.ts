import { USE_DUMMY_DRIVER_EARNINGS } from "@/config/driverDataSource";
import type { DailyEarningsPoint, DriverEarningsDashboard } from "@/types/driverEarnings";

const DUMMY_LATENCY_MS = 350;

function buildDailyLast7Days(): DailyEarningsPoint[] {
  const nets = [420, 0, 380, 610, 290, 540, 460];
  const trips = [2, 0, 1, 3, 1, 2, 2];
  const out: DailyEarningsPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const idx = 6 - i;
    out.push({
      dateIso: d.toISOString().slice(0, 10),
      netInr: nets[idx] ?? 0,
      trips: trips[idx] ?? 0,
    });
  }
  return out;
}

function getDummyDashboard(): DriverEarningsDashboard {
  const dailyLast7Days = buildDailyLast7Days();
  const weekNetInr = dailyLast7Days.reduce((s, p) => s + p.netInr, 0);
  const weekTrips = dailyLast7Days.reduce((s, p) => s + p.trips, 0);
  return {
    source: "dummy",
    weekNetInr,
    weekTrips,
    previousWeekNetInr: 2180,
    dailyLast7Days,
    performance: {
      acceptanceRatePct: 87,
      missedRequests: 3,
      completedTripsInPeriod: weekTrips,
    },
    generatedAt: Date.now(),
  };
}

/**
 * Fetches driver earnings + performance snapshot.
 * Today: deterministic dummy. Later: `USE_DUMMY_DRIVER_EARNINGS === false` → HTTP + zod parse.
 */
export async function fetchDriverEarningsDashboard(): Promise<DriverEarningsDashboard> {
  await new Promise((r) => setTimeout(r, DUMMY_LATENCY_MS));

  if (USE_DUMMY_DRIVER_EARNINGS) {
    return getDummyDashboard();
  }

  // TODO: const res = await fetch(`${API_BASE}/drivers/me/earnings-dashboard`, { headers: { Authorization: … } });
  // if (!res.ok) throw new Error('EARNINGS_FETCH_FAILED');
  // return DriverEarningsDashboardSchema.parse(await res.json());
  return getDummyDashboard();
}
