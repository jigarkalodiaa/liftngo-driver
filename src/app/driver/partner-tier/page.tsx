"use client";

import { useMemo } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import VerifiedDriverGuard from "@/components/layout/VerifiedDriverGuard";
import AppHeader from "@/components/layout/AppHeader";
import DriverSuspensionPolicyCard from "@/components/driver/DriverSuspensionPolicyCard";
import PartnerTierDetailBody from "@/components/driver/PartnerTierDetailBody";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import { getDriverTaggingFromToken } from "@/lib/driver/authToken";
import { useLocale } from "@/context/LocaleContext";

function PartnerTierContent() {
  const { t } = useLocale();

  const tagging = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY));
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-gray-50)]">
      <AppHeader title={t("dashboard.partnerTierPageTitle")} showMenu={false} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tagging ? (
          <>
            <PartnerTierDetailBody tagging={tagging} />
            <div className="mt-4">
              <DriverSuspensionPolicyCard />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t("dashboard.partnerTierUnavailable")}
            </p>
            <DriverSuspensionPolicyCard />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PartnerTierPage() {
  return (
    <AuthGuard>
      <VerifiedDriverGuard>
        <PartnerTierContent />
      </VerifiedDriverGuard>
    </AuthGuard>
  );
}
