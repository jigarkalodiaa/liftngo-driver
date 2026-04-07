"use client";

import { memo } from "react";
import { formatInr } from "@/lib/formatInr";
import type { DriverEarningsDashboard } from "@/types/driverEarnings";

type EarningsInsightsPanelProps = {
  data: DriverEarningsDashboard | undefined;
  isLoading: boolean;
  isError: boolean;
  compact?: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dateLocaleTag: string;
};

function weekDeltaPct(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function EarningsInsightsPanelInner({
  data,
  isLoading,
  isError,
  compact,
  t,
  dateLocaleTag,
}: EarningsInsightsPanelProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-4">
        <div className="h-3 w-40 rounded bg-[var(--color-gray-200)]" />
        <div className="mt-3 h-16 rounded-lg bg-[var(--color-gray-200)]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="rounded-xl border border-rose-100 bg-rose-50/90 px-3 py-2 text-xs font-medium text-rose-900">
        {t("wallet.insightsError")}
      </p>
    );
  }

  const delta = weekDeltaPct(data.weekNetInr, data.previousWeekNetInr);
  const deltaLabel =
    delta === 0 ? "0%" : delta > 0 ? `+${delta}%` : `${delta}%`;
  const maxBar = Math.max(1, ...data.dailyLast7Days.map((d) => d.netInr));

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2">
        <p className="text-[10px] font-semibold leading-snug text-amber-950">{t("wallet.dummyDataNotice")}</p>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
          {t("wallet.insightsHeading")}
        </p>
        <div className={`mt-2 grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2"}`}>
          <div className="rounded-xl border border-[var(--color-gray-100)] bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
              {t("wallet.weekNet")}
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--color-primary)]">
              {formatInr(data.weekNetInr)}
            </p>
            <p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">
              {t("wallet.vsLastWeek", { pct: deltaLabel })}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-gray-100)] bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
              {t("wallet.weekTrips")}
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--color-text-primary)]">{data.weekTrips}</p>
          </div>
        </div>
      </div>

      {!compact ? (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
            {t("wallet.chartHeading")}
          </p>
          <div className="mt-2 flex h-24 items-end justify-between gap-1 rounded-xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] px-2 pb-2 pt-3">
            {data.dailyLast7Days.map((p) => {
              const h = Math.round((p.netInr / maxBar) * 100);
              const label = new Date(p.dateIso + "T12:00:00").toLocaleDateString(dateLocaleTag, {
                weekday: "narrow",
                day: "numeric",
              });
              return (
                <div key={p.dateIso} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full max-w-[28px] rounded-t-md bg-[var(--color-primary)]/85"
                    style={{ height: `${Math.max(8, h)}%` }}
                    title={`${formatInr(p.netInr)} · ${p.trips} trips`}
                  />
                  <span className="text-[8px] font-semibold text-[var(--color-text-secondary)]">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-[var(--color-gray-100)] bg-white p-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
          {t("wallet.performanceHeading")}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-[10px] text-[var(--color-text-secondary)]">{t("wallet.acceptanceRate")}</p>
            <p className="font-bold tabular-nums text-[var(--color-text-primary)]">
              {data.performance.acceptanceRatePct}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--color-text-secondary)]">{t("wallet.missedOffers")}</p>
            <p className="font-bold tabular-nums text-[var(--color-text-primary)]">
              {data.performance.missedRequests}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-[var(--color-text-secondary)]">
          {t("wallet.tripsCompletedPeriod", { count: data.performance.completedTripsInPeriod })}
        </p>
      </div>
    </div>
  );
}

export default memo(EarningsInsightsPanelInner);
