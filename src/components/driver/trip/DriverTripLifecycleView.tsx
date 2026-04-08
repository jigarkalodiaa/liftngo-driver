"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ConfirmDialog from "@/components/driver/trip/ConfirmDialog";
import TripEarningsSummarySheet, {
  type TripEarningsSummaryPayload,
} from "@/components/driver/trip/TripEarningsSummarySheet";
import TripEnhancedMapCard from "@/components/driver/trip/TripEnhancedMapCard";
import TripGuidanceBanner from "@/components/driver/trip/TripGuidanceBanner";
import TripStepProgress from "@/components/driver/trip/TripStepProgress";
import { ArrowLeftIcon, MenuIcon } from "@/components/icons";
import { appendTripHistory } from "@/lib/driver/tripHistoryStorage";
import { useCancelTripVehicleBreakdownMutation } from "@/hooks/dispatch";
import { getNestAccessToken } from "@/services/driverPerformanceApi";
import { telPickupHref } from "@/lib/driver/tripAssignment";
import { onTripCancelled } from "@/lib/socket/driverSocketClient";
import { PaymentMode, TripStatus } from "@/lib/trip/tripStatus";
import type { DriverTripSnapshot } from "@/lib/trip/tripTypes";
import { isWalletBelowMinimum } from "@/lib/driver/walletConstants";
import { computePaymentWalletEffect } from "@/lib/trip/walletLedger";
import { useLocale } from "@/context/LocaleContext";
import { useTripPhaseGeolocation, type TripGeolocationSnapshot } from "@/hooks/useTripPhaseGeolocation";
import { useDriverPerformanceStore } from "@/stores/driverPerformanceStore";
import { useDriverTripStore } from "@/stores/driverTripStore";
import { useDriverWalletStore } from "@/stores/driverWalletStore";

const DriverSupportSheet = dynamic(() => import("@/components/driver/DriverSupportSheet"), { ssr: false });

function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPhone(phone10: string): string {
  const d = phone10.replace(/\D/g, "").slice(-10);
  if (d.length !== 10) return phone10;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

function canCancelVehicleBreakdown(status: TripStatus): boolean {
  const ok: TripStatus[] = [
    TripStatus.ASSIGNED,
    TripStatus.EN_ROUTE_TO_PICKUP,
    TripStatus.ARRIVED_AT_PICKUP,
    TripStatus.LOADING_CONFIRMED,
    TripStatus.TRIP_STARTED,
    TripStatus.EN_ROUTE_TO_DROP,
  ];
  return ok.includes(status);
}

/** Nest trip `id` is a UUID string. */
function isNestTripId(tripId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tripId);
}

function toastForStatus(status: TripStatus, t: (k: string) => string): string | null {
  switch (status) {
    case TripStatus.EN_ROUTE_TO_PICKUP:
      return t("tripUX.toastEnRoutePickup");
    case TripStatus.ARRIVED_AT_PICKUP:
      return t("tripUX.toastArrivedPickup");
    case TripStatus.LOADING_CONFIRMED:
      return t("tripUX.toastLoadingDone");
    case TripStatus.TRIP_STARTED:
      return t("tripUX.toastTripStarted");
    case TripStatus.EN_ROUTE_TO_DROP:
      return t("tripUX.toastEnRouteDrop");
    case TripStatus.ARRIVED_AT_DROP:
      return t("tripUX.toastArrivedDrop");
    case TripStatus.UNLOADING_CONFIRMED:
      return t("tripUX.toastUnloadingDone");
    case TripStatus.PAYMENT_PENDING:
      return t("tripUX.toastPaymentPending");
    case TripStatus.PAYMENT_COMPLETED:
      return t("tripUX.toastPaymentDone");
    default:
      return null;
  }
}

function StatusChip({ label }: { label: string }) {
  return (
    <span className="inline-block max-w-[100px] truncate rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
      {label}
    </span>
  );
}

type PrimaryBlockProps = {
  trip: DriverTripSnapshot;
  actionLoading: boolean;
  geo: TripGeolocationSnapshot;
  onCompleteTripModal: () => void;
  onCollectCashModal: () => void;
  t: (k: string, vars?: Record<string, string | number>) => string;
};

function PrimaryActionBlock({
  trip,
  actionLoading,
  geo,
  onCompleteTripModal,
  onCollectCashModal,
  t,
}: PrimaryBlockProps) {
  const transitionTo = useDriverTripStore((s) => s.transitionTo);
  const completePickupToOnTrip = useDriverTripStore((s) => s.completePickupToOnTrip);
  const completeDropToPaymentGate = useDriverTripStore((s) => s.completeDropToPaymentGate);
  const confirmUnloading = useDriverTripStore((s) => s.confirmUnloading);
  const beginCashCollection = useDriverTripStore((s) => s.beginCashCollection);
  const applyPaymentCompletion = useDriverTripStore((s) => s.applyPaymentCompletion);

  const ctaClass =
    "flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 py-4 text-base font-bold text-white shadow-md hover:opacity-95 disabled:pointer-events-none disabled:opacity-40";

  const Cta = ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <motion.button
      type="button"
      disabled={disabled || actionLoading}
      whileTap={actionLoading || disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={ctaClass}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );

  const Hint = ({ children }: { children: ReactNode }) => (
    <p className="mb-2 text-center text-[13px] font-medium leading-snug text-amber-800">{children}</p>
  );

  const pickupNeedsGeo =
    trip.status === TripStatus.EN_ROUTE_TO_PICKUP || trip.status === TripStatus.ARRIVED_AT_PICKUP;
  const canStartTripByGeo =
    !pickupNeedsGeo || (geo.ready && geo.nearPickup && !geo.permissionDenied);

  const onStartTripMerged = () => {
    if (pickupNeedsGeo) {
      if (geo.permissionDenied) {
        toast.error(t("tripFlow.enableLocationPickup"));
        return;
      }
      if (!geo.ready) {
        toast.error(t("tripFlow.waitingGps"));
        return;
      }
      if (!geo.nearPickup) {
        toast.error(t("tripFlow.reachPickupFirst"));
        return;
      }
    }
    void completePickupToOnTrip();
  };

  const onCompleteDeliveryMerged = () => {
    if (geo.permissionDenied) {
      toast.error(t("tripFlow.enableLocationDrop"));
      return;
    }
    if (!geo.ready) {
      toast.error(t("tripFlow.waitingGps"));
      return;
    }
    if (!geo.nearDrop) {
      toast.error(t("tripFlow.reachDropFirst"));
      return;
    }
    void completeDropToPaymentGate();
  };

  switch (trip.status) {
    case TripStatus.ASSIGNED:
      return (
        <Cta onClick={() => void transitionTo(TripStatus.EN_ROUTE_TO_PICKUP)}>{t("tripFlow.navToPickup")}</Cta>
      );
    case TripStatus.EN_ROUTE_TO_PICKUP:
    case TripStatus.ARRIVED_AT_PICKUP:
    case TripStatus.LOADING_CONFIRMED:
      return (
        <>
          {pickupNeedsGeo && geo.permissionDenied ? (
            <Hint>{t("tripFlow.enableLocationPickup")}</Hint>
          ) : null}
          {pickupNeedsGeo && !geo.permissionDenied && !geo.ready ? <Hint>{t("tripFlow.waitingGps")}</Hint> : null}
          {pickupNeedsGeo && geo.ready && !geo.nearPickup ? <Hint>{t("tripFlow.reachPickupFirst")}</Hint> : null}
          <Cta disabled={!canStartTripByGeo} onClick={onStartTripMerged}>
            {t("tripFlow.startTrip")}
          </Cta>
        </>
      );
    case TripStatus.TRIP_STARTED:
      return (
        <Cta onClick={() => void transitionTo(TripStatus.EN_ROUTE_TO_DROP)}>{t("tripFlow.navToDrop")}</Cta>
      );
    case TripStatus.EN_ROUTE_TO_DROP:
      return (
        <>
          {geo.permissionDenied ? <Hint>{t("tripFlow.enableLocationDrop")}</Hint> : null}
          {!geo.permissionDenied && !geo.ready ? <Hint>{t("tripFlow.waitingGps")}</Hint> : null}
          {geo.ready && !geo.nearDrop && !geo.permissionDenied ? <Hint>{t("tripFlow.reachDropFirst")}</Hint> : null}
          <Cta
            disabled={!geo.ready || !geo.nearDrop || geo.permissionDenied}
            onClick={onCompleteDeliveryMerged}
          >
            {t("tripFlow.completeDelivery")}
          </Cta>
        </>
      );
    case TripStatus.ARRIVED_AT_DROP:
      return <Cta onClick={() => void confirmUnloading()}>{t("tripFlow.confirmUnloading")}</Cta>;
    case TripStatus.UNLOADING_CONFIRMED:
      if (trip.paymentMode === PaymentMode.CASH) {
        return <Cta onClick={() => void beginCashCollection()}>{t("tripFlow.collectCash")}</Cta>;
      }
      return (
        <Cta
          onClick={() => {
            void (async () => {
              const ok = await transitionTo(TripStatus.PAYMENT_COMPLETED);
              if (ok) applyPaymentCompletion();
            })();
          }}
        >
          {t("tripFlow.confirmPrepaidContinue")}
        </Cta>
      );
    case TripStatus.PAYMENT_PENDING:
      return (
        <Cta onClick={onCollectCashModal}>
          {t("tripFlow.confirmCashCollected", { amount: formatInr(trip.fareInr) })}
        </Cta>
      );
    case TripStatus.PAYMENT_COMPLETED:
      return <Cta onClick={onCompleteTripModal}>{t("tripFlow.completeTrip")}</Cta>;
    default:
      return null;
  }
}

type DriverTripLifecycleViewProps = {
  /** Extra top padding when global connectivity banner is shown (socket / offline). */
  connectivityPad?: boolean;
};

export default function DriverTripLifecycleView({ connectivityPad = false }: DriverTripLifecycleViewProps) {
  const { t } = useLocale();
  const trip = useDriverTripStore((s) => s.activeTrip);
  const actionLoading = useDriverTripStore((s) => s.actionLoading);
  const paymentMismatchAlert = useDriverTripStore((s) => s.paymentMismatchAlert);
  const finalizeCashPayment = useDriverTripStore((s) => s.finalizeCashPayment);
  const completeTrip = useDriverTripStore((s) => s.completeTrip);
  const reset = useDriverTripStore((s) => s.reset);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [collectLoading, setCollectLoading] = useState(false);
  const [earningsOpen, setEarningsOpen] = useState(false);
  const [earningsData, setEarningsData] = useState<TripEarningsSummaryPayload | null>(null);
  const [breakdownWarnOpen, setBreakdownWarnOpen] = useState(false);
  const [breakdownConfirmOpen, setBreakdownConfirmOpen] = useState(false);
  const cancelBreakdownMut = useCancelTripVehicleBreakdownMutation();
  const [tripMenuOpen, setTripMenuOpen] = useState(false);
  const [tripHelpOpen, setTripHelpOpen] = useState(false);

  const tripIdRef = useRef<string | null>(null);
  const prevStatusRef = useRef<TripStatus | null>(null);

  const gpsDeniedToast = useCallback(() => {
    toast(t("tripFlow.gpsHint"));
  }, [t]);

  const tripGeo = useTripPhaseGeolocation(trip, gpsDeniedToast);

  useEffect(() => {
    return onTripCancelled((p) => {
      useDriverTripStore.getState().handleRemoteCancel(p.tripId, p.reason);
    });
  }, []);

  useEffect(() => {
    if (!tripMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTripMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [tripMenuOpen]);

  const closeTripMenu = useCallback(() => setTripMenuOpen(false), []);
  const openBreakdownFromMenu = useCallback(() => {
    setTripMenuOpen(false);
    setBreakdownWarnOpen(true);
  }, []);
  const openTripHelp = useCallback(() => {
    setTripMenuOpen(false);
    setTripHelpOpen(true);
  }, []);

  useEffect(() => {
    if (!trip) {
      tripIdRef.current = null;
      prevStatusRef.current = null;
      return;
    }
    if (tripIdRef.current !== trip.tripId) {
      tripIdRef.current = trip.tripId;
      prevStatusRef.current = trip.status;
      return;
    }
    const prev = prevStatusRef.current;
    if (prev !== trip.status) {
      prevStatusRef.current = trip.status;
      if (prev != null) {
        const msg = toastForStatus(trip.status, t);
        if (msg) toast.success(msg);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(35);
        }
      }
    }
  }, [trip, t]);

  if (!trip) return null;

  const handleFinalBreakdownCancel = async () => {
    const snap = useDriverTripStore.getState().activeTrip;
    if (!snap) return;
    if (!getNestAccessToken()) {
      toast.error(t("tripFlow.cancelBreakdownNeedAuth"));
      return;
    }
    if (!isNestTripId(snap.tripId)) {
      toast.error(t("tripFlow.cancelBreakdownNeedTripId"));
      setBreakdownConfirmOpen(false);
      return;
    }
    try {
      const res = await cancelBreakdownMut.mutateAsync(snap.tripId);
      if (!res.ok) {
        toast.error(t("tripFlow.cancelBreakdownFailed"), { description: res.message });
        return;
      }
      appendTripHistory({
        id: snap.tripId,
        orderId: snap.orderId,
        fareInr: snap.fareInr,
        paymentMode: snap.paymentMode,
        completedAt: Date.now(),
        driverShareInr: 0,
        commissionInr: 0,
        outcome: "cancelled",
        cancelReason: "VEHICLE_BREAKDOWN",
      });
      reset();
      useDriverPerformanceStore.getState().invalidate();
      setBreakdownConfirmOpen(false);
      toast.success(t("tripFlow.cancelBreakdownSuccess"));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(t("tripFlow.cancelBreakdownFailed"), { description: message });
    }
  };

  const showPickupDetails =
    trip.status === TripStatus.ASSIGNED ||
    trip.status === TripStatus.EN_ROUTE_TO_PICKUP ||
    trip.status === TripStatus.ARRIVED_AT_PICKUP ||
    trip.status === TripStatus.LOADING_CONFIRMED;

  const showDropDetails =
    trip.status === TripStatus.TRIP_STARTED ||
    trip.status === TripStatus.EN_ROUTE_TO_DROP ||
    trip.status === TripStatus.ARRIVED_AT_DROP ||
    trip.status === TripStatus.UNLOADING_CONFIRMED ||
    trip.status === TripStatus.PAYMENT_PENDING ||
    trip.status === TripStatus.PAYMENT_COMPLETED;

  const handleConfirmComplete = async () => {
    setCompleteOpen(false);
    const snap = useDriverTripStore.getState().activeTrip;
    if (!snap || snap.status !== TripStatus.PAYMENT_COMPLETED) return;
    const effect = computePaymentWalletEffect(snap.fareInr, snap.paymentMode);
    const ok = await completeTrip();
    if (ok) {
      appendTripHistory({
        id: snap.tripId,
        orderId: snap.orderId,
        fareInr: snap.fareInr,
        paymentMode: snap.paymentMode,
        completedAt: Date.now(),
        driverShareInr: effect.driverShare,
        commissionInr: effect.commission,
        outcome: "completed",
      });
      const walletBalance = useDriverWalletStore.getState().walletBalance;
      if (isWalletBelowMinimum(walletBalance)) {
        setEarningsData({
          orderId: snap.orderId,
          fareInr: snap.fareInr,
          paymentMode: snap.paymentMode,
          driverShare: effect.driverShare,
          walletDelta: effect.walletDelta,
        });
        setEarningsOpen(true);
      } else {
        toast.success(
          t("tripFlow.tripCompletedCompact", {
            share: formatInr(effect.driverShare),
            wallet: formatInr(walletBalance),
          }),
        );
      }
    }
  };

  const handleConfirmCash = async () => {
    setCollectLoading(true);
    try {
      const ok = await finalizeCashPayment(trip.fareInr);
      if (ok) {
        setCollectOpen(false);
        toast.success(t("tripFlow.paymentRecorded"));
      }
    } finally {
      setCollectLoading(false);
    }
  };

  const callPickupSlot = (
    <a href={telPickupHref(trip.pickupPhone)} className="w-full">
      {t("tripFlow.call", { phone: formatPhone(trip.pickupPhone) })}
    </a>
  );

  const statusHuman = trip.status.replace(/_/g, " ");

  return (
    <div className="fixed inset-0 z-[90] flex min-h-0 flex-col bg-[var(--color-gray-50)]">
      <header
        className={`flex shrink-0 items-center gap-2 border-b border-[var(--color-gray-200)] bg-white px-3 pb-2 shadow-sm ${
          connectivityPad ? "pt-12 sm:pt-14" : "pt-[max(0.5rem,env(safe-area-inset-top))]"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (trip.status === TripStatus.ASSIGNED) reset();
            else toast(t("tripFlow.finishOrSupport"));
          }}
          className="rounded-lg p-2 text-[var(--color-text-primary)] hover:bg-[var(--color-gray-100)]"
          aria-label={t("common.back")}
        >
          <ArrowLeftIcon />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-[var(--color-text-primary)]">{t("tripFlow.activeTrip")}</h1>
          <p className="truncate text-xs text-[var(--color-text-secondary)]">{trip.orderId}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <StatusChip label={statusHuman} />
          <div className="relative">
            <button
              type="button"
              onClick={() => setTripMenuOpen((o) => !o)}
              className="rounded-lg p-2 text-[var(--color-text-primary)] hover:bg-[var(--color-gray-100)]"
              aria-expanded={tripMenuOpen}
              aria-haspopup="menu"
              aria-label={t("tripFlow.tripMenuAria")}
            >
              <MenuIcon />
            </button>
            {tripMenuOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-[95] cursor-default bg-black/20"
                  aria-label={t("tripFlow.closeTripMenu")}
                  onClick={closeTripMenu}
                />
                <div
                  className="absolute right-0 top-[calc(100%+6px)] z-[96] min-w-[220px] rounded-xl border border-[var(--color-gray-200)] bg-white py-1 shadow-lg"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={openTripHelp}
                    className="flex w-full px-4 py-2.5 text-left text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-gray-50)]"
                  >
                    {t("tripFlow.menuTripHelp")}
                  </button>
                  {canCancelVehicleBreakdown(trip.status) ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={openBreakdownFromMenu}
                      disabled={actionLoading || cancelBreakdownMut.isPending}
                      className="flex w-full px-4 py-2.5 text-left text-sm font-bold text-red-800 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-45"
                    >
                      {t("tripFlow.cancelBreakdown")}
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pt-2 pb-[max(1rem,calc(5.5rem+env(safe-area-inset-bottom)))]">
        <div className="mx-auto max-w-lg space-y-2">
          <TripStepProgress status={trip.status} />
          <TripGuidanceBanner status={trip.status} />

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-gray-200)] bg-white px-2.5 py-2 text-[11px] shadow-sm">
            <span>
              {t("tripFlow.paymentLabel")}:{" "}
              <strong className="text-[var(--color-text-primary)]">{trip.paymentMode}</strong>
            </span>
            <span className="text-[var(--color-gray-300)]">·</span>
            <span>
              {t("tripFlow.fareLabel")}:{" "}
              <strong className="text-emerald-700">{formatInr(trip.fareInr)}</strong>
            </span>
          </div>

          {paymentMismatchAlert ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
              {paymentMismatchAlert}
            </div>
          ) : null}

          {showPickupDetails ? (
            <>
              <TripEnhancedMapCard
                title={t("tripFlow.pickupMap")}
                mapsLabel={t("tripFlow.openPickupMaps")}
                place={trip.pickup}
                phase="pickup"
                tripStatus={trip.status}
                callCustomerSlot={callPickupSlot}
              />
              <div className="rounded-xl border border-[var(--color-gray-200)] bg-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {t("tripFlow.pickup")}
                </p>
                <p className="mt-0.5 text-sm font-bold text-[var(--color-text-primary)]">{trip.pickup.title}</p>
                <p className="text-xs leading-snug text-[var(--color-text-secondary)]">{trip.pickup.subtitle}</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{trip.contactName}</p>
              </div>
            </>
          ) : null}

          {showDropDetails ? (
            <>
              <TripEnhancedMapCard
                title={t("tripFlow.dropMap")}
                mapsLabel={t("tripFlow.openDropMaps")}
                place={trip.drop}
                phase="drop"
                tripStatus={trip.status}
              />
              <div className="rounded-xl border border-[var(--color-gray-200)] bg-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {t("tripFlow.dropOff")}
                </p>
                <p className="mt-0.5 text-sm font-bold text-[var(--color-text-primary)]">{trip.drop.title}</p>
                <p className="text-xs leading-snug text-[var(--color-text-secondary)]">{trip.drop.subtitle}</p>
              </div>
            </>
          ) : null}

          {(trip.status === TripStatus.EN_ROUTE_TO_PICKUP || trip.status === TripStatus.EN_ROUTE_TO_DROP) && (
            <p className="pb-1 text-center text-[11px] leading-snug text-[var(--color-text-secondary)]">
              {t("tripFlow.liveShare")}
            </p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[var(--color-gray-200)]/90 bg-white/95 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <div className="mx-auto max-w-lg px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <PrimaryActionBlock
            trip={trip}
            actionLoading={actionLoading}
            geo={tripGeo}
            onCompleteTripModal={() => setCompleteOpen(true)}
            onCollectCashModal={() => setCollectOpen(true)}
            t={t}
          />
        </div>
      </div>

      <ConfirmDialog
        open={completeOpen}
        title={t("tripFlow.completeTitle")}
        description={`${t("tripFlow.completeDesc")}\n\n${t("tripFlow.completePaymentReminder")}`}
        confirmLabel={t("tripFlow.completeConfirm")}
        variant="danger"
        onCancel={() => setCompleteOpen(false)}
        onConfirm={() => void handleConfirmComplete()}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={collectOpen}
        title={t("tripFlow.cashTitle")}
        description={t("tripFlow.cashDesc", { amount: formatInr(trip.fareInr) })}
        confirmLabel={t("tripFlow.cashConfirm")}
        onCancel={() => setCollectOpen(false)}
        onConfirm={() => void handleConfirmCash()}
        loading={collectLoading || actionLoading}
      />

      <TripEarningsSummarySheet
        open={earningsOpen}
        onClose={() => {
          setEarningsOpen(false);
          setEarningsData(null);
        }}
        data={earningsData}
      />

      <ConfirmDialog
        open={breakdownWarnOpen}
        title={t("tripFlow.cancelBreakdownWarnTitle")}
        description={t("tripFlow.cancelBreakdownWarnBody")}
        confirmLabel={t("tripFlow.cancelBreakdownContinue")}
        onCancel={() => setBreakdownWarnOpen(false)}
        onConfirm={() => {
          setBreakdownWarnOpen(false);
          setBreakdownConfirmOpen(true);
        }}
        loading={cancelBreakdownMut.isPending}
      />

      <ConfirmDialog
        open={breakdownConfirmOpen}
        title={t("tripFlow.cancelBreakdownFinalTitle")}
        description={t("tripFlow.cancelBreakdownFinalDesc")}
        confirmLabel={t("tripFlow.cancelBreakdownConfirm")}
        variant="danger"
        onCancel={() => setBreakdownConfirmOpen(false)}
        onConfirm={() => void handleFinalBreakdownCancel()}
        loading={cancelBreakdownMut.isPending || actionLoading}
      />

      <DriverSupportSheet open={tripHelpOpen} onClose={() => setTripHelpOpen(false)} variant="trip" />
    </div>
  );
}
