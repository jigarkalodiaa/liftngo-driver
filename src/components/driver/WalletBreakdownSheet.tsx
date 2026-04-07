"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/context/LocaleContext";
import { formatInr } from "@/lib/formatInr";
import { useShallow } from "zustand/shallow";
import { useDriverWalletStore } from "@/stores/driverWalletStore";

type WalletBreakdownSheetProps = {
  open: boolean;
  onClose: () => void;
};

export default function WalletBreakdownSheet({ open, onClose }: WalletBreakdownSheetProps) {
  const { t } = useLocale();
  const { walletBalance, todayEarnings, completedTrips } = useDriverWalletStore(
    useShallow((s) => ({
      walletBalance: s.walletBalance,
      todayEarnings: s.todayEarnings,
      completedTrips: s.completedTrips,
    })),
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label={t("wallet.close")} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-[var(--color-gray-100)] px-5 py-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t("wallet.title")}</h2>
          <p className="mt-3 text-3xl font-bold tabular-nums text-[var(--color-primary)]">{formatInr(walletBalance)}</p>
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t("wallet.balanceLabel")}</p>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">{t("wallet.todayNet")}</span>
              <span className="font-bold tabular-nums text-emerald-700">{formatInr(todayEarnings)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">{t("wallet.tripsToday")}</span>
              <span className="font-bold tabular-nums">{completedTrips}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {t("wallet.howEarningsHeading")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t("wallet.howEarningsBody")}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {t("wallet.pendingHeading")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{t("wallet.pendingBody")}</p>
          </div>
        </div>
        <div className="border-t border-[var(--color-gray-100)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white hover:opacity-95"
          >
            {t("wallet.close")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
