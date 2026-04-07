"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import { driverDispatchAcceptTrip, driverDispatchRejectTrip } from "@/services/dispatchActions";
import { useDriverDispatchStore } from "@/stores/driverDispatchStore";
import { useLiftngoSocketRuntimeStore } from "@/stores/liftngoSocketRuntimeStore";
import type { DispatchTrip } from "@/types/dispatch";
import LiftngoSocketStatusBanner from "./LiftngoSocketStatusBanner";

function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function useOfferCountdownMs(deadline: number | undefined): number {
  const [left, setLeft] = useState(() =>
    deadline ? Math.max(0, deadline - Date.now()) : 0,
  );
  useEffect(() => {
    if (!deadline) {
      setLeft(0);
      return;
    }
    setLeft(Math.max(0, deadline - Date.now()));
    const id = window.setInterval(() => setLeft(Math.max(0, deadline - Date.now())), 250);
    return () => window.clearInterval(id);
  }, [deadline]);
  return left;
}

function OfferRow({
  trip,
  token,
  connected,
}: {
  trip: DispatchTrip;
  token: string | null;
  connected: boolean;
}) {
  const locks = useDriverDispatchStore((s) => s.actionLocks);
  const external = useDriverDispatchStore((s) => s.externalBusyTripIds);
  const leftMs = useOfferCountdownMs(trip.offerExpiresAt);
  const busyKind = locks.get(trip.tripId);
  const locked = Boolean(busyKind) || external.has(trip.tripId);
  const acceptBusy = busyKind === "accept";

  const onAccept = useCallback(async () => {
    const res = await driverDispatchAcceptTrip(trip.tripId, token);
    if (!res.ok) toast.error("Accept failed", { description: res.message });
  }, [trip.tripId, token]);

  const onReject = useCallback(async () => {
    const res = await driverDispatchRejectTrip(trip.tripId, token);
    if (!res.ok) toast.error("Reject failed", { description: res.message });
  }, [trip.tripId, token]);

  const sec = Math.ceil(leftMs / 1000);

  return (
    <li className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-[var(--color-text-primary)]">{trip.orderId ?? trip.tripId}</p>
          <p
            className={`mt-1 text-[11px] font-bold tabular-nums ${leftMs <= 3000 ? "text-red-600" : "text-[var(--color-text-secondary)]"}`}
          >
            {leftMs > 0 ? `Respond in ${sec}s` : "Offer window ended"}
          </p>
        </div>
        {typeof trip.fareInr === "number" ? (
          <p className="shrink-0 text-sm font-bold text-emerald-700">{formatInr(trip.fareInr)}</p>
        ) : null}
      </div>
      {trip.pickup?.title ? (
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-text-primary)]">Pickup:</span> {trip.pickup.title}
        </p>
      ) : null}
      {trip.drop?.title ? (
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-text-primary)]">Drop:</span> {trip.drop.title}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={locked || !connected || acceptBusy || leftMs <= 0}
          onClick={() => void onAccept()}
          className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-xs font-bold text-white hover:opacity-95 disabled:opacity-45"
        >
          {acceptBusy ? "Accepting…" : "Accept"}
        </button>
        <button
          type="button"
          disabled={locked || !connected || busyKind === "reject"}
          onClick={() => void onReject()}
          className="flex-1 rounded-xl border-2 border-[var(--color-gray-200)] py-2.5 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-gray-50)] disabled:opacity-45"
        >
          {busyKind === "reject" ? "…" : "Reject"}
        </button>
      </div>
    </li>
  );
}

type Props = {
  hidden?: boolean;
};

/**
 * Production dispatch UI: Map-backed offers, countdown, accept locking, socket fallback banner.
 */
export default function DriverIncomingTripsPanel({ hidden }: Props) {
  const offers = useDriverDispatchStore(
    useShallow((s) =>
      Array.from(s.availableTrips.values()).sort((a, b) => (a.offerExpiresAt ?? 0) - (b.offerExpiresAt ?? 0)),
    ),
  );
  const activeTrip = useDriverDispatchStore((s) => s.activeTrip);
  const connected = useLiftngoSocketRuntimeStore((s) => s.connected);
  const reconnecting = useLiftngoSocketRuntimeStore((s) => s.reconnecting);
  const lastError = useLiftngoSocketRuntimeStore((s) => s.lastError);

  const token = typeof window !== "undefined" ? localStorage.getItem(DRIVER_AUTH_TOKEN_KEY) : null;

  const showSkeleton = !connected && offers.length === 0;

  if (hidden) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[var(--color-text-primary)]">Live dispatch</p>
        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
          Offers
        </span>
      </div>
      <LiftngoSocketStatusBanner connected={connected} reconnecting={reconnecting} lastError={lastError} />
      {activeTrip ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
          Active trip: {activeTrip.orderId ?? activeTrip.tripId} · {activeTrip.machineState}
        </p>
      ) : null}
      {showSkeleton ? (
        <div className="space-y-2 animate-pulse rounded-2xl border border-[var(--color-gray-100)] bg-white p-4">
          <div className="h-4 w-2/3 rounded bg-[var(--color-gray-200)]" />
          <div className="h-3 w-1/2 rounded bg-[var(--color-gray-100)]" />
          <div className="mt-3 h-10 w-full rounded-xl bg-[var(--color-gray-100)]" />
        </div>
      ) : null}
      {offers.length === 0 && !showSkeleton ? (
        <p className="rounded-xl border border-dashed border-[var(--color-gray-200)] bg-white px-3 py-4 text-center text-xs text-[var(--color-text-secondary)]">
          Waiting for <code className="text-[10px]">trip:new</code> from dispatch.
        </p>
      ) : offers.length > 0 ? (
        <ul className="space-y-2">
          {offers.map((trip) => (
            <OfferRow key={trip.tripId} trip={trip} token={token} connected={connected} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
