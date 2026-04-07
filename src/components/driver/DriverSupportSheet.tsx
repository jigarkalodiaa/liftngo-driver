"use client";

import { useEffect } from "react";
import { XMarkIcon } from "@/components/icons";
import { useLocale } from "@/context/LocaleContext";

/** Placeholder helpline — replace with your real support number. */
const SUPPORT_TEL = "+9118001234567";
const SUPPORT_MAIL = "driver-help@liftngo.com";

type DriverSupportSheetProps = {
  open: boolean;
  onClose: () => void;
};

export default function DriverSupportSheet({ open, onClose }: DriverSupportSheetProps) {
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

  const closeLabel = t("dashboard.supportClose");

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label={closeLabel} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-support-title"
        className="relative w-full max-w-md rounded-2xl bg-white p-5 pb-4 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id="driver-support-title" className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("dashboard.supportTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-gray-100)]"
            aria-label={closeLabel}
          >
            <XMarkIcon className="size-6" />
          </button>
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{t("dashboard.supportIntro")}</p>

        <div className="mt-5 space-y-3">
          <a
            href={`tel:${SUPPORT_TEL}`}
            className="flex w-full items-center justify-center rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-bold text-white hover:opacity-95"
          >
            {t("dashboard.supportCall")}
          </a>
          <a
            href={`mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent("LiftNGo Driver support")}`}
            className="flex w-full items-center justify-center rounded-xl border-2 border-[var(--color-primary)] py-3.5 text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
          >
            {t("dashboard.supportEmail")}
          </a>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">{t("dashboard.supportHours")}</p>
      </div>
    </div>
  );
}
