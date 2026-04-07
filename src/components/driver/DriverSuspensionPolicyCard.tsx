"use client";

import { memo } from "react";
import { useLocale } from "@/context/LocaleContext";
import { SUSPENSION_PERFORMANCE_THRESHOLD } from "@/lib/driver/driverSuspension";

function DriverSuspensionPolicyCard() {
  const { t } = useLocale();

  return (
    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3.5 shadow-sm">
      <p className="text-sm font-bold text-amber-950">{t("dashboard.suspensionPolicyTitle")}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-amber-950/85">
        {t("dashboard.suspensionPolicyBody", { threshold: SUSPENSION_PERFORMANCE_THRESHOLD })}
      </p>
    </div>
  );
}

export default memo(DriverSuspensionPolicyCard);
