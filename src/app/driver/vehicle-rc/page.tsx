"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FieldVerifiedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SyncIcon,
} from "@/components/icons";
import AuthGuard from "@/components/layout/AuthGuard";
import BottomCta from "@/components/layout/BottomCta";
import OnboardingStepHeader from "@/components/layout/OnboardingStepHeader";
import ImageUploadBox from "@/components/ui/ImageUploadBox";
import { useDriverVehicle } from "@/context/DriverVehicleContext";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";
import {
  vehicleRcExtractedSchema,
  vehicleRegistrationSchema,
} from "@/lib/driver/vehicleRcValidation";

type UploadState = { file: File; preview: string } | null;

const MOCK_REG = "MH 12 AB 1234";
const MOCK_OWNER = "RAJESH KUMAR";
const OCR_DELAY_MS = 900;
const VERIFY_MS = 1600;

function VehicleRcContent() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const { details } = useDriverVehicle();

  const [frontUpload, setFrontUpload] = useState<UploadState>(null);
  const [backUpload, setBackUpload] = useState<UploadState>(null);
  const [vehicleNumber, setVehicleNumber] = useState(() => details.registrationNumber.trim() || "");
  const [ownerName, setOwnerName] = useState("");
  const [ocrDone, setOcrDone] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<"front" | "back" | "vehicleNumber" | "ownerName", string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (key: keyof typeof errors) =>
    setErrors((p) => ({ ...p, [key]: undefined }));

  useEffect(() => {
    if (!frontUpload || !backUpload) {
      setOcrDone(false);
      setVerifying(false);
      return;
    }
    setOcrDone(false);
    const t = window.setTimeout(() => {
      setVehicleNumber(MOCK_REG);
      setOwnerName(MOCK_OWNER);
      setVerifying(true);
      setOcrDone(true);
      window.setTimeout(() => setVerifying(false), VERIFY_MS);
    }, OCR_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [frontUpload, backUpload]);

  const regValid = vehicleRegistrationSchema.safeParse(vehicleNumber.trim()).success;
  const ownerValid = ownerName.trim().length >= 2;

  const handleSubmit = useCallback(() => {
    const next: typeof errors = {};
    if (!frontUpload) next.front = "Upload front side of RC.";
    if (!backUpload) next.back = "Upload back side of RC.";
    const parsed = vehicleRcExtractedSchema.safeParse({
      vehicleNumber: vehicleNumber.trim(),
      ownerName: ownerName.trim(),
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as "vehicleNumber" | "ownerName";
        if (!next[k]) next[k] = issue.message;
      }
    }
    if (!ocrDone || verifying) {
      toast.error("Wait for OCR to finish processing your RC images.");
      return;
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      document.getElementById(`rc-${Object.keys(next)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setSubmitting(true);
    window.setTimeout(() => {
      toast.success("RC uploaded successfully.");
      setSubmitting(false);
      routerRef.current.replace(DRIVER_ONBOARDING.vehicleInsurance);
    }, 800);
  }, [frontUpload, backUpload, vehicleNumber, ownerName, ocrDone, verifying]);

  const inputRow =
    "flex w-full items-center gap-2 rounded-[var(--radius-standard)] border border-solid border-[var(--color-gray-300)] bg-white px-3 py-2.5 focus-within:border-[var(--color-primary)]";

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <OnboardingStepHeader step={4} totalSteps={8} percent={40} />

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-5">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Upload Vehicle RC</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Please upload clear photos of your original Registration Certificate (RC) for verification.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl bg-[#E8EAF6] p-4">
          <Image
            src="/vehicle-rc-sample.png"
            alt="Sample vehicle registration certificate"
            width={640}
            height={360}
            className="w-full rounded-lg object-contain"
            priority
          />
        </div>

        <p id="rc-front" className="mt-5 text-sm font-semibold text-[var(--color-text-primary)]">
          Upload Vehicle RC
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
              clearError("front");
            }}
          />
          <ImageUploadBox
            label="Back"
            preview={backUpload?.preview ?? null}
            error={errors.back}
            onFileSelect={(file, preview) => {
              if (backUpload?.preview) URL.revokeObjectURL(backUpload.preview);
              setBackUpload({ file, preview });
              clearError("back");
            }}
          />
        </div>
        {(errors.front || errors.back) && (
          <p className="mt-1.5 text-xs text-[var(--color-error)]">{errors.front || errors.back}</p>
        )}

        <div className="mt-6 rounded-[var(--radius-standard)] border border-[var(--color-gray-200)] bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-[var(--color-primary)]">
              <SparklesIcon />
            </span>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Extracted Details</span>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="rc-vehicleNumber" className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Vehicle Number
              </label>
              <div className={inputRow}>
                <input
                  id="rc-vehicleNumber"
                  value={vehicleNumber}
                  onChange={(e) => {
                    setVehicleNumber(e.target.value.toUpperCase());
                    clearError("vehicleNumber");
                  }}
                  placeholder="e.g., MH 12 AB 1234"
                  className="min-h-0 flex-1 border-0 bg-transparent py-1 text-[15px] font-bold text-[var(--color-text-primary)] placeholder:font-normal placeholder:text-[var(--color-gray-400)]"
                  autoComplete="off"
                />
                {regValid ? <FieldVerifiedIcon className="shrink-0" /> : <span className="w-[22px] shrink-0" />}
              </div>
              {errors.vehicleNumber ? (
                <p className="mt-1 text-xs text-[var(--color-error)]">{errors.vehicleNumber}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="rc-ownerName" className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Owner Name
              </label>
              <div className={inputRow}>
                <input
                  id="rc-ownerName"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    clearError("ownerName");
                  }}
                  placeholder="As on RC"
                  className="min-h-0 flex-1 border-0 bg-transparent py-1 text-[15px] font-bold uppercase text-[var(--color-text-primary)] placeholder:font-normal placeholder:normal-case placeholder:text-[var(--color-gray-400)]"
                  autoComplete="name"
                />
                {ownerValid && ownerName.trim().length > 0 ? (
                  <FieldVerifiedIcon className="shrink-0" />
                ) : (
                  <span className="w-[22px] shrink-0" />
                )}
              </div>
              {errors.ownerName ? (
                <p className="mt-1 text-xs text-[var(--color-error)]">{errors.ownerName}</p>
              ) : null}
            </div>
          </div>

          {ocrDone ? (
            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className={verifying ? "animate-spin text-[var(--color-gray-500)]" : "text-[var(--color-gray-400)]"}>
                <SyncIcon />
              </span>
              <span>
                {verifying ? "Verifying RC with transport records…" : "Verified with transport records."}
              </span>
            </div>
          ) : null}

          <p className="mt-3 text-center text-[11px] text-[var(--color-gray-400)]">
            Data automatically extracted using OCR
          </p>
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#E8F5E9] px-4 py-3">
          <ShieldCheckIcon className="shrink-0" />
          <p className="text-xs leading-relaxed text-[#2E7D32]">
            Your RC images are encrypted and used only for verification.
          </p>
        </div>
      </div>

      <BottomCta
        label="Continue"
        onClick={handleSubmit}
        loading={submitting}
        disabled={!frontUpload || !backUpload || !ocrDone || verifying}
      />
    </div>
  );
}

export default function VehicleRcPage() {
  return (
    <AuthGuard>
      <VehicleRcContent />
    </AuthGuard>
  );
}
