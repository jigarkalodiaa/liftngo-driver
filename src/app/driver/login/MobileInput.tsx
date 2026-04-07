"use client";

import { useCallback } from "react";
import { CheckIcon } from "@/components/icons";
import BottomCta from "@/components/layout/BottomCta";
import { useLocale } from "@/context/LocaleContext";
import { isValidPartialPhone, indianPhoneSchema } from "@/lib/driver/validation";

type MobileInputProps = {
  phone: string;
  onPhoneChange: (digits: string) => void;
  onSendOtp: () => void;
  loading: boolean;
  fieldError?: string | null;
};

export default function MobileInput({
  phone,
  onPhoneChange,
  onSendOtp,
  loading,
  fieldError,
}: MobileInputProps) {
  const { t } = useLocale();
  const valid = indianPhoneSchema.safeParse(phone).success;

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
      if (!isValidPartialPhone(digits)) return;
      onPhoneChange(digits);
    },
    [onPhoneChange],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1">
        <h1 className="text-[1.65rem] font-bold leading-tight text-[var(--color-text-primary)]">
          {t("login.mobileTitle")}
        </h1>

        <div className="mt-6">
          <label htmlFor="driver-phone" className="sr-only">
            {t("login.mobilePlaceholder")}
          </label>
          <div className="flex w-full items-center rounded-[var(--radius-standard)] border border-[var(--color-gray-300)] bg-white px-4 py-3.5 transition-colors focus-within:border-[var(--color-primary)]">
            <span className="mr-3 text-base font-medium text-[var(--color-text-secondary)]">+91</span>
            <input
              id="driver-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder={t("login.mobilePlaceholder")}
              value={phone}
              onChange={onChange}
              className="min-h-0 flex-1 bg-transparent text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-gray-400)]"
              disabled={loading}
              maxLength={10}
            />
          </div>
          {fieldError ? (
            <p className="mt-2 text-sm text-[var(--color-error)]" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex items-start gap-2">
          <CheckIcon className="shrink-0" />
          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{t("login.consent")}</p>
        </div>
      </div>

      <BottomCta label={t("login.login")} onClick={onSendOtp} loading={loading} disabled={!valid} />
    </div>
  );
}
