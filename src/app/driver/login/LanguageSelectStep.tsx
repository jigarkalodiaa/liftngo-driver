"use client";

import BrandLogo from "@/components/layout/BrandLogo";
import { useLocale } from "@/context/LocaleContext";
import type { DriverLocale } from "@/lib/i18n/constants";

type LanguageSelectStepProps = {
  onChosen: (locale: DriverLocale) => void;
};

export default function LanguageSelectStep({ onChosen }: LanguageSelectStepProps) {
  const { t } = useLocale();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1">
        <h1 className="text-[1.65rem] font-bold leading-tight text-[var(--color-text-primary)]">
          {t("lang.chooseTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {t("lang.chooseSubtitle")}
        </p>

        <div className="mt-10 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => onChosen("en")}
            className="w-full rounded-[var(--radius-standard)] border-2 border-[var(--color-gray-200)] bg-white py-4 text-center text-lg font-bold text-[var(--color-primary)] shadow-sm transition-colors hover:border-[var(--color-primary)]"
          >
            {t("lang.english")}
          </button>
          <button
            type="button"
            onClick={() => onChosen("hi")}
            className="w-full rounded-[var(--radius-standard)] border-2 border-[var(--color-gray-200)] bg-white py-4 text-center text-xl font-bold text-[var(--color-primary)] shadow-sm transition-colors hover:border-[var(--color-primary)]"
          >
            {t("lang.hindi")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LanguageSelectHeader() {
  return (
    <header className="mb-8">
      <BrandLogo />
    </header>
  );
}
