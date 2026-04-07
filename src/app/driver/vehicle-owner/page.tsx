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
import { useDriverVehicle } from "@/context/DriverVehicleContext";
import { ownerInformationFormSchema } from "@/lib/driver/ownerInformationValidation";
import { mergeDriverOnboardingProfile } from "@/lib/driver/driverOnboardingProfile";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";
import { isValidPartialPhone } from "@/lib/driver/validation";

const MAX_AADHAAR_BYTES = 5 * 1024 * 1024;
const MAX_CONSENT_BYTES = 10 * 1024 * 1024;

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 16v-5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const fieldShell =
  "w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-3.5 text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-primary)]";

const dashedPairBtn =
  "flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-gray-300)] bg-white px-3 py-5 transition-colors hover:bg-[var(--color-gray-50)]";

function VehicleOwnerContent() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const { category, details, ownerInformation, setOwnerInformation } = useDriverVehicle();

  const aadhaarCamRef = useRef<HTMLInputElement>(null);
  const aadhaarGalleryRef = useRef<HTMLInputElement>(null);
  const consentCamRef = useRef<HTMLInputElement>(null);
  const consentPdfRef = useRef<HTMLInputElement>(null);

  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [consentPreview, setConsentPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<"fullName" | "phone" | "aadhaar", string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!category) {
      routerRef.current.replace(DRIVER_ONBOARDING.vehicleType);
      return;
    }
    if (details.isOwner) {
      routerRef.current.replace(DRIVER_ONBOARDING.vehicleDetails);
    }
  }, [category, details.isOwner]);

  useEffect(() => {
    return () => {
      if (aadhaarPreview) URL.revokeObjectURL(aadhaarPreview);
      if (consentPreview) URL.revokeObjectURL(consentPreview);
    };
  }, [aadhaarPreview, consentPreview]);

  useEffect(() => {
    const f = ownerInformation.aadhaarFile;
    if (!f || !f.type.startsWith("image/")) {
      setAadhaarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(f);
    setAadhaarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, [ownerInformation.aadhaarFile]);

  useEffect(() => {
    const f = ownerInformation.consentFile;
    if (!f || !f.type.startsWith("image/")) {
      setConsentPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(f);
    setConsentPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, [ownerInformation.consentFile]);

  const clearErr = (k: keyof typeof errors) => setErrors((p) => ({ ...p, [k]: undefined }));

  const applyAadhaar = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image for Aadhaar.");
        return;
      }
      if (file.size > MAX_AADHAAR_BYTES) {
        toast.error("Image must be under 5 MB.");
        return;
      }
      setOwnerInformation({ aadhaarFile: file });
      clearErr("aadhaar");
    },
    [setOwnerInformation],
  );

  const applyConsent = useCallback(
    (file: File) => {
      const okImage = file.type.startsWith("image/");
      const okPdf = file.type === "application/pdf";
      if (!okImage && !okPdf) {
        toast.error("Please choose a photo or PDF.");
        return;
      }
      if (file.size > MAX_CONSENT_BYTES) {
        toast.error("File must be under 10 MB.");
        return;
      }
      setOwnerInformation({ consentFile: file });
    },
    [setOwnerInformation],
  );

  const removeAadhaar = useCallback(() => {
    setOwnerInformation({ aadhaarFile: null });
    if (aadhaarCamRef.current) aadhaarCamRef.current.value = "";
    if (aadhaarGalleryRef.current) aadhaarGalleryRef.current.value = "";
  }, [setOwnerInformation]);

  const removeConsent = useCallback(() => {
    setOwnerInformation({ consentFile: null });
    if (consentCamRef.current) consentCamRef.current.value = "";
    if (consentPdfRef.current) consentPdfRef.current.value = "";
  }, [setOwnerInformation]);

  const handleContinue = useCallback(() => {
    const next: typeof errors = {};
    if (!ownerInformation.aadhaarFile) next.aadhaar = "Upload the owner's Aadhaar.";

    const parsed = ownerInformationFormSchema.safeParse({
      fullName: ownerInformation.fullName.trim(),
      phone: ownerInformation.phone.trim(),
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as "fullName" | "phone";
        if (!next[k]) next[k] = issue.message;
      }
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      const first = Object.keys(next)[0];
      const id =
        first === "aadhaar"
          ? "owner-aadhaar"
          : first === "fullName"
            ? "owner-name"
            : "owner-phone";
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({});
    setSubmitting(true);
    window.setTimeout(() => {
      mergeDriverOnboardingProfile({
        isVehicleOwner: false,
        rcOwnerName: ownerInformation.fullName.trim(),
        rcOwnerPhone: ownerInformation.phone.trim(),
      });
      toast.success("Owner information saved.");
      setSubmitting(false);
      routerRef.current.replace(DRIVER_ONBOARDING.vehicleRc);
    }, 600);
  }, [ownerInformation]);

  const consentIsPdf = ownerInformation.consentFile?.type === "application/pdf";

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-gray-50)]">
      <OnboardingStepHeader step={3} totalSteps={8} percent={30} />

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-5">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Enter Owner Information</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Please provide details of the vehicle owner as mentioned in the Registration Certificate (RC).
        </p>

        <div className="mt-5 space-y-4 rounded-2xl border border-[var(--color-gray-100)] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div>
            <label htmlFor="owner-name" className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]">
              Owner Full Name<span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              id="owner-name"
              type="text"
              value={ownerInformation.fullName}
              onChange={(e) => {
                setOwnerInformation({ fullName: e.target.value });
                clearErr("fullName");
              }}
              placeholder="Enter full name as per RC"
              className={fieldShell}
              autoComplete="name"
            />
            {errors.fullName ? (
              <p className="mt-1 text-xs text-[var(--color-error)]">{errors.fullName}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="owner-phone" className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]">
              Owner Phone Number<span className="text-[var(--color-error)]">*</span>
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-3.5 focus-within:border-[var(--color-primary)]">
              <span className="text-[15px] font-medium text-[var(--color-primary)]">+91</span>
              <span className="h-5 w-px bg-[var(--color-gray-200)]" aria-hidden />
              <input
                id="owner-phone"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={ownerInformation.phone}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 10);
                  if (!isValidPartialPhone(d)) return;
                  setOwnerInformation({ phone: d });
                  clearErr("phone");
                }}
                maxLength={10}
                className="min-h-0 flex-1 border-0 bg-transparent text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-gray-400)]"
                autoComplete="tel-national"
              />
            </div>
            {errors.phone ? <p className="mt-1 text-xs text-[var(--color-error)]">{errors.phone}</p> : null}
          </div>
        </div>

        <p id="owner-aadhaar" className="mt-6 text-sm font-semibold text-[var(--color-text-primary)]">
          Upload Owner Aadhaar<span className="text-[var(--color-error)]">*</span>
        </p>

        <input
          ref={aadhaarCamRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) applyAadhaar(f);
          }}
        />
        <input
          ref={aadhaarGalleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) applyAadhaar(f);
          }}
        />

        <div className="mt-2.5 flex gap-3">
          <button type="button" className={dashedPairBtn} onClick={() => aadhaarCamRef.current?.click()}>
            <CameraIcon className="size-6 text-[#2563EB]" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">Take Photo</span>
          </button>
          <button type="button" className={dashedPairBtn} onClick={() => aadhaarGalleryRef.current?.click()}>
            <ImageGalleryIcon className="text-[#2563EB]" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">Gallery</span>
          </button>
        </div>
        {errors.aadhaar ? <p className="mt-1.5 text-xs text-[var(--color-error)]">{errors.aadhaar}</p> : null}
        {ownerInformation.aadhaarFile ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
            {aadhaarPreview ? (
              <Image
                unoptimized
                src={aadhaarPreview}
                alt=""
                width={40}
                height={40}
                className="size-10 rounded object-cover"
              />
            ) : null}
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-900">
              {ownerInformation.aadhaarFile.name}
            </span>
            <button type="button" onClick={removeAadhaar} className="shrink-0 text-sm font-semibold text-[#2563EB]">
              Remove
            </button>
          </div>
        ) : null}

        <p className="mt-6 text-sm font-semibold text-[var(--color-text-primary)]">Owner Consent Letter</p>

        <input
          ref={consentCamRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) applyConsent(f);
          }}
        />
        <input
          ref={consentPdfRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) applyConsent(f);
          }}
        />

        <div className="mt-2.5 flex gap-3">
          <button type="button" className={dashedPairBtn} onClick={() => consentCamRef.current?.click()}>
            <CameraIcon className="size-6 text-[#2563EB]" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">Take Photo</span>
          </button>
          <button type="button" className={dashedPairBtn} onClick={() => consentPdfRef.current?.click()}>
            <CloudUploadIcon className="size-6 shrink-0" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">Choose PDF</span>
          </button>
        </div>

        <div className="mt-3 flex gap-2 rounded-xl bg-[var(--color-gray-100)] px-3 py-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          <InfoIcon className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
          <p>A signed letter from the owner allowing you to use this vehicle for LiftNGo services.</p>
        </div>

        {ownerInformation.consentFile ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--color-gray-200)] bg-white px-3 py-3">
            {consentIsPdf ? (
              <span className="flex size-10 items-center justify-center rounded bg-[var(--color-gray-100)] text-xs font-bold text-[var(--color-primary)]">
                PDF
              </span>
            ) : consentPreview ? (
              <Image
                unoptimized
                src={consentPreview}
                alt=""
                width={40}
                height={40}
                className="size-10 rounded object-cover"
              />
            ) : null}
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-text-primary)]">
              {ownerInformation.consentFile.name}
            </span>
            <button type="button" onClick={removeConsent} className="shrink-0 text-sm font-semibold text-[#2563EB]">
              Remove
            </button>
          </div>
        ) : null}
      </div>

      <BottomCta label="Continue" onClick={handleContinue} loading={submitting} />
    </div>
  );
}

export default function VehicleOwnerPage() {
  return (
    <AuthGuard>
      <VehicleOwnerContent />
    </AuthGuard>
  );
}
