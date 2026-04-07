"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import VerifiedDriverGuard from "@/components/layout/VerifiedDriverGuard";
import AppHeader from "@/components/layout/AppHeader";
import { useLocale } from "@/context/LocaleContext";
import { loadTripHistory, type TripHistoryEntry } from "@/lib/driver/tripHistoryStorage";

function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatWhen(ts: number, localeTag: string): string {
  return new Date(ts).toLocaleString(localeTag, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TripHistoryContent() {
  const { t, activeLocale } = useLocale();
  const [items, setItems] = useState<TripHistoryEntry[]>([]);
  const dateLocale = activeLocale === "hi" ? "hi-IN" : "en-IN";

  useEffect(() => {
    setItems(loadTripHistory());
  }, []);

  const sorted = useMemo(() => [...items].sort((a, b) => b.completedAt - a.completedAt), [items]);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-gray-50)]">
      <AppHeader title={t("tripHistoryPage.title")} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <button
          type="button"
          onClick={() => setItems(loadTripHistory())}
          className="mb-3 text-xs font-semibold text-[var(--color-primary)]"
        >
          {t("tripHistoryPage.refresh")}
        </button>
        {sorted.length === 0 ? (
          <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">{t("tripHistoryPage.empty")}</p>
        ) : (
          <ul className="mx-auto max-w-lg space-y-3">
            {sorted.map((e) => (
              <li
                key={e.id}
                className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 shadow-sm"
              >
                <p className="font-bold text-[var(--color-text-primary)]">{e.orderId}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                  <span>
                    {t("tripHistoryPage.fare")}:{" "}
                    <strong className="text-[var(--color-text-primary)]">{formatInr(e.fareInr)}</strong>
                  </span>
                  <span>
                    {t("tripHistoryPage.mode")}: <strong>{e.paymentMode}</strong>
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[var(--color-gray-400)]">
                  {t("tripHistoryPage.at")}: {formatWhen(e.completedAt, dateLocale)}
                </p>
                <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                  {t("tripHistoryPage.creditedLine", { amount: formatInr(e.driverShareInr) })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function TripHistoryPage() {
  return (
    <AuthGuard>
      <VerifiedDriverGuard>
        <TripHistoryContent />
      </VerifiedDriverGuard>
    </AuthGuard>
  );
}
