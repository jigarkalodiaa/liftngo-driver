"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { PencilIcon } from "@/components/icons";
import BottomCta from "@/components/layout/BottomCta";
import { useLocale } from "@/context/LocaleContext";
import { DRIVER_AUTH_TOKEN_KEY, DRIVER_LOGIN_PHONE_SESSION_KEY } from "@/lib/driver/authConstants";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";
import { resendOtp } from "@/lib/driver/loginApi";
import { toast } from "sonner";

const OTP_LEN = 4;
const RESEND_SEC = 30;

type OtpInputProps = {
  phone: string;
  onEditPhone: () => void;
};

export default function OtpInput({ phone, onEditPhone }: OtpInputProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LEN).fill(""));
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [secondsLeft, setSecondsLeft] = useState(RESEND_SEC);
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const otpValue = digits.join("");
  const otpComplete = otpValue.length === OTP_LEN;

  const onDigitChange = useCallback(
    (index: number, raw: string) => {
      setFieldError(null);
      const v = raw.replace(/\D/g, "");
      if (v.length === 0) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
        return;
      }
      if (v.length >= OTP_LEN) {
        const pasted = v.slice(0, OTP_LEN).split("");
        const next = Array(OTP_LEN).fill("").map((_, i) => pasted[i] ?? "");
        setDigits(next);
        const lastFilled = next.findIndex((d) => !d);
        const focusAt = lastFilled === -1 ? OTP_LEN - 1 : lastFilled;
        setActive(focusAt);
        requestAnimationFrame(() => inputsRef.current[focusAt]?.focus());
        return;
      }
      const char = v.slice(-1);
      const next = [...digits];
      next[index] = char;
      setDigits(next);
      if (char && index < OTP_LEN - 1) {
        const ni = index + 1;
        setActive(ni);
        inputsRef.current[ni]?.focus();
      }
    },
    [digits],
  );

  const onKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        setActive(index - 1);
        inputsRef.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const onPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!text) return;
    const next = Array(OTP_LEN).fill("").map((_, i) => text[i] ?? "");
    setDigits(next);
    setFieldError(null);
    const focusAt = Math.min(text.length, OTP_LEN) - 1;
    setActive(focusAt >= 0 ? focusAt : 0);
    requestAnimationFrame(() => inputsRef.current[focusAt >= 0 ? focusAt : 0]?.focus());
  }, []);

  const handleVerify = async () => {
    if (!otpComplete) {
      setFieldError(t("login.enterOtpError"));
      return;
    }
    setLoading(true);
    setFieldError(null);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        mobile: phone,
        otp: otpValue,
      });
      if (result?.error) {
        const msg =
          result.error === "CredentialsSignin" ? t("login.verifyFail") : result.error;
        setFieldError(msg);
        toast.error(msg);
        return;
      }
      const session = await getSession();
      if (typeof window !== "undefined") {
        if (session?.accessToken) {
          localStorage.setItem(DRIVER_AUTH_TOKEN_KEY, session.accessToken);
        }
        sessionStorage.setItem(DRIVER_LOGIN_PHONE_SESSION_KEY, phone);
      }
      toast.success(t("login.signedIn"));
      router.replace(DRIVER_ONBOARDING.dashboard);
    } catch (err) {
      const e = err as Error & { code?: string };
      const msg = e.message || t("login.verifyFail");
      setFieldError(msg);
      toast.error(e.code === "RATE_LIMIT" ? t("login.rateLimitVerify") : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    setResendLoading(true);
    try {
      await resendOtp(phone);
      toast.success(t("login.newOtpSent"));
      setDigits(Array(OTP_LEN).fill(""));
      setFieldError(null);
      setSecondsLeft(RESEND_SEC);
      setActive(0);
      requestAnimationFrame(() => inputsRef.current[0]?.focus());
    } catch (err) {
      const e = err as Error & { code?: string };
      toast.error(
        e.code === "RATE_LIMIT" ? t("login.rateLimitResend") : e.message || t("login.resendFail"),
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1">
        <h1 className="text-[1.65rem] font-bold leading-tight text-[var(--color-text-primary)]">
          {t("login.otpTitle")}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{t("login.otpSub")}</p>

        <div className="mt-6 flex items-center gap-1.5 text-sm">
          <span className="text-[var(--color-text-secondary)]">{t("login.sentTo")}</span>
          <span className="font-semibold text-[var(--color-text-primary)]">+91{phone}</span>
          <button
            type="button"
            onClick={onEditPhone}
            className="inline-flex items-center rounded p-0.5 text-[var(--color-primary)] hover:bg-[var(--color-gray-100)]"
            aria-label={t("login.editPhone")}
          >
            <PencilIcon />
          </button>
        </div>

        <div className="mt-6">
          <div className="flex gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={d}
                onChange={(e) => onDigitChange(i, e.target.value)}
                onPaste={onPaste}
                onKeyDown={(e) => onKeyDown(i, e)}
                onFocus={(e) => { setActive(i); e.currentTarget.select(); }}
                className={`h-14 w-14 rounded-[var(--radius-standard)] border-2 bg-white text-center text-2xl font-semibold tabular-nums text-[var(--color-text-primary)] transition-colors ${
                  active === i ? "border-[var(--color-primary)]" : "border-[var(--color-gray-200)]"
                }`}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
          {fieldError ? (
            <p className="mt-3 text-sm text-[var(--color-error)]" role="alert">{fieldError}</p>
          ) : null}
        </div>

        <p className="mt-5 text-sm text-[var(--color-text-secondary)]">
          {t("login.didntReceive")}{" "}
          {secondsLeft > 0 ? (
            <span className="font-semibold text-[var(--color-text-primary)]">
              00:{String(secondsLeft).padStart(2, "0")} {t("login.resendIn")}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline disabled:opacity-50"
            >
              {resendLoading ? t("common.sending") : t("login.resend")}
            </button>
          )}
        </p>
      </div>

      <BottomCta label={t("login.submit")} onClick={handleVerify} loading={loading} disabled={!otpComplete} />
    </div>
  );
}
