"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useLocale } from "@/context/LocaleContext";
import { emitDriverAvailabilitySynced } from "@/lib/driver/emitDriverAvailabilitySynced";
import { formatInr } from "@/lib/formatInr";
import {
  MIN_DRIVER_WALLET_BALANCE_INR,
  isWalletBelowMinimum,
  walletShortfallToMinimum,
} from "@/lib/driver/walletConstants";
import { useDriverWalletStore } from "@/stores/driverWalletStore";

export default function DriverWalletMinimumBanner() {
  const { t } = useLocale();
  const walletBalance = useDriverWalletStore((s) => s.walletBalance);
  const payMinimumShortfall = useDriverWalletStore((s) => s.payMinimumShortfall);

  const onPay = useCallback(() => {
    const paid = payMinimumShortfall();
    if (paid <= 0) return;
    toast.success(t("dashboard.walletMinimumPaySuccess", { amount: formatInr(paid) }));
    emitDriverAvailabilitySynced();
  }, [payMinimumShortfall, t]);

  if (!isWalletBelowMinimum(walletBalance)) return null;

  const shortfall = walletShortfallToMinimum(walletBalance);

  return (
    <div
      className="rounded-xl border-2 border-amber-600/90 bg-amber-50 px-3 py-2.5 shadow-sm"
      role="alert"
    >
      <p className="text-sm font-bold text-amber-950">{t("dashboard.walletMinimumBannerTitle")}</p>
      <p className="mt-1 text-[11px] font-medium leading-snug text-amber-950/90">
        {t("dashboard.walletMinimumBannerDetail", {
          min: formatInr(MIN_DRIVER_WALLET_BALANCE_INR),
          shortfall: formatInr(shortfall),
        })}
      </p>
      <button
        type="button"
        onClick={onPay}
        className="mt-2 w-full rounded-lg bg-[var(--color-primary)] px-3 py-2 text-center text-sm font-bold text-white shadow-sm active:opacity-90"
      >
        {t("wallet.payToUnlockCta", { amount: formatInr(shortfall) })}
      </button>
      <p className="mt-1.5 text-[10px] font-medium text-amber-950/75">{t("wallet.payToUnlockNote")}</p>
    </div>
  );
}
