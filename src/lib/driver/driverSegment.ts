/**
 * Partner segmentation for dispatch priority (backend + client).
 * PREMIUM = priority pool; STANDARD = default pool — both are valued; framing is benefit-led.
 */

export const DriverSegment = {
  PREMIUM: "PREMIUM",
  STANDARD: "STANDARD",
} as const;

export type DriverSegment = (typeof DriverSegment)[keyof typeof DriverSegment];

/** Minimum performance index (0–100 style) to qualify for premium pool. */
export const PREMIUM_MIN_PERFORMANCE_SCORE = 60;

/** Max cancellation rate (percent, exclusive) for premium pool — e.g. 9.9 qualifies, 10 does not. */
export const PREMIUM_MAX_CANCELLATION_RATE_PCT = 10;

export type DriverPerformanceMetrics = {
  performanceScore: number;
  /** Cancellation rate as a percentage 0–100 (e.g. 7.5 = 7.5%). */
  cancellationRatePct: number;
};

/**
 * Dispatch / product rule: premium pool when score is high enough and cancellations stay low.
 */
export function computeDriverSegment(metrics: DriverPerformanceMetrics): DriverSegment {
  const { performanceScore, cancellationRatePct } = metrics;
  if (
    performanceScore >= PREMIUM_MIN_PERFORMANCE_SCORE &&
    cancellationRatePct < PREMIUM_MAX_CANCELLATION_RATE_PCT
  ) {
    return DriverSegment.PREMIUM;
  }
  return DriverSegment.STANDARD;
}

/** Full driver tagging shape for APIs and JWT payload. */
export type DriverSegmentPayload = DriverPerformanceMetrics & {
  segment: DriverSegment;
};

export function buildDriverSegmentPayload(metrics: DriverPerformanceMetrics): DriverSegmentPayload {
  return {
    ...metrics,
    segment: computeDriverSegment(metrics),
  };
}
