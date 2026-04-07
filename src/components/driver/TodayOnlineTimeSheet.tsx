"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { XMarkIcon } from "@/components/icons";
import { useLocale } from "@/context/LocaleContext";

type TodayOnlineTimeSheetProps = {
  open: boolean;
  onClose: () => void;
  hoursPart: number;
  minsPart: number;
};

export default function TodayOnlineTimeSheet({
  open,
  onClose,
  hoursPart,
  minsPart,
}: TodayOnlineTimeSheetProps) {
  const { t } = useLocale();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const closeLabel = t("wallet.close");

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label={closeLabel} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-[var(--color-gray-100)] px-4 py-3 pr-2">
          <div className="flex items-start justify-between gap-2">
            <h2 className="pl-1 text-lg font-bold text-[var(--color-text-primary)]">{t("dashboard.summaryHoursSheetTitle")}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-gray-100)]"
              aria-label={closeLabel}
            >
              <XMarkIcon className="size-6" />
            </button>
          </div>
          <p className="mt-2 pl-1 text-3xl font-bold tabular-nums text-[var(--color-primary)]">
            {t("dashboard.summaryHoursSheetTime", { hours: hoursPart, minutes: minsPart })}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t("dashboard.summaryHoursSheetBody")}</p>
        </div>
      </motion.div>
    </div>
  );
}
