"use client";

import AuthGuard from "@/components/layout/AuthGuard";
import VerifiedDriverGuard from "@/components/layout/VerifiedDriverGuard";
import AppHeader from "@/components/layout/AppHeader";
import { useLocale } from "@/context/LocaleContext";

function TermsContent() {
  const { t } = useLocale();
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-gray-50)]">
      <AppHeader title={t("termsPage.title")} />
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-lg rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 shadow-sm">
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {t("termsPage.body")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DriverTermsPage() {
  return (
    <AuthGuard>
      <VerifiedDriverGuard>
        <TermsContent />
      </VerifiedDriverGuard>
    </AuthGuard>
  );
}
