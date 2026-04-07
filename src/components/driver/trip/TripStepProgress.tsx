"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/context/LocaleContext";
import { tripProgressFraction } from "@/lib/trip/tripStepModel";
import { TripStatus } from "@/lib/trip/tripStatus";

const STEP_KEYS = [
  "tripUX.stepPickup",
  "tripUX.stepLoad",
  "tripUX.stepTrip",
  "tripUX.stepDrop",
  "tripUX.stepPay",
] as const;

type TripStepProgressProps = {
  status: TripStatus;
};

/** Maps coarse UI segments onto status (no transition logic). */
function segmentIndex(status: TripStatus): number {
  switch (status) {
    case TripStatus.ASSIGNED:
    case TripStatus.EN_ROUTE_TO_PICKUP:
    case TripStatus.ARRIVED_AT_PICKUP:
      return 0;
    case TripStatus.LOADING_CONFIRMED:
      return 1;
    case TripStatus.TRIP_STARTED:
    case TripStatus.EN_ROUTE_TO_DROP:
      return 2;
    case TripStatus.ARRIVED_AT_DROP:
    case TripStatus.UNLOADING_CONFIRMED:
      return 3;
    case TripStatus.PAYMENT_PENDING:
    case TripStatus.PAYMENT_COMPLETED:
      return 4;
    default:
      return 4;
  }
}

export default function TripStepProgress({ status }: TripStepProgressProps) {
  const { t } = useLocale();
  const fill = tripProgressFraction(status);
  const activeSeg = segmentIndex(status);

  return (
    <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-3 shadow-sm">
      <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-[var(--color-gray-200)]">
        <motion.div
          className="h-full rounded-full bg-[var(--color-primary)]"
          initial={false}
          animate={{ width: `${Math.round(fill * 100)}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="flex justify-between gap-1 text-[9px] font-bold uppercase leading-tight text-[var(--color-text-secondary)]">
        {STEP_KEYS.map((key, i) => (
          <span
            key={key}
            className={`flex-1 text-center ${i <= activeSeg ? "text-[var(--color-primary)]" : ""}`}
          >
            {t(key)}
          </span>
        ))}
      </div>
    </div>
  );
}
