"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/context/LocaleContext";
import { sendOtp } from "@/services/api";
import LanguageSelectStep, { LanguageSelectHeader } from "./LanguageSelectStep";
import MobileInput from "./MobileInput";
import OtpInput from "./OtpInput";

type Step = "lang" | "phone" | "otp";

export default function DriverLoginPage() {
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

    const result = await sendOtp(phone);

    if (result.ok) {
      toast.success(t("login.otpSent"));
      setStep("otp");
    } else {
      const msg = result.message || t("login.somethingWrong");
      setFieldError(msg);
      toast.error(result.code === "RATE_LIMIT" ? t("login.rateLimitSend") : msg);
    }

    setLoading(false);
  }, [phone, t]);

  const onEditPhone = useCallback(() => setStep("phone"), []);

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
          <OtpInput phone={phone} onEditPhone={onEditPhone} />
        ) : (
          <MobileInput phone={phone} onPhoneChange={setPhone} onSendOtp={onSendOtp} loading={loading} fieldError={fieldError} />
        )}
      </div>
    </div>
  );
}
