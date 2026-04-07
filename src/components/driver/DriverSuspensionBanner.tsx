"use client";

import { memo, useMemo } from "react";
import { useLocale } from "@/context/LocaleContext";
import { formatSuspensionEndDate } from "@/lib/driver/driverSuspension";
import { useDriverSuspensionStore } from "@/stores/driverSuspensionStore";

function localeToTag(active: string): string {
  return active === "hi" ? "hi-IN" : "en-IN";
}

function DriverSuspensionBanner() {
  const { t, activeLocale } = useLocale();
  const permanent = useDriverSuspensionStore((s) => s.permanent);
  const suspendedUntilMs = useDriverSuspensionStore((s) => s.suspendedUntilMs);

  const dateLabel = useMemo(() => {
    if (!suspendedUntilMs) return "";
    return formatSuspensionEndDate(suspendedUntilMs, localeToTag(activeLocale));
  }, [suspendedUntilMs, activeLocale]);

  if (!permanent && (suspendedUntilMs == null || Date.now() >= suspendedUntilMs)) {
    return null;
  }

  return (
    <div
      className="rounded-2xl border-2 border-red-600/90 bg-red-50 px-4 py-3.5 shadow-sm"
      role="alert"
    >
      <p className="text-[15px] font-bold text-red-900">{t("dashboard.suspensionBannerTitle")}</p>
      <p className="mt-1.5 text-xs font-medium leading-relaxed text-red-950/90">
        {permanent
          ? t("dashboard.suspensionBannerPermanentDetail")
          : t("dashboard.suspensionBannerUntilDetail", { date: dateLabel })}
      </p>
    </div>
  );
}

export default memo(DriverSuspensionBanner);
