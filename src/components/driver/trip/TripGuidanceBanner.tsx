"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/context/LocaleContext";
import { TripStatus } from "@/lib/trip/tripStatus";

type TripGuidanceBannerProps = {
  status: TripStatus;
};

function keysForStatus(status: TripStatus): { now: string; next: string } {
  const map: Partial<Record<TripStatus, { now: string; next: string }>> = {
    [TripStatus.ASSIGNED]: { now: "tripUX.guideAssignedNow", next: "tripUX.guideAssignedNext" },
    [TripStatus.EN_ROUTE_TO_PICKUP]: {
      now: "tripUX.guideEnRoutePickupNow",
      next: "tripUX.guideEnRoutePickupNext",
    },
    [TripStatus.ARRIVED_AT_PICKUP]: {
      now: "tripUX.guideArrivedPickupNow",
      next: "tripUX.guideArrivedPickupNext",
    },
    [TripStatus.LOADING_CONFIRMED]: { now: "tripUX.guideLoadingNow", next: "tripUX.guideLoadingNext" },
    [TripStatus.TRIP_STARTED]: { now: "tripUX.guideTripStartedNow", next: "tripUX.guideTripStartedNext" },
    [TripStatus.EN_ROUTE_TO_DROP]: { now: "tripUX.guideEnRouteDropNow", next: "tripUX.guideEnRouteDropNext" },
    [TripStatus.ARRIVED_AT_DROP]: { now: "tripUX.guideArrivedDropNow", next: "tripUX.guideArrivedDropNext" },
    [TripStatus.UNLOADING_CONFIRMED]: { now: "tripUX.guideUnloadingNow", next: "tripUX.guideUnloadingNext" },
    [TripStatus.PAYMENT_PENDING]: {
      now: "tripUX.guidePaymentPendingNow",
      next: "tripUX.guidePaymentPendingNext",
    },
    [TripStatus.PAYMENT_COMPLETED]: {
      now: "tripUX.guidePaymentDoneNow",
      next: "tripUX.guidePaymentDoneNext",
    },
  };
  return map[status] ?? { now: "tripUX.guideDefaultNow", next: "tripUX.guideDefaultNext" };
}

export default function TripGuidanceBanner({ status }: TripGuidanceBannerProps) {
  const { t } = useLocale();
  const { now, next } = keysForStatus(status);

  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4 shadow-sm"
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
        {t("tripUX.guideNowLabel")}
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{t(now)}</p>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
        {t("tripUX.guideNextLabel")}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{t(next)}</p>
    </motion.div>
  );
}
