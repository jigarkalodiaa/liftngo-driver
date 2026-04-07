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
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";

const MAX_BYTES = 10 * 1024 * 1024;

function InfoNoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 16v-5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function VehiclePhotosContent() {
  const router = useRouter();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose a photo (JPG or PNG).");
      return;
    }
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setFile(f);
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

  const handleContinue = useCallback(() => {
    if (!file) {
      toast.error("Upload at least one clear vehicle photo.");
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      toast.success("Vehicle photo saved.");
      setSubmitting(false);
      router.replace(DRIVER_ONBOARDING.bankDetails);
    }, 500);
  }, [file, router]);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-gray-50)]">
      <OnboardingStepHeader step={7} totalSteps={8} percent={70} />

      <div className="flex-1 overflow-y-auto bg-white px-5 pb-4 pt-5">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Upload Vehicle Photos</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Please upload clear photos of your vehicle from the following angles for verification.
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
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) applyFile(f);
          }}
        />

        <div
          id="veh-photo-upload"
          className="mt-5 rounded-2xl border-2 border-dashed border-[#93C5FD] bg-[#F8FAFC] px-4 py-10"
        >
          <div className="flex flex-col items-center text-center">
            <CloudUploadIcon />
            <p className="mt-3 text-sm font-semibold text-[#1E3A5F]">Upload Document</p>
            <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-[var(--color-text-secondary)]">
              Tap to upload from Camera or Gallery. Ensure all text is legible.
            </p>
            <div className="mt-6 flex w-full max-w-[280px] gap-3">
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

        {file && previewUrl ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
            <Image
              unoptimized
              src={previewUrl}
              alt=""
              width={48}
              height={48}
              className="size-12 rounded object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-900">{file.name}</span>
            <button
              type="button"
              onClick={removeFile}
              className="shrink-0 text-sm font-semibold text-[#2563EB]"
            >
              Remove
            </button>
          </div>
        ) : null}

        <div className="mt-5 flex gap-2.5 rounded-xl bg-[var(--color-gray-100)] px-3 py-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          <InfoNoteIcon className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
          <p>
            Ensure the vehicle and number plate are clearly visible in the photos. Avoid reflections
            and low light.
          </p>
        </div>
      </div>

      <BottomCta label="Continue" onClick={handleContinue} loading={submitting} disabled={!file} />
    </div>
  );
}

export default function VehiclePhotosPage() {
  return (
    <AuthGuard>
      <VehiclePhotosContent />
    </AuthGuard>
  );
}
