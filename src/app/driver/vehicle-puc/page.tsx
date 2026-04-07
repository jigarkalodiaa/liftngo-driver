"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  CameraIcon,
  CloudUploadIcon,
  FieldVerifiedIcon,
  ImageGalleryIcon,
  SparklesIcon,
  SyncIcon,
} from "@/components/icons";
import AuthGuard from "@/components/layout/AuthGuard";
import BottomCta from "@/components/layout/BottomCta";
import OnboardingStepHeader from "@/components/layout/OnboardingStepHeader";
import { useDriverVehicle } from "@/context/DriverVehicleContext";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";
import { isElectricVehicleType } from "@/lib/driver/vehicleValidation";
import {
  pucExpiryDateSchema,
  pucNumberSchema,
  vehiclePucExtractedSchema,
} from "@/lib/driver/vehiclePucValidation";

const MAX_BYTES = 10 * 1024 * 1024;
const OCR_DELAY_MS = 900;
const VERIFY_MS = 1400;

const MOCK_PUC = "PUC-12345678";
const MOCK_EXPIRY = "10/10/2024";

function VehiclePucContent() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const { details } = useDriverVehicle();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pucNumber, setPucNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [ocrDone, setOcrDone] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<"file" | "pucNumber" | "expiryDate", string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    if (isElectricVehicleType(details.vehicleTypeDetail)) {
      redirectedRef.current = true;
      routerRef.current.replace(DRIVER_ONBOARDING.vehiclePhotos);
    }
  }, [details.vehicleTypeDetail]);

  const clearError = (k: keyof typeof errors) => setErrors((p) => ({ ...p, [k]: undefined }));

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
    setOcrDone(false);
    setVerifying(false);
    setPucNumber("");
    setExpiryDate("");
    clearError("file");
  }, []);

  useEffect(() => {
    if (!file) {
      setOcrDone(false);
      setVerifying(false);
      return;
    }
    setOcrDone(false);
    const t = window.setTimeout(() => {
      setPucNumber(MOCK_PUC);
      setExpiryDate(MOCK_EXPIRY);
      setVerifying(true);
      setOcrDone(true);
      window.setTimeout(() => setVerifying(false), VERIFY_MS);
    }, OCR_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [file]);

  const pucValid = pucNumberSchema.safeParse(pucNumber.trim()).success;
  const expiryValid = pucExpiryDateSchema.safeParse(expiryDate.trim()).success;

  const removeFile = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFile(null);
    setPucNumber("");
    setExpiryDate("");
    setOcrDone(false);
    setVerifying(false);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(() => {
    const next: typeof errors = {};
    if (!file) next.file = "Upload your PUC document.";
    const parsed = vehiclePucExtractedSchema.safeParse({
      pucNumber: pucNumber.trim(),
      expiryDate: expiryDate.trim(),
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as "pucNumber" | "expiryDate";
        if (!next[k]) next[k] = issue.message;
      }
    }
    if (!ocrDone || verifying) {
      toast.error("Wait for OCR to finish.");
      return;
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      const first = Object.keys(next)[0] as keyof typeof next;
      const scrollId =
        first === "file" ? "puc-file" : first === "pucNumber" ? "puc-number" : "puc-expiry";
      document.getElementById(scrollId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setSubmitting(true);
    window.setTimeout(() => {
      toast.success("PUC document saved.");
      setSubmitting(false);
      routerRef.current.replace(DRIVER_ONBOARDING.vehiclePhotos);
    }, 600);
  }, [file, pucNumber, expiryDate, ocrDone, verifying]);

  const inputRow =
    "flex w-full items-center gap-2 rounded-[var(--radius-standard)] border border-solid border-[var(--color-gray-300)] bg-white px-3 py-2.5 focus-within:border-[var(--color-primary)]";

  const isImage = file?.type.startsWith("image/");

  if (isElectricVehicleType(details.vehicleTypeDetail)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-sm text-[var(--color-text-secondary)]">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <OnboardingStepHeader step={6} totalSteps={8} percent={60} />

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-5">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Upload PUC Document</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Please upload a clear photo of your valid Pollution Under Control (PUC) certificate for
          verification.
        </p>

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
          id="puc-file"
          className="mt-5 rounded-2xl border-2 border-dashed border-[var(--color-gray-300)] bg-[var(--color-gray-50)] px-4 py-8"
        >
          <div className="flex flex-col items-center text-center">
            <CloudUploadIcon />
            <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">Upload Document</p>
            <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-[var(--color-text-secondary)]">
              Supports JPG, PNG or PDF
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

        {errors.file ? <p className="mt-2 text-xs text-[var(--color-error)]">{errors.file}</p> : null}

        {file ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
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
              <span className="truncate text-sm font-medium text-emerald-900">{file.name}</span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="shrink-0 text-sm font-semibold text-[#2563EB]"
            >
              Remove
            </button>
          </div>
        ) : null}

        <div className="mt-6 rounded-[var(--radius-standard)] border border-[var(--color-gray-200)] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-[var(--color-primary)]">
              <SparklesIcon />
            </span>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Extracted Details</span>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="puc-number" className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                PUC Number
              </label>
              <div className={inputRow}>
                <input
                  id="puc-number"
                  value={pucNumber}
                  onChange={(e) => {
                    setPucNumber(e.target.value);
                    clearError("pucNumber");
                  }}
                  placeholder="PUC number"
                  className="min-h-0 flex-1 border-0 bg-transparent py-1 text-[15px] font-bold text-[var(--color-text-primary)] placeholder:font-normal placeholder:text-[var(--color-gray-400)]"
                  autoComplete="off"
                />
                {pucValid ? <FieldVerifiedIcon className="shrink-0" /> : <span className="w-[22px] shrink-0" />}
              </div>
              {errors.pucNumber ? (
                <p className="mt-1 text-xs text-[var(--color-error)]">{errors.pucNumber}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="puc-expiry" className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Expiry Date
              </label>
              <div className={inputRow}>
                <input
                  id="puc-expiry"
                  value={expiryDate}
                  onChange={(e) => {
                    setExpiryDate(e.target.value);
                    clearError("expiryDate");
                  }}
                  placeholder="DD/MM/YYYY"
                  className="min-h-0 flex-1 border-0 bg-transparent py-1 text-[15px] font-bold text-[var(--color-text-primary)] placeholder:font-normal placeholder:text-[var(--color-gray-400)]"
                  autoComplete="off"
                />
                {expiryValid ? <FieldVerifiedIcon className="shrink-0" /> : <span className="w-[22px] shrink-0" />}
              </div>
              {errors.expiryDate ? (
                <p className="mt-1 text-xs text-[var(--color-error)]">{errors.expiryDate}</p>
              ) : null}
            </div>
          </div>

          {ocrDone ? (
            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className={verifying ? "animate-spin text-[var(--color-gray-500)]" : "text-[var(--color-gray-400)]"}>
                <SyncIcon />
              </span>
              <span>{verifying ? "Verifying PUC details…" : "Verified with transport records."}</span>
            </div>
          ) : null}

          <p className="mt-3 text-center text-[11px] text-[var(--color-gray-400)]">
            Data automatically extracted using OCR
          </p>
        </div>

        <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangleIcon className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-900">
            <span className="font-semibold">Note:</span> Your PUC certificate may expire soon. Renew on time to stay
            compliant and avoid service interruption.
          </p>
        </div>
      </div>

      <BottomCta
        label="Continue"
        onClick={handleSubmit}
        loading={submitting}
        disabled={!file || !ocrDone || verifying}
      />
    </div>
  );
}

export default function VehiclePucPage() {
  return (
    <AuthGuard>
      <VehiclePucContent />
    </AuthGuard>
  );
}
