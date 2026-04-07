"use client";

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useLocale } from "@/context/LocaleContext";
import type { DriverVehicleCategory } from "@/context/DriverVehicleContext";
import { useDriverVehicle } from "@/context/DriverVehicleContext";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import { getDriverTaggingFromToken, parseDriverToken } from "@/lib/driver/authToken";
import { DriverSegment } from "@/lib/driver/driverSegment";
import type { DriverOnboardingProfileSnapshot } from "@/lib/driver/driverOnboardingProfile";
import { loadDriverOnboardingProfile } from "@/lib/driver/driverOnboardingProfile";

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
  }, [open, category, details, ownerInformation]);

  const partnerTagging = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY));
  }, [open]);

  const displayName =
    merged.aadhaarName?.trim() ||
    merged.panHolderName?.trim() ||
    merged.bankAccountHolderName?.trim() ||
    "";
  const phoneRaw = merged.phone?.trim() || sessionPhoneFromToken()?.trim() || "";
  const panLine =
    merged.panNumber?.trim() && merged.panHolderName?.trim()
      ? `${merged.panNumber.trim().toUpperCase()} · ${merged.panHolderName.trim()}`
      : merged.panNumber?.trim()
        ? merged.panNumber.trim().toUpperCase()
        : merged.panHolderName?.trim() || "";

  const hasVehicleBit =
    !!merged.vehicleCategory ||
    !!merged.registrationNumber?.trim() ||
    !!merged.vehicleTypeDetail?.trim() ||
    !!merged.bodyType?.trim() ||
    merged.isVehicleOwner === false;

  const hasAny =
    !!displayName ||
    !!phoneRaw ||
    !!merged.region ||
    !!panLine ||
    !!merged.bankAccountHolderName?.trim() ||
    hasVehicleBit;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-start">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t("dashboard.profileClose")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-profile-title"
        className="relative flex h-full w-[min(100%,380px)] flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-gray-200)] px-4 py-3">
          <h2 id="driver-profile-title" className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("dashboard.profileTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-gray-50)]"
          >
            {t("dashboard.profileClose")}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
          {(() => {
            const initials =
              displayName
                .split(/\s+/)
                .filter(Boolean)
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "?";
            return (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-base font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[var(--color-text-primary)]">
                    {displayName || t("dashboard.profile")}
                  </p>
                  <p className="text-xs font-semibold text-emerald-700">{t("dashboard.profileKycVerified")}</p>
                </div>
              </div>
            );
          })()}
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
          {!hasAny ? (
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">{t("dashboard.profileEmpty")}</p>
          ) : (
            <>
              <Row label={t("dashboard.profileName")} value={displayName} />
              <Row label={t("dashboard.profilePhone")} value={phoneRaw ? formatPhoneDisplay(phoneRaw) : ""} />
              <Row label={t("dashboard.profileRegion")} value={merged.region?.trim() ?? ""} />
              {panLine ? <Row label={t("dashboard.profilePan")} value={panLine} /> : null}
              {!panLine && merged.panHolderName?.trim() ? (
                <Row label={t("dashboard.profilePanName")} value={merged.panHolderName.trim()} />
              ) : null}
              <Row label={t("dashboard.profileBankHolder")} value={merged.bankAccountHolderName?.trim() ?? ""} />
              {merged.vehicleCategory ? (
                <Row
                  label={t("dashboard.profileVehicleCategory")}
                  value={categoryLabel(merged.vehicleCategory, t)}
                />
              ) : null}
              <Row label={t("dashboard.profileRegNumber")} value={merged.registrationNumber?.trim() ?? ""} />
              <Row label={t("dashboard.profileVehicleType")} value={merged.vehicleTypeDetail?.trim() ?? ""} />
              <Row label={t("dashboard.profileBodyType")} value={merged.bodyType?.trim() ?? ""} />
              {merged.isVehicleOwner !== undefined && (merged.registrationNumber?.trim() || merged.vehicleCategory) ? (
                <Row
                  label={t("dashboard.profileIsOwner")}
                  value={merged.isVehicleOwner ? t("dashboard.profileYes") : t("dashboard.profileNo")}
                />
              ) : null}
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
          )}
        </div>
      </div>
    </div>
  );
}
