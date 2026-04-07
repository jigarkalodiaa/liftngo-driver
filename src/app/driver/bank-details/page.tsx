"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CameraIcon,
  CloudUploadIcon,
  ImageGalleryIcon,
} from "@/components/icons";
import AuthGuard from "@/components/layout/AuthGuard";
import BottomCta from "@/components/layout/BottomCta";
import OnboardingStepHeader from "@/components/layout/OnboardingStepHeader";
import { mergeDriverOnboardingProfile } from "@/lib/driver/driverOnboardingProfile";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";
import {
  bankDetailsFormSchema,
  type BankDetailsFormData,
} from "@/lib/driver/bankDetailsValidation";

const MAX_BYTES = 10 * 1024 * 1024;

const fieldClass =
  "w-full rounded-[var(--radius-standard)] border border-[var(--color-gray-200)] bg-[#F8FAFC] px-4 py-3.5 text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-primary)]";

function BankDetailsContent() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BankDetailsFormData | "proof", string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearFieldError = (k: keyof typeof errors) => setErrors((p) => ({ ...p, [k]: undefined }));

  const applyFile = useCallback((f: File) => {
    if (f.size > MAX_BYTES) {
      toast.error("File must be under 10 MB.");
      return;
    }
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
    });
    setFile(f);
    clearFieldError("proof");
  }, []);

  const removeFile = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFile(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(() => {
    const next: typeof errors = {};
    if (!file) next.proof = "Upload cancelled cheque or passbook page.";

    const parsed = bankDetailsFormSchema.safeParse({
      accountHolderName: accountHolderName.trim(),
      accountNumber: accountNumber.replace(/\s/g, ""),
      ifscCode: ifscCode.trim(),
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof BankDetailsFormData;
        if (!next[k]) next[k] = issue.message;
      }
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      const first = Object.keys(next)[0];
      const id =
        first === "proof"
          ? "bank-proof"
          : first === "accountHolderName"
            ? "bank-name"
            : first === "accountNumber"
              ? "bank-account"
              : "bank-ifsc";
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({});
    setSubmitting(true);
    window.setTimeout(() => {
      mergeDriverOnboardingProfile({
        bankAccountHolderName: accountHolderName.trim(),
      });
      toast.success("Bank details submitted.");
      setSubmitting(false);
      routerRef.current.replace(DRIVER_ONBOARDING.applicationReview);
    }, 600);
  }, [file, accountHolderName, accountNumber, ifscCode]);

  const isImage = file?.type.startsWith("image/");

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-gray-50)]">
      <OnboardingStepHeader step={8} totalSteps={8} percent={100} />

      <div className="flex-1 overflow-y-auto bg-white px-5 pb-4 pt-5">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Enter Bank Account Details</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Provide details of the bank account where you&apos;d like to receive your earnings.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="bank-name" className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              Account Holder Name
            </label>
            <input
              id="bank-name"
              type="text"
              value={accountHolderName}
              onChange={(e) => {
                setAccountHolderName(e.target.value);
                clearFieldError("accountHolderName");
              }}
              placeholder="Enter name as per bank record"
              className={fieldClass}
              autoComplete="name"
            />
            {errors.accountHolderName ? (
              <p className="mt-1 text-xs text-[var(--color-error)]">{errors.accountHolderName}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="bank-account" className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              Bank Account Number
            </label>
            <input
              id="bank-account"
              type="tel"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 18));
                clearFieldError("accountNumber");
              }}
              placeholder="Enter 9-18 digit account number"
              className={fieldClass}
              autoComplete="off"
            />
            {errors.accountNumber ? (
              <p className="mt-1 text-xs text-[var(--color-error)]">{errors.accountNumber}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="bank-ifsc" className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              IFSC Code
            </label>
            <input
              id="bank-ifsc"
              type="text"
              value={ifscCode}
              onChange={(e) => {
                setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11));
                clearFieldError("ifscCode");
              }}
              placeholder="E.g., SBIN0001234"
              className={fieldClass}
              autoComplete="off"
              maxLength={11}
            />
            {errors.ifscCode ? <p className="mt-1 text-xs text-[var(--color-error)]">{errors.ifscCode}</p> : null}
          </div>
        </div>

        <p className="mt-6 text-sm font-medium text-[var(--color-text-primary)]">Cancelled Cheque or Passbook</p>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) applyFile(f);
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) applyFile(f);
          }}
        />

        <div
          id="bank-proof"
          className="mt-2 rounded-2xl border-2 border-dashed border-[var(--color-gray-300)] bg-[var(--color-gray-50)] px-4 py-8"
        >
          <div className="flex flex-col items-center text-center">
            <CloudUploadIcon />
            <p className="mt-3 text-sm font-semibold text-[#2563EB]">Click to upload</p>
            <p className="mt-1 max-w-[300px] text-xs leading-relaxed text-[var(--color-text-secondary)]">
              Upload a clear photo of your cancelled cheque or the first page of your bank passbook.
            </p>
            <div className="mt-5 flex w-full max-w-[280px] gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-standard)] border border-[var(--color-gray-200)] bg-white py-3 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm"
              >
                <CameraIcon className="size-5 text-[#2563EB]" />
                Camera
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-standard)] border border-[var(--color-gray-200)] bg-white py-3 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm"
              >
                <ImageGalleryIcon className="text-[#2563EB]" />
                Gallery
              </button>
            </div>
          </div>
        </div>

        {errors.proof ? <p className="mt-2 text-xs text-[var(--color-error)]">{errors.proof}</p> : null}

        {file ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
            {isImage && previewUrl ? (
              <Image
                unoptimized
                src={previewUrl}
                alt=""
                width={40}
                height={40}
                className="size-10 rounded object-cover"
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded bg-white text-xs font-bold text-[var(--color-primary)]">
                PDF
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-900">{file.name}</span>
            <button type="button" onClick={removeFile} className="shrink-0 text-sm font-semibold text-[#2563EB]">
              Remove
            </button>
          </div>
        ) : null}
      </div>

      <BottomCta label="Submit Details" onClick={handleSubmit} loading={submitting} disabled={false} />
    </div>
  );
}

export default function BankDetailsPage() {
  return (
    <AuthGuard>
      <BankDetailsContent />
    </AuthGuard>
  );
}
