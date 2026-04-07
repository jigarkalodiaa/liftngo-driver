"use client";

import { useLiftngoSocketRuntimeStore } from "@/stores/liftngoSocketRuntimeStore";
import { useCustomerDispatchStore } from "@/stores/customerDispatchStore";
import LiftngoSocketStatusBanner from "./LiftngoSocketStatusBanner";

/**
 * Customer-facing trip + tracking (driven by `customerDispatchStore` + `useCustomerSocket`).
 */
export default function CustomerTripTracking() {
  const tripMachineState = useCustomerDispatchStore((s) => s.tripMachineState);
  const currentTrip = useCustomerDispatchStore((s) => s.currentTrip);
  const driver = currentTrip?.driver;
  const driverLocation = useCustomerDispatchStore((s) => s.driverLocation);
  const isSearching = useCustomerDispatchStore((s) => s.isSearching);
  const needsSearchRetry = useCustomerDispatchStore((s) => s.needsSearchRetry);
  const driverLocationStale = useCustomerDispatchStore((s) => s.driverLocationStale);
  const lastMessage = useCustomerDispatchStore((s) => s.lastMessage);
  const reset = useCustomerDispatchStore((s) => s.reset);

  const connected = useLiftngoSocketRuntimeStore((s) => s.connected);
  const reconnecting = useLiftngoSocketRuntimeStore((s) => s.reconnecting);
  const lastError = useLiftngoSocketRuntimeStore((s) => s.lastError);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Your trip</h1>
        <button
          type="button"
          onClick={() => reset()}
          className="text-xs font-semibold text-[var(--color-primary)]"
        >
          Reset state
        </button>
      </div>

      <LiftngoSocketStatusBanner connected={connected} reconnecting={reconnecting} lastError={lastError} />

      {isSearching ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 shadow-sm">
          <div className="size-10 animate-pulse rounded-full bg-[var(--color-primary)]/20" />
          <div>
            <p className="text-sm font-bold text-[var(--color-text-primary)]">Finding a driver…</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Matching you with nearby partners</p>
          </div>
        </div>
      ) : null}

      {needsSearchRetry && isSearching ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950">
          Taking longer than usual. Check connection or try again.
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Status</p>
        <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">{tripMachineState}</p>
        {currentTrip?.tripId ? (
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Trip ID: {currentTrip.tripId}</p>
        ) : null}
        {currentTrip?.rawStatus ? (
          <p className="mt-1 text-xs font-semibold text-[var(--color-primary)]">{currentTrip.rawStatus}</p>
        ) : null}
        {lastMessage ? <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{lastMessage}</p> : null}
      </div>

      {driver ? (
        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Driver</p>
          <p className="mt-1 font-bold text-[var(--color-text-primary)]">{driver.name ?? driver.id}</p>
          {driver.vehicleLabel ? (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{driver.vehicleLabel}</p>
          ) : null}
          {driver.phone ? <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{driver.phone}</p> : null}
        </div>
      ) : null}

      {driverLocation ? (
        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Live location
          </p>
          <p className="mt-1 font-mono text-sm text-[var(--color-text-primary)]">
            {driverLocation.lat.toFixed(5)}, {driverLocation.lng.toFixed(5)}
          </p>
          {driverLocationStale ? (
            <p className="mt-2 text-xs font-semibold text-amber-800">Location may be stale — reconnecting…</p>
          ) : null}
          <p className="mt-1 text-[11px] text-[var(--color-gray-400)]">
            Updated {new Date(driverLocation.updatedAt).toLocaleTimeString()}
          </p>
        </div>
      ) : null}
    </div>
  );
}
