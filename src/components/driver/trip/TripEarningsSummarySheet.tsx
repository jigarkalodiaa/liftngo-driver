"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/context/LocaleContext";
import { PaymentMode } from "@/lib/trip/tripStatus";

export type TripEarningsSummaryPayload = {
  orderId: string;
  fareInr: number;
  paymentMode: PaymentMode;
  driverShare: number;
  walletDelta: number;
};

function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

type TripEarningsSummarySheetProps = {
  open: boolean;
  onClose: () => void;
  data: TripEarningsSummaryPayload | null;
};

export default function TripEarningsSummarySheet({ open, onClose, data }: TripEarningsSummarySheetProps) {
  const { t } = useLocale();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !data) return null;

  const netLabel =
    data.walletDelta >= 0
      ? t("tripUX.earningsNetCredit", { amount: formatInr(data.walletDelta) })
      : t("tripUX.earningsNetDeduct", { amount: formatInr(Math.abs(data.walletDelta)) });

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label={t("tripUX.earningsClose")} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-[var(--color-gray-100)] bg-[var(--color-primary)]/10 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
            {t("tripUX.earningsTitle")}
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">{data.orderId}</p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">{t("tripUX.earningsTripFare")}</span>
            <span className="font-bold tabular-nums text-[var(--color-text-primary)]">{formatInr(data.fareInr)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">{t("tripUX.earningsYouEarned")}</span>
            <span className="font-bold tabular-nums text-emerald-700">{formatInr(data.driverShare)}</span>
          </div>
          <div className="rounded-xl bg-[var(--color-gray-50)] px-3 py-3 text-sm font-semibold text-[var(--color-text-primary)]">
            {netLabel}
          </div>
          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {data.paymentMode === PaymentMode.CASH ? t("tripUX.earningsCashNote") : t("tripUX.earningsPrepaidNote")}
          </p>
        </div>
        <div className="border-t border-[var(--color-gray-100)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-bold text-white hover:opacity-95"
          >
            {t("tripUX.earningsDone")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
