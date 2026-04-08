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

/** Viewport-fixed bar — Go online/offline stays above the map while the dashboard scrolls. */
function DriverAvailabilityBottomCta({
  hidden,
  isReceivingTrips,
  onGoOnline,
  onGoOffline,
}: DriverAvailabilityBottomCtaProps) {
  const { t } = useLocale();

  if (hidden) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] border-t border-[var(--color-gray-200)]/90 bg-white/95 shadow-[0_-6px_24px_rgba(0,0,0,0.08)] backdrop-blur-md"
      role="region"
      aria-label={isReceivingTrips ? t("dashboard.goOfflineCta") : t("dashboard.goOnlineCta")}
    >
      <div className="pointer-events-auto mx-auto max-w-lg px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {isReceivingTrips ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={onGoOffline}
            className="flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-rose-200 bg-white py-2.5 text-sm font-bold text-rose-700 shadow-sm transition-colors hover:bg-rose-50"
          >
            {t("dashboard.goOfflineCta")}
          </motion.button>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.985 }}
            onClick={onGoOnline}
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(5,150,105,0.32)] transition-colors hover:bg-emerald-700"
          >
            {t("dashboard.goOnlineCta")}
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default memo(DriverAvailabilityBottomCta);
