/**
 * Earnings + performance payloads for driver trust / disputes / retention.
 * Populated by dummy service until REST is wired (`source` becomes `"api"`).
 */

export type DriverEarningsDataSource = "dummy" | "api";

export type DailyEarningsPoint = {
  /** YYYY-MM-DD (local generation day for dummy). */
  dateIso: string;
  netInr: number;
  trips: number;
};

export type DriverPerformanceInsights = {
  /** 0–100: offers accepted ÷ offers received in period. */
  acceptanceRatePct: number;
  /** Trip requests that timed out without accept (driver-facing). */
  missedRequests: number;
  /** Completed trips in the same analytics window as acceptance. */
  completedTripsInPeriod: number;
};

export type DriverEarningsDashboard = {
  source: DriverEarningsDataSource;
  /** Sum of net driver earnings for current ISO week (dummy: fixed sample). */
  weekNetInr: number;
  weekTrips: number;
  previousWeekNetInr: number;
  /** Newest last (for left-to-right chart). */
  dailyLast7Days: DailyEarningsPoint[];
  performance: DriverPerformanceInsights;
  generatedAt: number;
};
