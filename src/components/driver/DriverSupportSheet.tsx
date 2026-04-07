"use client";

import { useEffect } from "react";
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

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label={t("dashboard.supportClose")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-support-title"
        className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 id="driver-support-title" className="text-lg font-bold text-[var(--color-text-primary)]">
          {t("dashboard.supportTitle")}
        </h2>
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

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-[var(--color-gray-200)] py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-gray-50)]"
        >
          {t("dashboard.supportClose")}
        </button>
      </div>
    </div>
  );
}
