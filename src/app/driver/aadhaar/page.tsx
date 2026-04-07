"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDownIcon, ShieldCheckIcon } from "@/components/icons";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import BottomCta from "@/components/layout/BottomCta";
import ImageUploadBox from "@/components/ui/ImageUploadBox";
import { useLocale } from "@/context/LocaleContext";
import { createAadhaarFormSchema, REGIONS, type AadhaarFormData } from "@/lib/driver/aadhaarValidation";
import { mergeDriverOnboardingProfile } from "@/lib/driver/driverOnboardingProfile";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";
import { isValidPartialPhone } from "@/lib/driver/validation";

type UploadState = { file: File; preview: string } | null;

function AadhaarForm() {
  const { t } = useLocale();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const aadhaarFormSchema = useMemo(() => createAadhaarFormSchema(t), [t]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("Khatushyam");
  const [consent, setConsent] = useState<boolean | null>(null);
  const [frontUpload, setFrontUpload] = useState<UploadState>(null);
  const [backUpload, setBackUpload] = useState<UploadState>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof AadhaarFormData | "front" | "back", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (key: string) => setErrors((p) => ({ ...p, [key]: undefined }));

  const handleSubmit = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!frontUpload) newErrors.front = t("aadhaar.errFront");
    if (!backUpload) newErrors.back = t("aadhaar.errBack");

    const parsed = aadhaarFormSchema.safeParse({
      name: name.trim(),
      phone: phone.trim(),
      aadhaarNumber: aadhaarNumber.trim(),
      address: address.trim(),
      region,
      consent: consent === true,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof AadhaarFormData;
        if (!newErrors[field]) newErrors[field] = issue.message;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      document
        .getElementById(`aadhaar-${Object.keys(newErrors)[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({});
    setSubmitting(true);
    setTimeout(() => {
      mergeDriverOnboardingProfile({
        aadhaarName: name.trim(),
        phone: phone.trim(),
        region,
      });
      toast.success(t("aadhaar.success"));
      setSubmitting(false);
      routerRef.current.replace(DRIVER_ONBOARDING.pan);
    }, 1500);
  }, [name, phone, aadhaarNumber, address, region, consent, frontUpload, backUpload, t, aadhaarFormSchema]);

  const inputBox =
    "w-full rounded-[var(--radius-standard)] border border-solid border-[var(--color-gray-300)] bg-white px-4 py-3 text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-primary)]";

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader title={t("aadhaar.header")} />

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t("aadhaar.title")}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{t("aadhaar.sub")}</p>

        {/* Aadhaar card preview */}
        <div className="mt-4 overflow-hidden rounded-2xl bg-[#E8EAF6] p-4">
          <Image
            src="/aadhaar-card-placeholder.png"
            alt={t("aadhaar.sampleAlt")}
            width={400}
            height={220}
            className="w-full rounded-lg object-contain"
            priority
          />
        </div>

        {/* Upload section */}
        <p
          id="aadhaar-front"
          className="mt-5 text-sm font-semibold text-[var(--color-text-primary)]"
        >
          {t("aadhaar.uploadLabel")}
          <span className="text-[var(--color-error)]">*</span>
        </p>
        <div className="mt-2.5 flex gap-3">
          <ImageUploadBox
            label={t("aadhaar.upfront")}
            preview={frontUpload?.preview ?? null}
            error={errors.front}
            onFileSelect={(file, preview) => {
              if (frontUpload?.preview) URL.revokeObjectURL(frontUpload.preview);
              setFrontUpload({ file, preview });
              clearError("front");
            }}
          />
          <ImageUploadBox
            label={t("aadhaar.back")}
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
          <p className="mt-1.5 text-xs text-[var(--color-error)]">
            {errors.front || errors.back}
          </p>
        )}

        {/* Form fields */}
        <div className="mt-7 space-y-5">
          <div>
            <label htmlFor="aadhaar-name" className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]">
              {t("aadhaar.nameLabel")}
              <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              id="aadhaar-name"
              type="text"
              placeholder={t("aadhaar.namePh")}
              value={name}
              onChange={(e) => { setName(e.target.value); clearError("name"); }}
              className={inputBox}
            />
            {errors.name && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="aadhaar-phone" className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]">
              {t("aadhaar.phoneLabel")}
              <span className="text-[var(--color-error)]">*</span>
            </label>
            <div className="flex items-center rounded-[var(--radius-standard)] border border-solid border-[var(--color-gray-300)] bg-white px-4 focus-within:border-[var(--color-primary)]">
              <span className="mr-2 text-[15px] font-medium text-[var(--color-primary)]">+91</span>
              <input
                id="aadhaar-phone"
                type="tel"
                inputMode="numeric"
                placeholder={t("aadhaar.phonePh")}
                value={phone}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 10);
                  if (!isValidPartialPhone(d)) return;
                  setPhone(d);
                  clearError("phone");
                }}
                maxLength={10}
                className="min-h-0 flex-1 border-0 bg-transparent py-3 text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-gray-400)]"
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="aadhaar-aadhaarNumber" className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]">
              {t("aadhaar.aadhaarLabel")}
              <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              id="aadhaar-aadhaarNumber"
              type="tel"
              inputMode="numeric"
              placeholder={t("aadhaar.aadhaarPh")}
              value={aadhaarNumber}
              onChange={(e) => { setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12)); clearError("aadhaarNumber"); }}
              maxLength={12}
              className={inputBox}
            />
            {errors.aadhaarNumber && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.aadhaarNumber}</p>}
          </div>

          <div>
            <label htmlFor="aadhaar-address" className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]">
              {t("aadhaar.addressLabel")}
              <span className="text-[var(--color-error)]">*</span>
            </label>
            <textarea
              id="aadhaar-address"
              placeholder={t("aadhaar.addressPh")}
              value={address}
              onChange={(e) => { setAddress(e.target.value); clearError("address"); }}
              rows={3}
              className="w-full rounded-[var(--radius-standard)] border border-solid border-[var(--color-gray-300)] bg-white px-4 py-3 text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-primary)]"
            />
            {errors.address && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.address}</p>}
          </div>

          <div>
            <label htmlFor="aadhaar-region" className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]">
              {t("aadhaar.regionLabel")}
              <span className="text-[var(--color-error)]">*</span>
            </label>
            <div className="relative">
              <select
                id="aadhaar-region"
                value={region}
                onChange={(e) => { setRegion(e.target.value); clearError("region"); }}
                className="w-full appearance-none rounded-[var(--radius-standard)] border border-solid border-[var(--color-gray-300)] bg-white px-4 py-3 pr-10 text-[15px] text-[var(--color-text-primary)] focus:border-[var(--color-primary)]"
              >
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]">
                <ChevronDownIcon />
              </span>
            </div>
            {errors.region && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.region}</p>}
          </div>
        </div>

        {/* Consent */}
        <p className="mt-7 text-[13px] italic leading-relaxed text-[var(--color-text-secondary)]">
          {t("aadhaar.consentText")}
        </p>
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="radio" name="consent" checked={consent === true} onChange={() => { setConsent(true); clearError("consent"); }} className="h-[18px] w-[18px] accent-[var(--color-primary)]" />
            <span className="text-sm text-[var(--color-text-primary)]">{t("aadhaar.agreeYes")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="radio" name="consent" checked={consent === false} onChange={() => setConsent(false)} className="h-[18px] w-[18px] accent-[var(--color-primary)]" />
            <span className="text-sm text-[var(--color-text-primary)]">{t("aadhaar.agreeNo")}</span>
          </label>
        </div>
        {errors.consent && <p className="mt-2 text-xs text-[var(--color-error)]">{errors.consent}</p>}

        {/* Security note */}
        <div className="mt-5 mb-4 flex items-start gap-2.5 rounded-xl bg-green-50 px-4 py-3">
          <ShieldCheckIcon className="shrink-0" />
          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {t("aadhaar.secure")}
          </p>
        </div>
      </div>

      <BottomCta label={t("common.continue")} onClick={handleSubmit} loading={submitting} />
    </div>
  );
}

export default function AadhaarVerificationPage() {
  return (
    <AuthGuard>
      <AadhaarForm />
    </AuthGuard>
  );
}
