"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import type { DriverPerformanceApiSnapshot } from "@/services/driverPerformanceApi";
import { useDriverPerformanceStore } from "@/stores/driverPerformanceStore";

function breakdownSuspendedFromSnapshot(snap: DriverPerformanceApiSnapshot | null) {
  if (!snap?.breakdownSuspended) return false;
  if (!snap.breakdownSuspendedUntil) return true;
  return Date.now() < new Date(snap.breakdownSuspendedUntil).getTime();
}

function countdownFromSnapshot(snap: DriverPerformanceApiSnapshot | null): string | null {
  if (!snap?.breakdownSuspendedUntil) return null;
  const end = new Date(snap.breakdownSuspendedUntil).getTime();
  const left = end - Date.now();
  if (left <= 0) return null;
  const h = Math.floor(left / 3_600_000);
  const m = Math.ceil((left % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function DriverBreakdownSuspensionBannerInner() {
  const { t } = useLocale();
  const serverSnapshot = useDriverPerformanceStore((s) => s.serverSnapshot);
  const fetchPerformance = useDriverPerformanceStore((s) => s.fetchPerformance);
  const [, tick] = useState(0);

  const suspended = useMemo(() => breakdownSuspendedFromSnapshot(serverSnapshot), [serverSnapshot, tick]);

  useEffect(() => {
    if (!suspended) return;
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, [suspended]);

  useEffect(() => {
    if (!suspended) return;
    const id = window.setInterval(() => {
      void fetchPerformance();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [suspended, fetchPerformance]);

  if (!suspended) return null;

  const label = countdownFromSnapshot(serverSnapshot) ?? "—";

  return (
    <div
      className="rounded-xl border-2 border-red-600/90 bg-red-50 px-3 py-2.5 shadow-sm"
      role="alert"
    >
      <p className="text-sm font-bold text-red-900">{t("dashboard.breakdownBannerTitle")}</p>
      <p className="mt-1 text-[11px] font-medium leading-snug text-red-950/90">
        {t("dashboard.breakdownBannerDetail", { countdown: label })}
      </p>
    </div>
  );
}

export default memo(DriverBreakdownSuspensionBannerInner);
