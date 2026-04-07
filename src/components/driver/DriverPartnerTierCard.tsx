"use client";

import { memo, useMemo } from "react";
import { useLocale } from "@/context/LocaleContext";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import { getDriverTaggingFromToken } from "@/lib/driver/authToken";
import {
  DriverSegment,
  PREMIUM_MAX_CANCELLATION_RATE_PCT,
  PREMIUM_MIN_PERFORMANCE_SCORE,
} from "@/lib/driver/driverSegment";

type DriverPartnerTierCardProps = {
  hidden: boolean;
};

function CriterionRow({
  label,
  valueLine,
  requirementLine,
  met,
  metLabel,
  notMetLabel,
}: {
  label: string;
  valueLine: string;
  requirementLine: string;
  met: boolean;
  metLabel: string;
  notMetLabel: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-gray-200)] bg-white px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">{valueLine}</p>
      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{requirementLine}</p>
      <p
        className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
          met ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
        }`}
      >
        {met ? metLabel : notMetLabel}
      </p>
    </div>
  );
}

function DriverPartnerTierCardInner({ hidden }: DriverPartnerTierCardProps) {
  const { t } = useLocale();

  const tagging = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY));
  }, []);

  if (hidden || !tagging) return null;

  const perfOk = tagging.performanceScore >= PREMIUM_MIN_PERFORMANCE_SCORE;
  const cancelOk = tagging.cancellationRatePct < PREMIUM_MAX_CANCELLATION_RATE_PCT;
  const isPremium = tagging.segment === DriverSegment.PREMIUM;

  const scoreStr = Number.isInteger(tagging.performanceScore)
    ? String(tagging.performanceScore)
    : tagging.performanceScore.toFixed(1);
  const cancelStr =
    tagging.cancellationRatePct % 1 === 0
      ? String(tagging.cancellationRatePct)
      : tagging.cancellationRatePct.toFixed(1);

  return (
    <div
      className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-sm ${
        isPremium
          ? "border-amber-200/90 bg-gradient-to-br from-amber-50/90 to-white"
          : "border-[var(--color-gray-200)] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{t("dashboard.partnerTierTitle")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {t("dashboard.partnerTierSubtitle")}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            isPremium ? "bg-amber-500 text-white" : "bg-[var(--color-gray-200)] text-[var(--color-text-primary)]"
          }`}
        >
          {isPremium ? t("dashboard.partnerTierBadgePremium") : t("dashboard.partnerTierBadgeStandard")}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <CriterionRow
          label={t("dashboard.partnerTierPerformance")}
          valueLine={t("dashboard.partnerTierScoreValue", { score: scoreStr })}
          requirementLine={t("dashboard.partnerTierPerformanceNeed", {
            min: PREMIUM_MIN_PERFORMANCE_SCORE,
          })}
          met={perfOk}
          metLabel={t("dashboard.partnerTierMet")}
          notMetLabel={t("dashboard.partnerTierNotMet")}
        />
        <CriterionRow
          label={t("dashboard.partnerTierCancellation")}
          valueLine={t("dashboard.partnerTierCancelValue", { pct: cancelStr })}
          requirementLine={t("dashboard.partnerTierCancelNeed", {
            max: PREMIUM_MAX_CANCELLATION_RATE_PCT,
          })}
          met={cancelOk}
          metLabel={t("dashboard.partnerTierMet")}
          notMetLabel={t("dashboard.partnerTierNotMet")}
        />
      </div>

      <div className="mt-3 rounded-xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] px-3 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
          {t("dashboard.partnerTierRulesHeading")}
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-[var(--color-text-primary)]">
          <li>{t("dashboard.partnerTierRule1", { min: PREMIUM_MIN_PERFORMANCE_SCORE })}</li>
          <li>{t("dashboard.partnerTierRule2", { max: PREMIUM_MAX_CANCELLATION_RATE_PCT })}</li>
        </ul>
      </div>

      <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-900">
          {t("dashboard.partnerTierBenefitsHeading")}
        </p>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-emerald-950/90">
          <li className="flex gap-2">
            <span className="font-bold text-emerald-700">·</span>
            <span>{t("dashboard.partnerTierBenefit1")}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-emerald-700">·</span>
            <span>{t("dashboard.partnerTierBenefit2")}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-emerald-700">·</span>
            <span>{t("dashboard.partnerTierBenefit3")}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default memo(DriverPartnerTierCardInner);
