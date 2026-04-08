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
    <div className="pointer-events-none space-y-2 [&_button]:pointer-events-auto">
      {isReceivingTrips ? (
        <>
          <motion.div
            layout
            initial={false}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="flex w-full items-start gap-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/95 px-3 py-2 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <span className="relative mt-0.5 flex size-3 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight text-[var(--color-text-primary)]">{t("dashboard.statusOnlineTitle")}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--color-text-secondary)]">{t("dashboard.statusOnlineSub")}</p>
            </div>
          </motion.div>
          {showWaitingNudge ? (
            <div className="rounded-xl border border-sky-200/80 bg-sky-50/90 px-3 py-2 shadow-sm">
              <p className="text-xs font-bold text-sky-950">{t("dashboard.nudgeWaitingTitle")}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-sky-900/85">{t("dashboard.nudgeWaitingBody")}</p>
            </div>
          ) : null}
        </>
      ) : (
        <motion.div
          layout
          initial={false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="flex w-full items-start gap-2.5 rounded-xl border border-[var(--color-gray-200)] bg-white px-3 py-2 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <span className="relative mt-0.5 flex size-3 shrink-0 rounded-full bg-[var(--color-gray-300)] ring-2 ring-[var(--color-gray-200)]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-[var(--color-text-primary)]">{t("dashboard.statusOfflineTitle")}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--color-text-secondary)]">{t("dashboard.statusOfflineSub")}</p>
            <p className="mt-1.5 text-[11px] font-semibold leading-snug text-emerald-700">{t("dashboard.nudgeDemandHint")}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-[var(--color-text-secondary)]">{t("dashboard.nudgeBonusHint")}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default memo(DriverAvailabilityPanel);
