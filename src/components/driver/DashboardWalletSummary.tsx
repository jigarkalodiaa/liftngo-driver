"use client";

import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/context/LocaleContext";
import { formatInr } from "@/lib/formatInr";
import { useShallow } from "zustand/shallow";
import { engagedTimeMinutesParts, useDriverEngagedTimeStore } from "@/stores/driverEngagedTimeStore";
import { useDriverWalletStore } from "@/stores/driverWalletStore";
import TodayOnlineTimeSheet from "@/components/driver/TodayOnlineTimeSheet";

const DAILY_TRIP_GOAL = 8;

function formatSummaryDate(d: Date, localeTag: string): string {
  return d.toLocaleDateString(localeTag, { month: "short", day: "numeric", year: "numeric" });
}

type DashboardWalletSummaryProps = {
  onOpenWallet: () => void;
  onOpenPartnerTier: () => void;
  onOpenTripHistory: () => void;
};

const hitTarget =
  "flex w-full cursor-pointer rounded-xl text-left transition-colors hover:bg-[var(--color-gray-50)]/95 active:bg-[var(--color-gray-100)]/80";

function DashboardWalletSummaryInner({
  onOpenWallet,
  onOpenPartnerTier,
  onOpenTripHistory,
}: DashboardWalletSummaryProps) {
  const { t, activeLocale } = useLocale();
  const dateLocale = activeLocale === "hi" ? "hi-IN" : "en-IN";
  const [hoursSheetOpen, setHoursSheetOpen] = useState(false);
  const { walletBalance, todayEarnings, completedTrips } = useDriverWalletStore(
    useShallow((s) => ({
      walletBalance: s.walletBalance,
      todayEarnings: s.todayEarnings,
      completedTrips: s.completedTrips,
    })),
  );
  const todayEngagedSeconds = useDriverEngagedTimeStore((s) => s.todaySeconds);
  const { hours: hoursPart, minutes: minsPart } = useMemo(
    () => engagedTimeMinutesParts(todayEngagedSeconds),
    [todayEngagedSeconds],
  );

  const tripWord = useMemo(
    () =>
      activeLocale === "en" ? (completedTrips === 1 ? "trip" : "trips") : t("common.trip"),
    [activeLocale, completedTrips, t],
  );

  const now = new Date();

  return (
    <>
      <TodayOnlineTimeSheet
        open={hoursSheetOpen}
        onClose={() => setHoursSheetOpen(false)}
        hoursPart={hoursPart}
        minsPart={minsPart}
      />
      <div className="w-full overflow-hidden rounded-2xl border border-[var(--color-gray-200)]/80 bg-white text-left shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <button
          type="button"
          onClick={onOpenWallet}
          className={`${hitTarget} px-4 pb-3 pt-4`}
          aria-label={t("dashboard.summaryWalletSectionAria")}
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
        </button>

        <div className="grid grid-cols-3 gap-0 border-t border-[var(--color-gray-100)] px-1 py-2">
          <button
            type="button"
            onClick={onOpenWallet}
            className={`${hitTarget} flex-col items-center px-1 py-2`}
            aria-label={t("dashboard.summaryEarningsAria")}
          >
            <p className="text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)]">
              {t("dashboard.earnings")}
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-[var(--color-primary)]">{formatInr(todayEarnings)}</p>
          </button>
          <button
            type="button"
            onClick={onOpenTripHistory}
            className={`${hitTarget} flex-col items-center border-x border-[var(--color-gray-200)] px-1 py-2`}
            aria-label={t("dashboard.summaryTripsAria")}
          >
            <p className="text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)]">
              {t("dashboard.trips")}
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-[var(--color-primary)]">{completedTrips}</p>
          </button>
          <button
            type="button"
            onClick={() => setHoursSheetOpen(true)}
            className={`${hitTarget} flex-col items-center px-1 py-2`}
            aria-label={t("dashboard.summaryHoursAria")}
          >
            <p className="text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)]">
              {t("dashboard.hours")}
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-[var(--color-primary)]">
              {hoursPart}h {minsPart}m
            </p>
          </button>
        </div>

        <div className="space-y-2 border-t border-[var(--color-gray-100)] px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={onOpenPartnerTier}
            className={`${hitTarget} w-full space-y-2 p-2`}
            aria-label={t("dashboard.summaryTargetAria")}
          >
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
          </button>
          <button
            type="button"
            onClick={onOpenPartnerTier}
            className={`${hitTarget} flex w-full items-center justify-between rounded-xl bg-[var(--color-gray-50)] px-3 py-2 hover:bg-[var(--color-gray-100)]/80`}
            aria-label={t("dashboard.summaryRatingAria")}
          >
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{t("dashboard.ratingLabel")}</span>
            <span className="text-sm font-bold text-amber-600">{t("dashboard.ratingValue", { stars: "4.8" })}</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default memo(DashboardWalletSummaryInner);
