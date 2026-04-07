"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FieldVerifiedIcon, SparklesIcon } from "@/components/icons";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import BottomCta from "@/components/layout/BottomCta";
import ImageUploadBox from "@/components/ui/ImageUploadBox";
import {
  dlExpirySchema,
  dlNumberSchema,
  drivingLicenseFormSchema,
} from "@/lib/driver/drivingLicenseValidation";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";

const MOCK_DL = "DL-20230059281";
const MOCK_EXPIRY = "12/05/2035";
const OCR_DELAY_MS = 900;

type UploadState = { file: File; preview: string } | null;

function DrivingLicenseForm() {
  const router = useRouter();

  const [frontUpload, setFrontUpload] = useState<UploadState>(null);
  const [backUpload, setBackUpload] = useState<UploadState>(null);
  const [ocrDone, setOcrDone] = useState(false);
  const [dlNumber, setDlNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"dlNumber" | "expiryDate" | "front" | "back", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (frontUpload?.preview) URL.revokeObjectURL(frontUpload.preview);
      if (backUpload?.preview) URL.revokeObjectURL(backUpload.preview);
    };
  }, [frontUpload, backUpload]);

  useEffect(() => {
    if (!frontUpload || !backUpload) {
      setOcrDone(false);
      setDlNumber("");
      setExpiryDate("");
      return;
    }
    setOcrDone(false);
    setDlNumber("");
    setExpiryDate("");
    const t = window.setTimeout(() => {
      setDlNumber(MOCK_DL);
      setExpiryDate(MOCK_EXPIRY);
      setOcrDone(true);
    }, OCR_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [frontUpload, backUpload]);

  const dlValid = dlNumberSchema.safeParse(dlNumber).success;
  const expiryValid = dlExpirySchema.safeParse(expiryDate).success;

  const clearField = (key: keyof typeof errors) =>
    setErrors((p) => ({ ...p, [key]: undefined }));

  const handleContinue = useCallback(() => {
    const next: typeof errors = {};
    if (!frontUpload) next.front = "Upload the front of your driving license.";
    if (!backUpload) next.back = "Upload the back of your driving license.";

    const parsed = drivingLicenseFormSchema.safeParse({
      dlNumber: dlNumber.trim(),
      expiryDate: expiryDate.trim(),
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as "dlNumber" | "expiryDate";
        if (!next[k]) next[k] = issue.message;
      }
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    window.setTimeout(() => {
      toast.success("Driving license saved.");
      setSubmitting(false);
      router.replace(DRIVER_ONBOARDING.selfie);
    }, 600);
  }, [frontUpload, backUpload, dlNumber, expiryDate, router]);

  const inputRow =
    "flex w-full items-center gap-2 rounded-[var(--radius-standard)] border border-solid border-[var(--color-gray-300)] bg-white px-3 py-2.5 focus-within:border-[var(--color-primary)]";

  const formatExpiryInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const p: string[] = [];
    if (digits.length >= 1) p.push(digits.slice(0, 2));
    if (digits.length >= 3) p.push(digits.slice(2, 4));
    if (digits.length >= 5) p.push(digits.slice(4, 8));
    return p.join("/");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader title="Driving License" />

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Driving License</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Please upload clear photos of your valid driving license (DL). We will automatically extract
          the details.
        </p>

        <div className="mt-5 overflow-hidden rounded-[var(--radius-standard)] border border-[var(--color-gray-200)] bg-[var(--color-gray-50)]">
          <div
            className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-b from-[#E8EAF6] to-[#EEF1F8] px-6 py-8"
            aria-hidden
          >
            <p className="text-center text-sm font-medium text-[var(--color-text-secondary)]">
              Sample driving license
            </p>
          </div>
        </div>

        <p
          id="dl-upload-label"
          className="mt-5 text-sm font-semibold text-[var(--color-text-primary)]"
        >
          Upload Driving License
          <span className="text-[var(--color-error)]">*</span>
        </p>
        <div className="mt-2.5 flex gap-3">
          <ImageUploadBox
            label="Upfront"
            preview={frontUpload?.preview ?? null}
            error={errors.front}
            onFileSelect={(file, preview) => {
              if (frontUpload?.preview) URL.revokeObjectURL(frontUpload.preview);
              setFrontUpload({ file, preview });
              clearField("front");
            }}
          />
          <ImageUploadBox
            label="Back"
            preview={backUpload?.preview ?? null}
            error={errors.back}
            onFileSelect={(file, preview) => {
              if (backUpload?.preview) URL.revokeObjectURL(backUpload.preview);
              setBackUpload({ file, preview });
              clearField("back");
            }}
          />
        </div>
        {(errors.front || errors.back) && (
          <p className="mt-1.5 text-xs text-[var(--color-error)]">{errors.front || errors.back}</p>
        )}

        <div className="mt-5 rounded-[var(--radius-standard)] border border-[var(--color-gray-200)] bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-[var(--color-primary)]">
              <SparklesIcon />
            </span>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Extracted Details</span>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="dl-number" className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                DL Number
              </label>
              <div className={inputRow}>
                <input
                  id="dl-number"
                  value={dlNumber}
                  onChange={(e) => {
                    setDlNumber(e.target.value);
                    clearField("dlNumber");
                  }}
                  placeholder="e.g. DL-20230059281"
                  className="min-h-0 flex-1 border-0 bg-transparent py-1 text-[15px] font-bold text-[var(--color-text-primary)] placeholder:font-normal placeholder:text-[var(--color-gray-400)]"
                  autoComplete="off"
                  disabled={!ocrDone}
                />
                {dlValid && dlNumber.trim() ? <FieldVerifiedIcon className="shrink-0" /> : <span className="w-[22px] shrink-0" />}
              </div>
              {errors.dlNumber ? (
                <p className="mt-1 text-xs text-[var(--color-error)]">{errors.dlNumber}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="dl-expiry" className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Expiry Date
              </label>
              <div className={inputRow}>
                <input
                  id="dl-expiry"
                  value={expiryDate}
                  onChange={(e) => {
                    setExpiryDate(formatExpiryInput(e.target.value));
                    clearField("expiryDate");
                  }}
                  placeholder="DD/MM/YYYY"
                  inputMode="numeric"
                  maxLength={10}
                  className="min-h-0 flex-1 border-0 bg-transparent py-1 text-[15px] font-bold text-[var(--color-text-primary)] placeholder:font-normal placeholder:text-[var(--color-gray-400)]"
                  autoComplete="off"
                  disabled={!ocrDone}
                />
                {expiryValid && expiryDate.trim() ? <FieldVerifiedIcon className="shrink-0" /> : <span className="w-[22px] shrink-0" />}
              </div>
              {errors.expiryDate ? (
                <p className="mt-1 text-xs text-[var(--color-error)]">{errors.expiryDate}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-[var(--color-gray-50)] px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
              Tip: If the extracted details are incorrect, you can manually edit them or retake the photo.
            </p>
          </div>
        </div>
      </div>

      <BottomCta
        label="Continue"
        onClick={handleContinue}
        loading={submitting}
        disabled={!frontUpload || !backUpload || !ocrDone}
      />
    </div>
  );
}

export default function DrivingLicensePage() {
  return (
    <AuthGuard>
      <DrivingLicenseForm />
    </AuthGuard>
  );
}
