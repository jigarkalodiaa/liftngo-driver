"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/context/LocaleContext";

type DriverAvailabilityPanelProps = {
  /** Hide entire panel during active trip — driver is engaged; no online/offline confusion. */
  hidden: boolean;
  isReceivingTrips: boolean;
  /** Show “waiting for trips” nudge (online, not showing order sheet). */
  showWaitingNudge: boolean;
};

function DriverAvailabilityPanel({
  hidden,
  isReceivingTrips,
  showWaitingNudge,
}: DriverAvailabilityPanelProps) {
  const { t } = useLocale();

  if (hidden) return null;

  return (
    <div className="pointer-events-none space-y-3 [&_button]:pointer-events-auto">
      {/* 1 — Status strip (always visible in idle mode) */}
      <motion.div
        layout
        initial={false}
        animate={{
          scale: 1,
        }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
          isReceivingTrips
            ? "border-emerald-200/90 bg-emerald-50/95"
            : "border-[var(--color-gray-200)] bg-white"
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="relative mt-0.5 flex size-3.5 shrink-0">
          {isReceivingTrips ? (
            <>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 opacity-75" />
              <span className="relative inline-flex size-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            </>
          ) : (
            <span className="relative inline-flex size-3.5 rounded-full bg-[var(--color-gray-300)] ring-2 ring-[var(--color-gray-200)]" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-tight text-[var(--color-text-primary)]">
            {isReceivingTrips ? t("dashboard.statusOnlineTitle") : t("dashboard.statusOfflineTitle")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {isReceivingTrips ? t("dashboard.statusOnlineSub") : t("dashboard.statusOfflineSub")}
          </p>
        </div>
      </motion.div>

      {/* 2 — Context card */}
      {isReceivingTrips ? (
        showWaitingNudge ? (
          <div className="rounded-2xl border border-sky-200/80 bg-sky-50/90 px-4 py-3.5 shadow-sm">
            <p className="text-sm font-bold text-sky-950">{t("dashboard.nudgeWaitingTitle")}</p>
            <p className="mt-1 text-xs leading-relaxed text-sky-900/85">{t("dashboard.nudgeWaitingBody")}</p>
          </div>
        ) : null
      ) : (
        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-4 py-3.5 shadow-sm">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">{t("dashboard.nudgeOfflineTitle")}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {t("dashboard.nudgeOfflineBody")}
          </p>
          <p className="mt-2 text-xs font-semibold text-emerald-700">{t("dashboard.nudgeDemandHint")}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{t("dashboard.nudgeBonusHint")}</p>
        </div>
      )}
    </div>
  );
}

export default memo(DriverAvailabilityPanel);
