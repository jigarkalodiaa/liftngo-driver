import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import { getDriverTaggingFromToken } from "@/lib/driver/authToken";
import { isWalletBelowMinimum } from "@/lib/driver/walletConstants";
import { emitDriverAvailability } from "@/lib/socket/driverSocketClient";
import { patchDriverOnline } from "@/services/api";
import { useDriverAvailabilityStore } from "@/stores/driverAvailabilityStore";
import { useDriverPerformanceStore } from "@/stores/driverPerformanceStore";
import { useDriverSuspensionStore } from "@/stores/driverSuspensionStore";
import { useDriverWalletStore } from "@/stores/driverWalletStore";

/** Emit socket availability from current stores (miss suspension, breakdown, wallet minimum). */
export function emitDriverAvailabilitySynced() {
  const receiving = useDriverAvailabilityStore.getState().isReceivingTrips;
  const suspended = useDriverSuspensionStore.getState().isSuspended();
  const snap = useDriverPerformanceStore.getState().serverSnapshot;
  let breakdown = false;
  if (snap?.breakdownSuspended) {
    breakdown =
      !snap.breakdownSuspendedUntil || Date.now() < new Date(snap.breakdownSuspendedUntil).getTime();
  }
  const walletBlocked = isWalletBelowMinimum(useDriverWalletStore.getState().walletBalance);
  const nestTagging = snap ? { segment: snap.segment } : null;
  const seg =
    nestTagging?.segment ?? getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY))?.segment;
  const available = receiving && !suspended && !breakdown && !walletBlocked;
  emitDriverAvailability(available, seg);

  if (typeof window === "undefined") return;
  if (!localStorage.getItem(DRIVER_AUTH_TOKEN_KEY)) return;
  void patchDriverOnline(available).then((r) => {
    if (!r.ok && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[driver] PATCH driver online failed", r.status, r.message);
    }
  });
}
