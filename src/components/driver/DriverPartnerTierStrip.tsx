"use client";

import Link from "next/link";
import { memo, useEffect, useMemo } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { useLocale } from "@/context/LocaleContext";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import { getDriverTaggingFromToken } from "@/lib/driver/authToken";
import { DriverSegment } from "@/lib/driver/driverSegment";
import { performanceColorBand, performanceTextClass } from "@/lib/driver/performanceColors";
import {
  fallbackTaggingFromSession,
  useDriverPerformanceStore,
} from "@/stores/driverPerformanceStore";
import { snapshotToTagging } from "@/services/driverPerformanceApi";

type DriverPartnerTierStripProps = {
  hidden: boolean;
};

function DriverPartnerTierStripInner({ hidden }: DriverPartnerTierStripProps) {
  const { t } = useLocale();
  const fetchPerformance = useDriverPerformanceStore((s) => s.fetchPerformance);
  const serverSnapshot = useDriverPerformanceStore((s) => s.serverSnapshot);

  useEffect(() => {
    void fetchPerformance();
  }, [fetchPerformance]);

  const tagging = useMemo(() => {
    if (serverSnapshot) return snapshotToTagging(serverSnapshot);
    if (typeof window === "undefined") return null;
    return (
      getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY)) ?? fallbackTaggingFromSession()
    );
  }, [serverSnapshot]);

  const perfBand = useMemo(
    () => (tagging ? performanceColorBand(tagging.performanceScore) : "yellow"),
    [tagging],
  );
  const perfClass = performanceTextClass(perfBand);

  if (hidden || !tagging) return null;

  const isPremium = tagging.segment === DriverSegment.PREMIUM;
  const scoreStr = Number.isInteger(tagging.performanceScore)
    ? String(tagging.performanceScore)
    : tagging.performanceScore.toFixed(1);
  const cancelStr =
    tagging.cancellationRatePct % 1 === 0
      ? String(tagging.cancellationRatePct)
      : tagging.cancellationRatePct.toFixed(1);

  return (
    <Link
      href="/driver/partner-tier"
      className="pointer-events-auto flex min-h-10 w-full items-center gap-1.5 rounded-xl border border-[var(--color-gray-200)] bg-white px-2.5 py-2 text-left shadow-sm transition-colors hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-gray-50)] active:scale-[0.99]"
      aria-label={t("dashboard.partnerTierStripAria")}
    >
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          isPremium ? "bg-amber-500 text-white" : "bg-[var(--color-gray-200)] text-[var(--color-text-primary)]"
        }`}
      >
        {isPremium ? t("dashboard.partnerTierBadgePremium") : t("dashboard.partnerTierBadgeStandard")}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[var(--color-text-primary)]">
        <span className={`tabular-nums ${perfClass}`}>
          {t("dashboard.partnerTierStripScore", { score: scoreStr })}
        </span>
        <span className="mx-1.5 text-[var(--color-gray-300)]" aria-hidden>
          |
        </span>
        <span className="tabular-nums">{t("dashboard.partnerTierStripCancel", { pct: cancelStr })}</span>
      </span>
      <ArrowRightIcon className="size-4 shrink-0 text-[var(--color-text-secondary)]" />
    </Link>
  );
}

export default memo(DriverPartnerTierStripInner);
