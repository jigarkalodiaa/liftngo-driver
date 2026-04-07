"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/context/LocaleContext";
import { formatInr } from "@/lib/formatInr";
import { useShallow } from "zustand/shallow";
import { useDriverWalletStore } from "@/stores/driverWalletStore";

const DAILY_TRIP_GOAL = 8;

function formatSummaryDate(d: Date, localeTag: string): string {
  return d.toLocaleDateString(localeTag, { month: "short", day: "numeric", year: "numeric" });
}

type DashboardWalletSummaryProps = {
  onOpen: () => void;
};

function DashboardWalletSummaryInner({ onOpen }: DashboardWalletSummaryProps) {
  const { t, activeLocale } = useLocale();
  const dateLocale = activeLocale === "hi" ? "hi-IN" : "en-IN";
  const { walletBalance, todayEarnings, completedTrips } = useDriverWalletStore(
    useShallow((s) => ({
      walletBalance: s.walletBalance,
      todayEarnings: s.todayEarnings,
      completedTrips: s.completedTrips,
    })),
  );

  const minutesOnline = 0;
  const hoursPart = Math.floor(minutesOnline / 60);
  const minsPart = minutesOnline % 60;

  const tripWord = useMemo(
    () =>
      activeLocale === "en" ? (completedTrips === 1 ? "trip" : "trips") : t("common.trip"),
    [activeLocale, completedTrips, t],
  );

  const now = new Date();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-[var(--color-gray-200)]/80 bg-white p-4 text-left shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-transform active:scale-[0.99]"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-[var(--color-primary)]">{t("dashboard.todaySummary")}</h2>
        <time className="text-xs font-medium text-[var(--color-text-secondary)]" dateTime={now.toISOString()}>
          {formatSummaryDate(now, dateLocale)}
        </time>
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
        {t("dashboard.walletTrips", {
          wallet: formatInr(walletBalance),
          count: completedTrips,
          tripWord,
        })}
      </p>
      <p className="mt-1 text-[10px] font-medium text-[var(--color-primary)]">{t("dashboard.walletTapHint")}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)]">
            {t("dashboard.earnings")}
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-[var(--color-primary)]">{formatInr(todayEarnings)}</p>
        </div>
        <div className="border-x border-[var(--color-gray-200)] text-center">
          <p className="text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)]">
            {t("dashboard.trips")}
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-[var(--color-primary)]">{completedTrips}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)]">
            {t("dashboard.hours")}
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-[var(--color-primary)]">
            {hoursPart}h {minsPart}m
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2 border-t border-[var(--color-gray-100)] pt-3">
        <div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
            <span>{t("dashboard.targetTitle")}</span>
            <span>{t("dashboard.targetSub", { done: completedTrips, goal: DAILY_TRIP_GOAL })}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--color-gray-200)]">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={false}
              animate={{
                width: `${Math.min(100, (completedTrips / DAILY_TRIP_GOAL) * 100)}%`,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-[var(--color-gray-50)] px-3 py-2">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{t("dashboard.ratingLabel")}</span>
          <span className="text-sm font-bold text-amber-600">{t("dashboard.ratingValue", { stars: "4.8" })}</span>
        </div>
      </div>
    </button>
  );
}

export default memo(DashboardWalletSummaryInner);
