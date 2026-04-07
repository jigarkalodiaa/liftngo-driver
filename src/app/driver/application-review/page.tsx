"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheckIcon, SyncIcon } from "@/components/icons";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import { useDriverSelfie } from "@/context/DriverSelfieContext";
import { useDriverVehicle } from "@/context/DriverVehicleContext";
import { DRIVER_AUTH_TOKEN_KEY, DRIVER_LOGIN_PHONE_SESSION_KEY } from "@/lib/driver/authConstants";
import { isDriverSessionVerified } from "@/lib/driver/authToken";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";
import { useLocale } from "@/context/LocaleContext";

function ApplicationReviewContent() {
  const { t } = useLocale();
  const router = useRouter();
  const { clearSelfie } = useDriverSelfie();
  const { clearVehicle } = useDriverVehicle();

  useEffect(() => {
    const token = localStorage.getItem(DRIVER_AUTH_TOKEN_KEY);
    if (isDriverSessionVerified(token)) {
      router.replace(DRIVER_ONBOARDING.dashboard);
    }
  }, [router]);

  const handleSignOut = useCallback(() => {
    clearSelfie();
    clearVehicle();
    localStorage.removeItem(DRIVER_AUTH_TOKEN_KEY);
    sessionStorage.removeItem(DRIVER_LOGIN_PHONE_SESSION_KEY);
    router.replace("/driver/login");
  }, [clearSelfie, clearVehicle, router]);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-gray-50)]">
      <AppHeader title={t("applicationReview.header")} showBack={false} showMenu={false} />

      <main className="flex flex-1 flex-col px-5 py-8">
        <div className="mx-auto w-full max-w-md flex-1">
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="flex justify-center">
              <div className="flex size-[72px] items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <SyncIcon className="size-9 animate-spin [animation-duration:2.8s]" />
              </div>
            </div>

            <p className="mt-5 text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
              {t("applicationReview.docsProgress")}
            </p>
            <h1 className="mt-2 text-center text-xl font-bold leading-snug text-[var(--color-text-primary)]">
              {t("applicationReview.heading")}
            </h1>
            <p className="mt-3 text-center text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              {t("applicationReview.body1", { hours: t("applicationReview.hours24") })}
            </p>
            <p className="mt-3 text-center text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              {t("applicationReview.stayTuned")}
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#E8F5E9] px-4 py-3">
              <ShieldCheckIcon className="mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed text-[#2E7D32]">{t("applicationReview.secureNote")}</p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-[var(--color-gray-400)]">{t("applicationReview.closeHint")}</p>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 w-full text-center text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            {t("applicationReview.signOut")}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ApplicationReviewPage() {
  return (
    <AuthGuard>
      <ApplicationReviewContent />
    </AuthGuard>
  );
}
