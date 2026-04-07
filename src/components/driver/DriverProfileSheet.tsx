"use client";

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { XMarkIcon } from "@/components/icons";
import BrandLogo from "@/components/layout/BrandLogo";
import DriverSuspensionPolicyCard from "@/components/driver/DriverSuspensionPolicyCard";
import { useLocale } from "@/context/LocaleContext";
import { useDriverSelfie } from "@/context/DriverSelfieContext";
import type { DriverVehicleCategory } from "@/context/DriverVehicleContext";
import { useDriverVehicle } from "@/context/DriverVehicleContext";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import {
  getDriverTaggingFromToken,
  isDriverSessionVerified,
  parseDriverToken,
} from "@/lib/driver/authToken";
import {
  DriverSegment,
  PREMIUM_MAX_CANCELLATION_RATE_PCT,
  PREMIUM_MIN_PERFORMANCE_SCORE,
} from "@/lib/driver/driverSegment";
import type { DriverOnboardingProfileSnapshot } from "@/lib/driver/driverOnboardingProfile";
import { loadDriverOnboardingProfile } from "@/lib/driver/driverOnboardingProfile";
import { engagedTimeMinutesParts, useDriverEngagedTimeStore } from "@/stores/driverEngagedTimeStore";

function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(-10);
  if (d.length !== 10) return phone.trim() || "—";
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

function categoryLabel(cat: DriverVehicleCategory | null | undefined, t: (k: string) => string): string {
  if (!cat) return "—";
  if (cat === "walk") return t("dashboard.vehicleCatWalk");
  if (cat === "bike") return t("dashboard.vehicleCatBike");
  return t("dashboard.vehicleCatMiniTruck");
}

function mergeWithVehicleContext(
  stored: DriverOnboardingProfileSnapshot,
  category: DriverVehicleCategory | null,
  details: ReturnType<typeof useDriverVehicle>["details"],
  ownerInformation: ReturnType<typeof useDriverVehicle>["ownerInformation"],
): DriverOnboardingProfileSnapshot {
  const base: DriverOnboardingProfileSnapshot = { ...stored };
  if (category != null) base.vehicleCategory = category;

  const reg = details.registrationNumber.trim();
  if (reg) base.registrationNumber = reg;
  if (reg || category != null) {
    const vtd = details.vehicleTypeDetail.trim();
    const bt = details.bodyType.trim();
    if (vtd) base.vehicleTypeDetail = vtd;
    if (bt) base.bodyType = bt;
    base.isVehicleOwner = details.isOwner;
  }

  const on = ownerInformation.fullName.trim();
  const op = ownerInformation.phone.trim();
  if (on) base.rcOwnerName = on;
  if (op) base.rcOwnerPhone = op;

  return base;
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="border-b border-[var(--color-gray-100)] py-3 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-[15px] font-medium text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

type DriverProfileSheetProps = {
  open: boolean;
  onClose: () => void;
};

function sessionPhoneFromToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return parseDriverToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY))?.phone;
}

export default function DriverProfileSheet({ open, onClose }: DriverProfileSheetProps) {
  const { t } = useLocale();
  const { category, details, ownerInformation } = useDriverVehicle();
  const { selfie } = useDriverSelfie();
  const todayEngagedSeconds = useDriverEngagedTimeStore((s) => s.todaySeconds);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const merged = useMemo(() => {
    const stored = loadDriverOnboardingProfile();
    return mergeWithVehicleContext(stored, category, details, ownerInformation);
  }, [category, details, ownerInformation]);

  const partnerTagging = useMemo(() => {
    if (typeof window === "undefined" || !open) return null;
    return getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY));
  }, [open]);

  const sessionVerified = useMemo(() => {
    if (typeof window === "undefined" || !open) return false;
    return isDriverSessionVerified(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY));
  }, [open]);

  const displayNameRaw =
    merged.aadhaarName?.trim() ||
    merged.panHolderName?.trim() ||
    merged.bankAccountHolderName?.trim() ||
    "";
  const heroName = displayNameRaw || t("dashboard.profilePartnerFallback");
  const phoneRaw = merged.phone?.trim() || sessionPhoneFromToken()?.trim() || "";
  const heroPhone = phoneRaw ? formatPhoneDisplay(phoneRaw) : "";

  const panLine =
    merged.panNumber?.trim() && merged.panHolderName?.trim()
      ? `${merged.panNumber.trim().toUpperCase()} · ${merged.panHolderName.trim()}`
      : merged.panNumber?.trim()
        ? merged.panNumber.trim().toUpperCase()
        : merged.panHolderName?.trim() || "";

  const vehCategory = merged.vehicleCategory ?? category;
  const vehRegRaw = merged.registrationNumber?.trim() || details.registrationNumber.trim();
  const vehicleContextActive = Boolean(details.registrationNumber.trim()) || category != null;
  const useExpandedVehicle = sessionVerified || vehicleContextActive;
  const vehType =
    merged.vehicleTypeDetail?.trim() ||
    (useExpandedVehicle ? details.vehicleTypeDetail.trim() : "");
  const vehBody =
    merged.bodyType?.trim() || (useExpandedVehicle ? details.bodyType.trim() : "");
  const vehOwner =
    merged.isVehicleOwner !== undefined ? merged.isVehicleOwner : details.isOwner;
  const vehRegDisplay = vehRegRaw || (sessionVerified ? t("dashboard.profileRegOnFile") : "");

  const initials = useMemo(() => {
    if (displayNameRaw) {
      const parts = displayNameRaw.split(/\s+/).filter(Boolean);
      const s = parts.map((w) => w[0]).join("").toUpperCase().slice(0, 2);
      if (s) return s;
    }
    const digits = phoneRaw.replace(/\D/g, "");
    if (digits.length >= 2) return digits.slice(-2);
    return "?";
  }, [displayNameRaw, phoneRaw]);

  const { hours: engagedH, minutes: engagedM } = engagedTimeMinutesParts(todayEngagedSeconds);

  const hasMoreDetailRows =
    !!merged.region?.trim() ||
    !!panLine ||
    !!merged.bankAccountHolderName?.trim() ||
    (merged.isVehicleOwner === false && (!!merged.rcOwnerName?.trim() || !!merged.rcOwnerPhone?.trim()));

  if (!open) return null;

  const closeLabel = t("dashboard.profileClose");

  return (
    <div className="fixed inset-0 z-[70] flex justify-start">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label={closeLabel} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-profile-title"
        className="relative flex h-full w-[min(100%,380px)] flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-gray-200)] px-3 py-2 pl-4">
          <h2 id="driver-profile-title" className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("dashboard.profileTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-gray-100)]"
            aria-label={closeLabel}
          >
            <XMarkIcon className="size-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
          {/* Verified partner: photo, name, phone, logo, scores, vehicle — one card */}
          <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-[var(--color-gray-100)] bg-[var(--color-gray-50)]/80 p-3">
              {selfie?.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob: preview from capture flow
                <img
                  src={selfie.previewUrl}
                  alt=""
                  className="size-14 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-base font-bold text-white ring-2 ring-white shadow-sm">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {t("dashboard.profileVehiclePartnerTitle")}
                </p>
                <p className="mt-0.5 text-base font-bold leading-tight text-[var(--color-text-primary)]">{heroName}</p>
                {heroPhone ? (
                  <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">{heroPhone}</p>
                ) : null}
                <p className="mt-1.5 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                  {t("dashboard.profileKycVerified")}
                </p>
              </div>
              <BrandLogo variant="compact" className="h-9 w-auto max-w-[100px] shrink-0 object-contain opacity-95" />
            </div>

            {partnerTagging ? (
              <div className="grid grid-cols-2 gap-2 border-b border-[var(--color-gray-100)] px-3 py-3">
                <div className="rounded-xl bg-[var(--color-gray-50)] px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                    {t("dashboard.profileScoreLabel")}
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-[var(--color-primary)]">
                    {Number.isInteger(partnerTagging.performanceScore)
                      ? String(partnerTagging.performanceScore)
                      : partnerTagging.performanceScore.toFixed(1)}
                  </p>
                  <p className="mt-1 text-[9px] font-semibold text-[var(--color-text-secondary)]">
                    {partnerTagging.performanceScore >= PREMIUM_MIN_PERFORMANCE_SCORE
                      ? t("dashboard.profileScoreStatusMet", { min: PREMIUM_MIN_PERFORMANCE_SCORE })
                      : t("dashboard.profileScoreStatusNot", { min: PREMIUM_MIN_PERFORMANCE_SCORE })}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--color-gray-50)] px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                    {t("dashboard.profileCancellationLabel")}
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-[var(--color-primary)]">
                    {partnerTagging.cancellationRatePct % 1 === 0
                      ? `${partnerTagging.cancellationRatePct}%`
                      : `${partnerTagging.cancellationRatePct.toFixed(1)}%`}
                  </p>
                  <p className="mt-1 text-[9px] font-semibold text-[var(--color-text-secondary)]">
                    {partnerTagging.cancellationRatePct < PREMIUM_MAX_CANCELLATION_RATE_PCT
                      ? t("dashboard.profileCancelStatusMet", { max: PREMIUM_MAX_CANCELLATION_RATE_PCT })
                      : t("dashboard.profileCancelStatusNot", { max: PREMIUM_MAX_CANCELLATION_RATE_PCT })}
                  </p>
                </div>
              </div>
            ) : (
              <p className="border-b border-[var(--color-gray-100)] px-3 py-2.5 text-xs text-[var(--color-text-secondary)]">
                {t("dashboard.profileScoreUnavailable")}
              </p>
            )}

            <div className="px-3 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {t("dashboard.profileVehicleSubheading")}
              </p>
              <dl className="mt-2 space-y-2 text-sm">
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
                    {t("dashboard.profileVehicleCategory")}
                  </dt>
                  <dd className="font-semibold text-[var(--color-text-primary)]">{categoryLabel(vehCategory, t)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
                    {t("dashboard.profileRegNumber")}
                  </dt>
                  <dd className="font-bold tabular-nums text-[var(--color-text-primary)]">
                    {vehRegDisplay || (sessionVerified ? t("dashboard.profileRegOnFile") : "—")}
                  </dd>
                </div>
                {vehType ? (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
                      {t("dashboard.profileVehicleType")}
                    </dt>
                    <dd className="font-medium text-[var(--color-text-primary)]">{vehType}</dd>
                  </div>
                ) : sessionVerified ? (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
                      {t("dashboard.profileVehicleType")}
                    </dt>
                    <dd className="font-medium text-[var(--color-text-primary)]">—</dd>
                  </div>
                ) : null}
                {vehBody ? (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
                      {t("dashboard.profileBodyType")}
                    </dt>
                    <dd className="font-medium text-[var(--color-text-primary)]">{vehBody}</dd>
                  </div>
                ) : sessionVerified ? (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
                      {t("dashboard.profileBodyType")}
                    </dt>
                    <dd className="font-medium text-[var(--color-text-primary)]">—</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
                    {t("dashboard.profileIsOwner")}
                  </dt>
                  <dd className="font-medium text-[var(--color-text-primary)]">
                    {vehOwner ? t("dashboard.profileYes") : t("dashboard.profileNo")}
                  </dd>
                </div>
              </dl>
              {sessionVerified ? (
                <p className="mt-2 text-[10px] leading-relaxed text-[var(--color-text-secondary)]">
                  {t("dashboard.profileVehicleVerifiedNote")}
                </p>
              ) : !useExpandedVehicle ? (
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {t("dashboard.profileVehicleIncomplete")}
                </p>
              ) : null}
            </div>
          </div>

          {partnerTagging ? (
            <p className="mt-2 text-[10px] leading-relaxed text-[var(--color-text-secondary)] px-0.5">
              {t("dashboard.profileMetricsHint")}
            </p>
          ) : null}

          {/* Today's engaged time */}
          <div className="mt-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-900/80">
              {t("dashboard.profileTodayEngagedLabel")}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-950">
              {engagedH}h {engagedM}m
            </p>
          </div>

          {partnerTagging ? (
            <div
              className={`mt-3 rounded-2xl border px-3 py-3 ${
                partnerTagging.segment === DriverSegment.PREMIUM
                  ? "border-amber-200/90 bg-gradient-to-br from-amber-50 to-amber-100/80"
                  : "border-[var(--color-gray-200)] bg-[var(--color-gray-50)]"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {partnerTagging.segment === DriverSegment.PREMIUM
                  ? t("dashboard.segmentPremiumTitle")
                  : t("dashboard.segmentStandardTitle")}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-primary)]">
                {partnerTagging.segment === DriverSegment.PREMIUM
                  ? t("dashboard.segmentPremiumBody")
                  : t("dashboard.segmentStandardBody")}
              </p>
              <p className="mt-2 text-[10px] leading-relaxed text-[var(--color-text-secondary)]">
                {t("dashboard.segmentDispatchHint")}
              </p>
            </div>
          ) : null}

          <div className="mt-3">
            <DriverSuspensionPolicyCard />
          </div>

          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/90 px-3 py-2.5">
            <p className="text-xs font-bold text-[var(--color-text-primary)]">{t("dashboard.profileDocsTitle")}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {t("dashboard.profileDocsHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.message(t("dashboard.profileEditSoon"))}
            className="mt-3 w-full rounded-xl border border-[var(--color-gray-200)] py-2.5 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-gray-50)]"
          >
            {t("dashboard.profileEdit")}
          </button>

          {hasMoreDetailRows ? (
            <>
              <p className="mb-1 mt-5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {t("dashboard.profileMoreDetails")}
              </p>
              <Row label={t("dashboard.profileRegion")} value={merged.region?.trim() ?? ""} />
              {panLine ? <Row label={t("dashboard.profilePan")} value={panLine} /> : null}
              {!panLine && merged.panHolderName?.trim() ? (
                <Row label={t("dashboard.profilePanName")} value={merged.panHolderName.trim()} />
              ) : null}
              <Row label={t("dashboard.profileBankHolder")} value={merged.bankAccountHolderName?.trim() ?? ""} />
              {merged.isVehicleOwner === false ? (
                <>
                  <Row label={t("dashboard.profileRcOwner")} value={merged.rcOwnerName?.trim() ?? ""} />
                  <Row
                    label={t("dashboard.profileRcOwnerPhone")}
                    value={merged.rcOwnerPhone?.trim() ? formatPhoneDisplay(merged.rcOwnerPhone) : ""}
                  />
                </>
              ) : null}
            </>
          ) : !displayNameRaw && !phoneRaw && !partnerTagging && !sessionVerified ? (
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">{t("dashboard.profileEmpty")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
