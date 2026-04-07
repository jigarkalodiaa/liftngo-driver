"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FieldVerifiedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SyncIcon,
  UploadTrayIcon,
} from "@/components/icons";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import BottomCta from "@/components/layout/BottomCta";
import { useLocale } from "@/context/LocaleContext";
import { mergeDriverOnboardingProfile } from "@/lib/driver/driverOnboardingProfile";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";
import { createPanFormSchema, createPanNumberSchema } from "@/lib/driver/panValidation";

const MOCK_PAN = "ABCDE1234F";
const MOCK_NAME = "RAJESH KUMAR";
const OCR_DELAY_MS = 900;
const VERIFY_MS = 2200;

function PanVerificationForm() {
  const { t } = useLocale();
  const router = useRouter();

  const panFormSchema = useMemo(() => createPanFormSchema(t), [t]);
  const panNumberSchema = useMemo(() => createPanNumberSchema(t), [t]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrDone, setOcrDone] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [panNumber, setPanNumber] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"panNumber" | "nameOnCard", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const panValid = panNumberSchema.safeParse(panNumber).success;
  const nameValid = nameOnCard.trim().length >= 2;

  const onPickFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("errors.imageFile"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("errors.file5mb"));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileName(file.name);
    setOcrDone(false);
    setVerifying(false);
    setPanNumber("");
    setNameOnCard("");
    setErrors({});

    window.setTimeout(() => {
      setPanNumber(MOCK_PAN);
      setNameOnCard(MOCK_NAME);
      setOcrDone(true);
      setVerifying(true);
      window.setTimeout(() => setVerifying(false), VERIFY_MS);
    }, OCR_DELAY_MS);
  }, [previewUrl, t]);

  const handleContinue = useCallback(() => {
    const parsed = panFormSchema.safeParse({
      panNumber: panNumber.trim(),
      nameOnCard: nameOnCard.trim(),
    });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as "panNumber" | "nameOnCard";
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    if (!fileName) {
      toast.error(t("pan.uploadRequired"));
      return;
    }
    setErrors({});
    setSubmitting(true);
    window.setTimeout(() => {
      mergeDriverOnboardingProfile({
        panHolderName: nameOnCard.trim(),
        panNumber: panNumber.trim(),
      });
      toast.success(t("pan.success"));
      setSubmitting(false);
      router.replace(DRIVER_ONBOARDING.drivingLicense);
    }, 800);
  }, [panNumber, nameOnCard, fileName, t, panFormSchema, router]);

  const inputRow =
    "flex w-full items-center gap-2 rounded-[var(--radius-standard)] border border-solid border-[var(--color-gray-300)] bg-white px-3 py-2.5 focus-within:border-[var(--color-primary)]";

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader title={t("pan.header")} />

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
        <h1 className="text-xl font-bold text-[var(--color-primary)]">{t("pan.title")}</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{t("pan.sub")}</p>

        {/* Upload card */}
        <div className="mt-5 overflow-hidden rounded-[var(--radius-standard)] border border-[var(--color-gray-200)] bg-white">
          <div className="relative aspect-[16/10] w-full bg-[var(--color-gray-50)]">
            <Image
              src={previewUrl ?? "/pan-card-sample.png"}
              alt={t("pan.altPan")}
              fill
              className="object-cover"
              sizes="(max-width: 450px) 100vw, 450px"
              priority
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--color-gray-200)] px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{t("pan.photoLabel")}</p>
              <p className="truncate text-xs text-[var(--color-text-secondary)]">
                {fileName ?? t("pan.defaultFileName")}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            >
              <UploadTrayIcon className="text-white" />
              {t("pan.upload")}
            </button>
          </div>
        </div>

        {/* Extracted details */}
        <div className="mt-5 rounded-[var(--radius-standard)] border border-[var(--color-gray-200)] bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-[var(--color-primary)]">
              <SparklesIcon />
            </span>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("pan.extracted")}</span>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="pan-number" className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("pan.panNumber")}
              </label>
              <div className={inputRow}>
                <input
                  id="pan-number"
                  value={panNumber}
                  onChange={(e) => {
                    setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10));
                    setErrors((p) => ({ ...p, panNumber: undefined }));
                  }}
                  placeholder="ABCDE1234F"
                  className="min-h-0 flex-1 border-0 bg-transparent py-1 text-[15px] font-bold text-[var(--color-text-primary)] placeholder:font-normal placeholder:text-[var(--color-gray-400)]"
                  maxLength={10}
                  autoComplete="off"
                />
                {panValid ? <FieldVerifiedIcon className="shrink-0" /> : <span className="w-[22px] shrink-0" />}
              </div>
              {errors.panNumber ? (
                <p className="mt-1 text-xs text-[var(--color-error)]">{errors.panNumber}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="pan-name" className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("pan.nameOnCard")}
              </label>
              <div className={inputRow}>
                <input
                  id="pan-name"
                  value={nameOnCard}
                  onChange={(e) => {
                    setNameOnCard(e.target.value);
                    setErrors((p) => ({ ...p, nameOnCard: undefined }));
                  }}
                  placeholder={t("pan.namePh")}
                  className="min-h-0 flex-1 border-0 bg-transparent py-1 text-[15px] font-bold uppercase text-[var(--color-text-primary)] placeholder:font-normal placeholder:normal-case placeholder:text-[var(--color-gray-400)]"
                  autoComplete="name"
                />
                {nameValid && nameOnCard.trim().length > 0 ? (
                  <FieldVerifiedIcon className="shrink-0" />
                ) : (
                  <span className="w-[22px] shrink-0" />
                )}
              </div>
              {errors.nameOnCard ? (
                <p className="mt-1 text-xs text-[var(--color-error)]">{errors.nameOnCard}</p>
              ) : null}
            </div>
          </div>

          {ocrDone ? (
            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className={verifying ? "animate-spin text-[var(--color-gray-500)]" : "text-[var(--color-gray-400)]"}>
                <SyncIcon />
              </span>
              <span>
                {verifying ? t("pan.verifying") : t("pan.verified")}
              </span>
            </div>
          ) : null}

          <p className="mt-3 text-center text-[11px] text-[var(--color-gray-400)]">
            {t("pan.ocrNote")}
          </p>
        </div>

        {/* Security */}
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#E8F5E9] px-4 py-3">
          <ShieldCheckIcon className="shrink-0" />
          <p className="text-xs leading-relaxed text-[#2E7D32]">
            {t("pan.secure")}
          </p>
        </div>
      </div>

      <BottomCta
        label={t("common.continue")}
        onClick={handleContinue}
        loading={submitting}
        disabled={!fileName || !ocrDone || verifying}
      />
    </div>
  );
}

export default function PanVerificationPage() {
  return (
    <AuthGuard>
      <PanVerificationForm />
    </AuthGuard>
  );
}
