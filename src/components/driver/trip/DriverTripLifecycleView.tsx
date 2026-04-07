"use client";

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
import { ArrowLeftIcon } from "@/components/icons";
import { appendTripHistory } from "@/lib/driver/tripHistoryStorage";
import { telPickupHref } from "@/lib/driver/tripAssignment";
import { onTripCancelled } from "@/lib/socket/driverSocketClient";
import { PaymentMode, TripStatus } from "@/lib/trip/tripStatus";
import type { DriverTripSnapshot } from "@/lib/trip/tripTypes";
import { computePaymentWalletEffect } from "@/lib/trip/walletLedger";
import { useLocale } from "@/context/LocaleContext";
import { useTripLiveLocation } from "@/hooks/useTripLiveLocation";
import { useDriverTripStore } from "@/stores/driverTripStore";

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

function StatusChip({ trip, label }: { trip: DriverTripSnapshot; label: string }) {
  return (
    <span className="inline-block max-w-[120px] truncate rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
      {label}
    </span>
  );
}

type PrimaryBlockProps = {
  trip: DriverTripSnapshot;
  actionLoading: boolean;
  onStartTripModal: () => void;
  onCompleteTripModal: () => void;
  onCollectCashModal: () => void;
  t: (k: string, vars?: Record<string, string | number>) => string;
};

function PrimaryActionBlock({
  trip,
  actionLoading,
  onStartTripModal,
  onCompleteTripModal,
  onCollectCashModal,
  t,
}: PrimaryBlockProps) {
  const transitionTo = useDriverTripStore((s) => s.transitionTo);
  const confirmUnloading = useDriverTripStore((s) => s.confirmUnloading);
  const beginCashCollection = useDriverTripStore((s) => s.beginCashCollection);

  const btn =
    "flex w-full items-center justify-center rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-bold text-white hover:opacity-95 disabled:pointer-events-none disabled:opacity-45";

  const Btn = ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick: () => void;
  }) => (
    <motion.button
      type="button"
      disabled={actionLoading}
      whileTap={actionLoading ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={btn}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );

  switch (trip.status) {
    case TripStatus.ASSIGNED:
      return (
        <Btn onClick={() => void transitionTo(TripStatus.EN_ROUTE_TO_PICKUP)}>{t("tripFlow.startNav")}</Btn>
      );
    case TripStatus.EN_ROUTE_TO_PICKUP:
      return (
        <Btn onClick={() => void transitionTo(TripStatus.ARRIVED_AT_PICKUP)}>{t("tripFlow.reachedPickup")}</Btn>
      );
    case TripStatus.ARRIVED_AT_PICKUP:
      return (
        <Btn onClick={() => void transitionTo(TripStatus.LOADING_CONFIRMED)}>{t("tripFlow.confirmLoading")}</Btn>
      );
    case TripStatus.LOADING_CONFIRMED:
      return <Btn onClick={onStartTripModal}>{t("tripFlow.startTrip")}</Btn>;
    case TripStatus.TRIP_STARTED:
      return (
        <Btn onClick={() => void transitionTo(TripStatus.EN_ROUTE_TO_DROP)}>{t("tripFlow.navToDrop")}</Btn>
      );
    case TripStatus.EN_ROUTE_TO_DROP:
      return (
        <Btn onClick={() => void transitionTo(TripStatus.ARRIVED_AT_DROP)}>{t("tripFlow.reachedDrop")}</Btn>
      );
    case TripStatus.ARRIVED_AT_DROP:
      return <Btn onClick={() => void confirmUnloading()}>{t("tripFlow.confirmUnloading")}</Btn>;
    case TripStatus.UNLOADING_CONFIRMED:
      if (trip.paymentMode === PaymentMode.CASH) {
        return <Btn onClick={() => void beginCashCollection()}>{t("tripFlow.collectCash")}</Btn>;
      }
      return (
        <p className="text-center text-sm text-[var(--color-text-secondary)]">{t("tripFlow.prepaidContinue")}</p>
      );
    case TripStatus.PAYMENT_PENDING:
      return (
        <Btn onClick={onCollectCashModal}>
          {t("tripFlow.confirmCashCollected", { amount: formatInr(trip.fareInr) })}
        </Btn>
      );
    case TripStatus.PAYMENT_COMPLETED:
      return <Btn onClick={onCompleteTripModal}>{t("tripFlow.completeTrip")}</Btn>;
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
  const transitionTo = useDriverTripStore((s) => s.transitionTo);
  const finalizeCashPayment = useDriverTripStore((s) => s.finalizeCashPayment);
  const completeTrip = useDriverTripStore((s) => s.completeTrip);
  const reset = useDriverTripStore((s) => s.reset);

  const [startTripOpen, setStartTripOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [collectLoading, setCollectLoading] = useState(false);
  const [earningsOpen, setEarningsOpen] = useState(false);
  const [earningsData, setEarningsData] = useState<TripEarningsSummaryPayload | null>(null);

  const tripIdRef = useRef<string | null>(null);
  const prevStatusRef = useRef<TripStatus | null>(null);

  const gpsDeniedToast = useCallback(() => {
    toast(t("tripFlow.gpsHint"));
  }, [t]);

  useTripLiveLocation(
    trip?.tripId ?? null,
    trip?.status === TripStatus.EN_ROUTE_TO_PICKUP || trip?.status === TripStatus.EN_ROUTE_TO_DROP,
    gpsDeniedToast,
  );

  useEffect(() => {
    return onTripCancelled((p) => {
      useDriverTripStore.getState().handleRemoteCancel(p.tripId, p.reason);
    });
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

  const handleConfirmStartTrip = async () => {
    setStartTripOpen(false);
    await transitionTo(TripStatus.TRIP_STARTED);
  };

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
      setEarningsData({
        orderId: snap.orderId,
        fareInr: snap.fareInr,
        paymentMode: snap.paymentMode,
        driverShare: effect.driverShare,
        walletDelta: effect.walletDelta,
      });
      setEarningsOpen(true);
      toast.success(t("tripFlow.tripCompleted"));
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
    <div className="fixed inset-0 z-[90] flex flex-col bg-[var(--color-gray-50)]">
      <header
        className={`flex shrink-0 items-center gap-3 border-b border-[var(--color-gray-200)] bg-white px-3 pb-3 shadow-sm ${
          connectivityPad ? "pt-12 sm:pt-14" : "pt-[max(0.75rem,env(safe-area-inset-top))]"
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
        <StatusChip trip={trip} label={statusHuman} />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
        <div className="mx-auto max-w-lg space-y-4">
          <TripStepProgress status={trip.status} />
          <TripGuidanceBanner status={trip.status} />

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-gray-200)] bg-white px-3 py-2.5 text-xs shadow-sm">
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
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
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
              <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 shadow-md">
                <p className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">
                  {t("tripFlow.pickup")}
                </p>
                <p className="mt-1 font-bold text-[var(--color-text-primary)]">{trip.pickup.title}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{trip.pickup.subtitle}</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{trip.contactName}</p>
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
              <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 shadow-md">
                <p className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">
                  {t("tripFlow.dropOff")}
                </p>
                <p className="mt-1 font-bold text-[var(--color-text-primary)]">{trip.drop.title}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{trip.drop.subtitle}</p>
              </div>
            </>
          ) : null}

          {(trip.status === TripStatus.EN_ROUTE_TO_PICKUP || trip.status === TripStatus.EN_ROUTE_TO_DROP) && (
            <p className="text-center text-xs text-[var(--color-text-secondary)]">{t("tripFlow.liveShare")}</p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[var(--color-gray-200)] bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto max-w-lg">
          <PrimaryActionBlock
            trip={trip}
            actionLoading={actionLoading}
            onStartTripModal={() => setStartTripOpen(true)}
            onCompleteTripModal={() => setCompleteOpen(true)}
            onCollectCashModal={() => setCollectOpen(true)}
            t={t}
          />
        </div>
      </div>

      <ConfirmDialog
        open={startTripOpen}
        title={t("tripFlow.startTripTitle")}
        description={t("tripFlow.startTripDesc")}
        confirmLabel={t("tripFlow.startTripConfirm")}
        onCancel={() => setStartTripOpen(false)}
        onConfirm={() => void handleConfirmStartTrip()}
        loading={actionLoading}
      />

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
    </div>
  );
}
