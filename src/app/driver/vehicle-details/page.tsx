"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDownIcon } from "@/components/icons";
import AuthGuard from "@/components/layout/AuthGuard";
import BottomCta from "@/components/layout/BottomCta";
import OnboardingStepHeader from "@/components/layout/OnboardingStepHeader";
import { useDriverVehicle } from "@/context/DriverVehicleContext";
import { mergeDriverOnboardingProfile } from "@/lib/driver/driverOnboardingProfile";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";
import {
  BODY_TYPE_OPTIONS,
  vehicleDetailsFormSchema,
  VEHICLE_TYPE_OPTIONS,
  type VehicleDetailsFormData,
} from "@/lib/driver/vehicleValidation";

function CarInputIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 17h14v-3l-2-4H7L5 14v3zM5 17H3M19 17h2M7 17v2M17 17v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="17" r="1.5" fill="currentColor" />
      <circle cx="16" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 16v-5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const inputShell =
  "flex w-full items-center gap-2 rounded-xl bg-[var(--color-gray-100)] px-4 py-3.5 text-[15px] text-[var(--color-text-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/25";

function VehicleDetailsContent() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const { category, details, setDetails, setOwnerInformation } = useDriverVehicle();

  const [errors, setErrors] = useState<Partial<Record<keyof VehicleDetailsFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const onContinue = useCallback(() => {
    if (!category) {
      toast.error("Select a vehicle type first.");
      routerRef.current.replace(DRIVER_ONBOARDING.vehicleType);
      return;
    }
    const parsed = vehicleDetailsFormSchema.safeParse({
      registrationNumber: details.registrationNumber.trim(),
      vehicleTypeDetail: details.vehicleTypeDetail,
      bodyType: details.bodyType,
      isOwner: details.isOwner,
    });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof VehicleDetailsFormData;
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    window.setTimeout(() => {
      mergeDriverOnboardingProfile({
        registrationNumber: parsed.data.registrationNumber,
        vehicleTypeDetail: parsed.data.vehicleTypeDetail,
        bodyType: parsed.data.bodyType,
        isVehicleOwner: parsed.data.isOwner,
      });
      setSubmitting(false);
      toast.success("Vehicle details saved.");
      const next = parsed.data.isOwner
        ? DRIVER_ONBOARDING.vehicleRc
        : DRIVER_ONBOARDING.vehicleOwner;
      routerRef.current.replace(next);
    }, 600);
  }, [category, details]);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-gray-50)]">
      <OnboardingStepHeader step={3} totalSteps={8} percent={30} />

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-5">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Enter your vehicle information</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          We need these details to verify your vehicle for our service.
        </p>

        <div className="mt-5 rounded-2xl border border-[var(--color-gray-100)] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div>
            <label htmlFor="veh-reg" className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
              Vehicle Number
            </label>
            <div className={inputShell}>
              <input
                id="veh-reg"
                value={details.registrationNumber}
                onChange={(e) => {
                  setDetails({ registrationNumber: e.target.value.toUpperCase() });
                  setErrors((p) => ({ ...p, registrationNumber: undefined }));
                }}
                placeholder="e.g., MH 12 AB 1234"
                className="min-h-0 flex-1 border-0 bg-transparent placeholder:text-[var(--color-gray-400)]"
                autoComplete="off"
              />
              <CarInputIcon className="shrink-0 text-[var(--color-gray-400)]" />
            </div>
            {errors.registrationNumber ? (
              <p className="mt-1 text-xs text-[var(--color-error)]">{errors.registrationNumber}</p>
            ) : null}
          </div>

          <div className="mt-4">
            <label htmlFor="veh-type" className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
              Vehicle Type
            </label>
            <div className="relative">
              <select
                id="veh-type"
                value={details.vehicleTypeDetail}
                onChange={(e) => {
                  setDetails({ vehicleTypeDetail: e.target.value });
                  setErrors((p) => ({ ...p, vehicleTypeDetail: undefined }));
                }}
                className={`${inputShell} w-full appearance-none pr-10`}
              >
                {VEHICLE_TYPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]">
                <ChevronDownIcon />
              </span>
            </div>
            {errors.vehicleTypeDetail ? (
              <p className="mt-1 text-xs text-[var(--color-error)]">{errors.vehicleTypeDetail}</p>
            ) : null}
          </div>

          <div className="mt-4">
            <label htmlFor="veh-body" className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
              Body Type
            </label>
            <div className="relative">
              <select
                id="veh-body"
                value={details.bodyType}
                onChange={(e) => {
                  setDetails({ bodyType: e.target.value });
                  setErrors((p) => ({ ...p, bodyType: undefined }));
                }}
                className={`${inputShell} w-full appearance-none pr-10`}
              >
                {BODY_TYPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]">
                <ChevronDownIcon />
              </span>
            </div>
            {errors.bodyType ? <p className="mt-1 text-xs text-[var(--color-error)]">{errors.bodyType}</p> : null}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--color-gray-100)] pt-4">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Are you Vehicle owner?</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-text-secondary)]">{details.isOwner ? "Yes" : "No"}</span>
              <button
                type="button"
                role="switch"
                aria-checked={details.isOwner}
                onClick={() => {
                  const nextOwner = !details.isOwner;
                  setDetails({ isOwner: nextOwner });
                  if (nextOwner) {
                    setOwnerInformation({
                      fullName: "",
                      phone: "",
                      aadhaarFile: null,
                      consentFile: null,
                    });
                  }
                }}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  details.isOwner ? "bg-[#22C55E]" : "bg-[var(--color-gray-300)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${
                    details.isOwner ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 rounded-xl bg-[var(--color-gray-100)] px-3 py-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          <InfoIcon className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
          <p>
            Make sure the information matches exactly with what is mentioned on your Vehicle&apos;s
            Registration Certificate (RC).
          </p>
        </div>
      </div>

      <BottomCta label="Continue" onClick={onContinue} loading={submitting} />
    </div>
  );
}

export default function VehicleDetailsPage() {
  return (
    <AuthGuard>
      <VehicleDetailsContent />
    </AuthGuard>
  );
}
