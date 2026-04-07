"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import EarningsInsightsPanel from "@/components/driver/EarningsInsightsPanel";
import AuthGuard from "@/components/layout/AuthGuard";
import VerifiedDriverGuard from "@/components/layout/VerifiedDriverGuard";
import AppHeader from "@/components/layout/AppHeader";
import { useLocale } from "@/context/LocaleContext";
import { driverEarningsDashboardQueryKey, useDriverEarningsDashboard } from "@/hooks/useDriverEarningsDashboard";
import {
  loadTripHistory,
  type TripHistoryEntry,
  type TripHistoryOutcome,
} from "@/lib/driver/tripHistoryStorage";

function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatWhen(ts: number, localeTag: string): string {
  return new Date(ts).toLocaleString(localeTag, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function outcomeBadgeClass(outcome: TripHistoryOutcome): string {
  switch (outcome) {
    case "completed":
      return "bg-emerald-100 text-emerald-900";
    case "missed":
      return "bg-amber-100 text-amber-950";
    case "cancelled":
      return "bg-[var(--color-gray-200)] text-[var(--color-text-primary)]";
    default:
      return "bg-[var(--color-gray-100)] text-[var(--color-text-secondary)]";
  }
}

function outcomeLabelKey(outcome: TripHistoryOutcome): string {
  switch (outcome) {
    case "completed":
      return "tripHistoryPage.outcomeCompleted";
    case "missed":
      return "tripHistoryPage.outcomeMissed";
    case "cancelled":
      return "tripHistoryPage.outcomeCancelled";
    default:
      return "tripHistoryPage.outcomeCompleted";
  }
}

function TripHistoryContent() {
  const { t, activeLocale } = useLocale();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<TripHistoryEntry[]>([]);
  const dateLocale = activeLocale === "hi" ? "hi-IN" : "en-IN";
  const insights = useDriverEarningsDashboard(true);

  useEffect(() => {
    setItems(loadTripHistory());
  }, []);

  const sorted = useMemo(() => [...items].sort((a, b) => b.completedAt - a.completedAt), [items]);

  const refreshAll = () => {
    setItems(loadTripHistory());
    void queryClient.invalidateQueries({ queryKey: driverEarningsDashboardQueryKey });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-gray-50)]">
      <AppHeader title={t("tripHistoryPage.title")} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <button
          type="button"
          onClick={refreshAll}
          className="mb-3 text-xs font-semibold text-[var(--color-primary)]"
        >
          {t("tripHistoryPage.refresh")}
        </button>
        <div className="mx-auto mb-5 max-w-lg">
          <p className="mb-2 text-sm font-bold text-[var(--color-text-primary)]">{t("tripHistoryPage.insightsTitle")}</p>
          <EarningsInsightsPanel
            data={insights.data}
            isLoading={insights.isLoading}
            isError={insights.isError}
            compact
            t={t}
            dateLocaleTag={dateLocale}
          />
        </div>
        {sorted.length === 0 ? (
          <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">{t("tripHistoryPage.empty")}</p>
        ) : (
          <ul className="mx-auto max-w-lg space-y-3">
            {sorted.map((e) => (
              <li
                key={e.id}
                className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 font-bold text-[var(--color-text-primary)]">{e.orderId}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${outcomeBadgeClass(e.outcome)}`}
                  >
                    {t(outcomeLabelKey(e.outcome))}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                  <span>
                    {t("tripHistoryPage.fare")}:{" "}
                    <strong className="text-[var(--color-text-primary)]">{formatInr(e.fareInr)}</strong>
                  </span>
                  <span>
                    {t("tripHistoryPage.mode")}: <strong>{e.paymentMode}</strong>
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[var(--color-gray-400)]">
                  {e.outcome === "completed" ? t("tripHistoryPage.at") : t("tripHistoryPage.atRecorded")}:{" "}
                  {formatWhen(e.completedAt, dateLocale)}
                </p>
                {e.outcome === "completed" ? (
                  <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                    {t("tripHistoryPage.creditedLine", { amount: formatInr(e.driverShareInr) })}
                  </p>
                ) : e.outcome === "missed" ? (
                  <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">{t("tripHistoryPage.missedDetail")}</p>
                ) : (
                  <>
                    <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                      {t("tripHistoryPage.cancelledDetail")}
                    </p>
                    {e.cancelReason ? (
                      <p className="mt-1 text-[11px] text-[var(--color-text-primary)]">
                        {t("tripHistoryPage.cancelledReason", { reason: e.cancelReason })}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">{t("tripHistoryPage.noEarnings")}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function TripHistoryPage() {
  return (
    <AuthGuard>
      <VerifiedDriverGuard>
        <TripHistoryContent />
      </VerifiedDriverGuard>
    </AuthGuard>
  );
}
