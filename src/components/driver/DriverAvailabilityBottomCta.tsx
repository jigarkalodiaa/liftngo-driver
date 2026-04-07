"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/context/LocaleContext";

type DriverAvailabilityBottomCtaProps = {
  hidden: boolean;
  isReceivingTrips: boolean;
  onGoOnline: () => void;
  onGoOffline: () => void;
};

/** Pinned bottom bar for online/offline — stays visible while scrolling the dashboard. */
function DriverAvailabilityBottomCta({
  hidden,
  isReceivingTrips,
  onGoOnline,
  onGoOffline,
}: DriverAvailabilityBottomCtaProps) {
  const { t } = useLocale();

  if (hidden) return null;

  return (
    <div className="pointer-events-auto relative z-[30] shrink-0 border-t border-[var(--color-gray-200)]/90 bg-white/95 px-4 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {isReceivingTrips ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.99 }}
          onClick={onGoOffline}
          className="flex w-full items-center justify-center rounded-2xl border-2 border-rose-200 bg-white py-3.5 text-base font-bold text-rose-700 shadow-sm transition-colors hover:bg-rose-50"
        >
          {t("dashboard.goOfflineCta")}
        </motion.button>
      ) : (
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={onGoOnline}
          className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 py-3.5 text-base font-bold text-white shadow-[0_8px_24px_rgba(5,150,105,0.35)] transition-colors hover:bg-emerald-700"
        >
          {t("dashboard.goOnlineCta")}
        </motion.button>
      )}
    </div>
  );
}

export default memo(DriverAvailabilityBottomCta);
