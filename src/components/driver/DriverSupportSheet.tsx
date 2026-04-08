"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { XMarkIcon } from "@/components/icons";
import { useLocale } from "@/context/LocaleContext";

const HelpChatbot = dynamic(() => import("@/components/HelpChatbot"), { ssr: false });

/** Placeholder helpline — replace with your real support number. */
const SUPPORT_TEL = "+9118001234567";
const SUPPORT_MAIL = "driver-help@liftngo.com";

type DriverSupportSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Active trip: trip-focused chatbot root, no helpline call button. */
  variant?: "default" | "trip";
};

export default function DriverSupportSheet({ open, onClose, variant = "default" }: DriverSupportSheetProps) {
  const { t } = useLocale();
  const isTrip = variant === "trip";

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
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label={closeLabel} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-support-title"
        className="relative flex max-h-[min(640px,88dvh)] w-full max-w-md flex-col rounded-2xl bg-white p-5 pb-4 shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-2">
          <h2 id="driver-support-title" className="text-lg font-bold text-[var(--color-text-primary)]">
            {isTrip ? t("dashboard.supportTitleTrip") : t("dashboard.supportTitle")}
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
        <p className="mt-1 shrink-0 text-xs leading-snug text-[var(--color-text-secondary)]">
          {isTrip ? t("dashboard.supportIntroTrip") : t("dashboard.supportIntro")}
        </p>

        <div className="mt-3 min-h-0 flex-1">
          <HelpChatbot
            active={open}
            entry={isTrip ? "trip_journey" : "default"}
            className="max-h-[min(420px,55dvh)]"
          />
        </div>

        <div className="mt-4 shrink-0 border-t border-[var(--color-gray-100)] pt-3">
          <p className="text-center text-[11px] font-semibold text-[var(--color-text-secondary)]">
            {isTrip ? t("dashboard.supportEscalationTrip") : t("dashboard.supportEscalation")}
          </p>
          <div
            className={`mt-2 flex flex-col gap-2 ${isTrip ? "" : "sm:flex-row"}`}
          >
            {isTrip ? null : (
              <a
                href={`tel:${SUPPORT_TEL}`}
                className="flex flex-1 items-center justify-center rounded-xl bg-[var(--color-primary)] py-2.5 text-xs font-bold text-white hover:opacity-95"
              >
                {t("dashboard.supportCall")}
              </a>
            )}
            <a
              href={`mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent("LiftNGo Driver support")}`}
              className={`flex items-center justify-center rounded-xl border-2 border-[var(--color-primary)] py-2.5 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 ${isTrip ? "w-full" : "flex-1"}`}
            >
              {t("dashboard.supportEmail")}
            </a>
          </div>
          <p className="mt-2 text-center text-[10px] text-[var(--color-text-secondary)]">{t("dashboard.supportHours")}</p>
        </div>
      </div>
    </div>
  );
}
