"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLocale } from "@/context/LocaleContext";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";
import { sendOtp, type DriverType } from "@/lib/driver/loginApi";
import LanguageSelectStep, { LanguageSelectHeader } from "./LanguageSelectStep";
import MobileInput from "./MobileInput";
import OtpInput from "./OtpInput";

type Step = "lang" | "phone" | "otp";

export default function DriverLoginPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const { setLocale, t } = useLocale();

  /**
   * Always start on the language step (matches SSR + first client paint — no hydration mismatch).
   * Do not auto-skip to phone when localStorage has a locale: drivers must be able to confirm or change language.
   */
  const [step, setStep] = useState<Step>("lang");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const onSendOtp = useCallback(async () => {
    if (phone.length !== 10) return;
    setLoading(true);
    setFieldError(null);
    try {
      await sendOtp(phone);
      toast.success(t("login.otpSent"));
      setStep("otp");
    } catch (e) {
      const err = e as Error & { code?: string };
      const msg = err.message || t("login.somethingWrong");
      setFieldError(msg);
      toast.error(err.code === "RATE_LIMIT" ? t("login.rateLimitSend") : msg);
    } finally {
      setLoading(false);
    }
  }, [phone, t]);

  const onEditPhone = useCallback(() => setStep("phone"), []);

  const onVerified = useCallback(
    (driverType: DriverType, driverVerified: boolean) => {
      if (driverType === "new") {
        routerRef.current.replace(DRIVER_ONBOARDING.aadhaar);
        return;
      }
      if (driverVerified) {
        routerRef.current.replace(DRIVER_ONBOARDING.dashboard);
        return;
      }
      routerRef.current.replace(DRIVER_ONBOARDING.applicationReview);
    },
    [],
  );

  return (
    <div className="flex min-h-dvh flex-col px-5 pt-6 pb-0">
      <LanguageSelectHeader />
      <div className="flex-1">
        {step === "lang" ? (
          <LanguageSelectStep
            onChosen={(l) => {
              setLocale(l);
              setStep("phone");
            }}
          />
        ) : step === "otp" ? (
          <OtpInput phone={phone} onEditPhone={onEditPhone} onVerified={onVerified} />
        ) : (
          <MobileInput phone={phone} onPhoneChange={setPhone} onSendOtp={onSendOtp} loading={loading} fieldError={fieldError} />
        )}
      </div>
    </div>
  );
}
