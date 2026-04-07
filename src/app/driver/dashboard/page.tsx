"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DriverAvailabilityBottomCta from "@/components/driver/DriverAvailabilityBottomCta";
import DriverAvailabilityPanel from "@/components/driver/DriverAvailabilityPanel";
import DriverPartnerTierStrip from "@/components/driver/DriverPartnerTierStrip";
import DashboardWalletSummary from "@/components/driver/DashboardWalletSummary";
import DriverConnectivityBanner from "@/components/driver/DriverConnectivityBanner";
import { BellIcon, MenuIcon } from "@/components/icons";
import AuthGuard from "@/components/layout/AuthGuard";
import BrandLogo from "@/components/layout/BrandLogo";
import VerifiedDriverGuard from "@/components/layout/VerifiedDriverGuard";
import { useLocale } from "@/context/LocaleContext";
import { useDriverSelfie } from "@/context/DriverSelfieContext";
import { useDriverVehicle } from "@/context/DriverVehicleContext";
import { DRIVER_AUTH_TOKEN_KEY, DRIVER_LOGIN_PHONE_SESSION_KEY } from "@/lib/driver/authConstants";
import { getDriverTaggingFromToken, parseDriverToken } from "@/lib/driver/authToken";
import { clearDriverOnboardingProfile } from "@/lib/driver/driverOnboardingProfile";
import { DRIVER_NOTIFICATION_IDS, loadReadNotificationIds } from "@/lib/driver/driverNotificationsStorage";
import { DUMMY_INCOMING_ORDER, type IncomingOrderRequest } from "@/lib/driver/dummyOrderRequest";
import { appendMissedTripHistory } from "@/lib/driver/tripHistoryStorage";
import { tryAssignTrip } from "@/lib/driver/tripAssignment";
import { DriverAppMode } from "@/lib/driver/appMode";
import { useDriverAppMode } from "@/hooks/useDriverAppMode";
import { useDriverSocket } from "@/hooks/useDriverSocket";
import { useSocket } from "@/hooks/useSocket";
import DriverIncomingTripsPanel from "@/components/liftngo/DriverIncomingTripsPanel";
import { disconnectDriverSocket, emitDriverAvailability } from "@/lib/socket/driverSocketClient";
import { TripStatus } from "@/lib/trip/tripStatus";
import { useDriverAvailabilityStore } from "@/stores/driverAvailabilityStore";
import { useDriverEngagedTimeStore } from "@/stores/driverEngagedTimeStore";
import { useDriverSuspensionStore } from "@/stores/driverSuspensionStore";
import { useDriverTripStore } from "@/stores/driverTripStore";
import { useDriverDispatchStore } from "@/stores/driverDispatchStore";
import { useDriverWalletStore } from "@/stores/driverWalletStore";
import type { SideMenuAction } from "@/components/driver/DriverSideMenu";

const DriverTripLifecycleView = dynamic(
  () => import("@/components/driver/trip/DriverTripLifecycleView"),
  { ssr: false },
);

const DriverSideMenu = dynamic(() => import("@/components/driver/DriverSideMenu"));
const WalletBreakdownSheet = dynamic(() => import("@/components/driver/WalletBreakdownSheet"));
const DriverProfileSheet = dynamic(() => import("@/components/driver/DriverProfileSheet"));
const DriverNotificationsPanel = dynamic(() => import("@/components/driver/DriverNotificationsPanel"));
const DriverSupportSheet = dynamic(() => import("@/components/driver/DriverSupportSheet"));
const NewOrderRequestSheet = dynamic(() => import("@/components/driver/NewOrderRequestSheet"));

function emitAvailabilitySynced() {
  const receiving = useDriverAvailabilityStore.getState().isReceivingTrips;
  const suspended = useDriverSuspensionStore.getState().isSuspended();
  const seg = getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY))?.segment;
  emitDriverAvailability(receiving && !suspended, seg);
}

function MapPlaceholder() {
  return (
    <div
      className="absolute inset-0 bg-[#DCD9CF]"
      style={{
        backgroundImage: `
          linear-gradient(0deg, rgba(255,255,255,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px),
          linear-gradient(105deg, transparent 40%, rgba(180,175,160,0.35) 40%, rgba(180,175,160,0.35) 42%, transparent 42%),
          linear-gradient(15deg, transparent 55%, rgba(160,155,140,0.25) 55%, rgba(160,155,140,0.25) 56%, transparent 56%)
        `,
        backgroundSize: "28px 28px, 28px 28px, 100% 100%, 100% 100%",
      }}
      aria-hidden
    />
  );
}

function UserAvatarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashboardContent() {
  const { t } = useLocale();
  const router = useRouter();
  const { clearSelfie } = useDriverSelfie();
  const { clearVehicle } = useDriverVehicle();

  const activeTrip = useDriverTripStore((s) => s.activeTrip);
  const appMode = useDriverAppMode();
  const isReceivingTrips = useDriverAvailabilityStore((s) => s.isReceivingTrips);
  const setReceivingTrips = useDriverAvailabilityStore((s) => s.setReceivingTrips);
  const suspensionPermanent = useDriverSuspensionStore((s) => s.permanent);
  const suspensionUntilMs = useDriverSuspensionStore((s) => s.suspendedUntilMs);

  const isSuspended = useMemo(
    () =>
      suspensionPermanent || (suspensionUntilMs != null && Date.now() < suspensionUntilMs),
    [suspensionPermanent, suspensionUntilMs],
  );

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const driverSocketUserId = useMemo(
    () => parseDriverToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY))?.phone ?? null,
    [],
  );

  const { connected: socketConnected } = useSocket(driverSocketUserId, "DRIVER");

  const driverAuthToken = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem(DRIVER_AUTH_TOKEN_KEY) : null),
    [],
  );

  useDriverSocket({ enabled: Boolean(driverSocketUserId), authToken: driverAuthToken });

  const [socketHadConnected, setSocketHadConnected] = useState(false);
  const [notificationBadgeTick, setNotificationBadgeTick] = useState(0);
  const [incomingOrder, setIncomingOrder] = useState<IncomingOrderRequest | null>(null);
  const incomingOrderRef = useRef<IncomingOrderRequest | null>(null);
  incomingOrderRef.current = incomingOrder;

  const [assigningTrip, setAssigningTrip] = useState(false);
  const [browserOnline, setBrowserOnline] = useState(true);

  const closeSideMenu = useCallback(() => setSideMenuOpen(false), []);
  const openWallet = useCallback(() => setWalletOpen(true), []);
  const closeWallet = useCallback(() => setWalletOpen(false), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const closeSupport = useCallback(() => setSupportOpen(false), []);
  const openProfile = useCallback(() => setProfileOpen(true), []);
  const openNotifications = useCallback(() => setNotificationsOpen(true), []);
  const openSideMenu = useCallback(() => setSideMenuOpen(true), []);

  const onNotificationReadsChanged = useCallback(() => {
    setNotificationBadgeTick((n) => n + 1);
  }, []);

  useEffect(() => {
    const onBrowserNet = () => setBrowserOnline(navigator.onLine);
    setBrowserOnline(navigator.onLine);
    window.addEventListener("online", onBrowserNet);
    window.addEventListener("offline", onBrowserNet);
    return () => {
      window.removeEventListener("online", onBrowserNet);
      window.removeEventListener("offline", onBrowserNet);
    };
  }, []);

  useEffect(() => {
    useDriverSuspensionStore.getState().refreshFromClock();
  }, []);

  useEffect(() => {
    if (suspensionPermanent || suspensionUntilMs == null) return;
    const delay = Math.max(0, suspensionUntilMs - Date.now() + 500);
    const id = window.setTimeout(() => {
      useDriverSuspensionStore.getState().refreshFromClock();
    }, delay);
    return () => window.clearTimeout(id);
  }, [suspensionPermanent, suspensionUntilMs]);

  useEffect(() => {
    const onVis = () => useDriverSuspensionStore.getState().refreshFromClock();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!isSuspended) return;
    setReceivingTrips(false);
    const seg = getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY))?.segment;
    emitDriverAvailability(false, seg);
  }, [isSuspended, setReceivingTrips]);

  useEffect(() => {
    if (socketConnected) {
      setSocketHadConnected(true);
      emitAvailabilitySynced();
    }
  }, [socketConnected]);

  useEffect(() => {
    const done = useDriverTripStore.persist.onFinishHydration(() => {
      const trip = useDriverTripStore.getState().activeTrip;
      if (trip?.status === TripStatus.TRIP_COMPLETED) {
        useDriverTripStore.getState().reset();
      }
    });
    return done;
  }, []);

  useEffect(() => {
    if (!isReceivingTrips || appMode === DriverAppMode.TRIP_MODE || isSuspended) {
      if (!isReceivingTrips || isSuspended) setIncomingOrder(null);
      return;
    }
    const timerId = window.setTimeout(() => {
      setIncomingOrder(DUMMY_INCOMING_ORDER);
    }, 2200);
    return () => window.clearTimeout(timerId);
  }, [isReceivingTrips, appMode, isSuspended]);

  /** Partner-time signal (local): counts foreground time while online for trips or on an active trip. */
  useEffect(() => {
    const engaged = Boolean(activeTrip) || (isReceivingTrips && !isSuspended);
    const pulse = () => useDriverEngagedTimeStore.getState().pulse(engaged);
    pulse();
    const id = window.setInterval(pulse, 5000);
    const onVis = () => pulse();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [activeTrip, isReceivingTrips, isSuspended]);

  const unreadNotificationCount = useMemo(() => {
    void notificationBadgeTick;
    const read = loadReadNotificationIds();
    return DRIVER_NOTIFICATION_IDS.filter((id) => !read.has(id)).length;
  }, [notificationBadgeTick]);

  const handleSignOut = useCallback(() => {
    clearSelfie();
    clearVehicle();
    useDriverTripStore.getState().reset();
    useDriverWalletStore.getState().reset();
    useDriverAvailabilityStore.getState().reset();
    useDriverSuspensionStore.getState().reset();
    useDriverEngagedTimeStore.getState().reset();
    localStorage.removeItem("liftngo-driver-trip");
    localStorage.removeItem("liftngo-driver-wallet");
    localStorage.removeItem("liftngo-driver-availability");
    localStorage.removeItem("liftngo-driver-suspension");
    localStorage.removeItem("liftngo-driver-engaged-time");
    localStorage.removeItem(DRIVER_AUTH_TOKEN_KEY);
    sessionStorage.removeItem(DRIVER_LOGIN_PHONE_SESSION_KEY);
    clearDriverOnboardingProfile();
    disconnectDriverSocket();
    useDriverDispatchStore.getState().reset();
    setSideMenuOpen(false);
    router.replace("/driver/login");
  }, [clearSelfie, clearVehicle, router]);

  const handleMenuSelect = useCallback(
    (action: SideMenuAction) => {
      setSideMenuOpen(false);
      switch (action) {
        case "profile":
          setProfileOpen(true);
          break;
        case "wallet":
          setWalletOpen(true);
          break;
        case "tripHistory":
          router.push("/driver/trip-history");
          break;
        case "help":
          router.push("/faq");
          break;
        case "terms":
          router.push("/driver/terms");
          break;
        case "support":
          setSupportOpen(true);
          break;
        case "logout":
          handleSignOut();
          break;
      }
    },
    [handleSignOut, router],
  );

  const onGoOnline = useCallback(() => {
    useDriverSuspensionStore.getState().refreshFromClock();
    if (useDriverSuspensionStore.getState().isSuspended()) return;
    setReceivingTrips(true);
    emitAvailabilitySynced();
    toast.success(t("dashboard.nowOnlineCelebration"));
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([35, 25, 35]);
    }
  }, [setReceivingTrips, t]);

  const onGoOffline = useCallback(() => {
    setReceivingTrips(false);
    emitAvailabilitySynced();
    toast.message(t("dashboard.offline"));
  }, [setReceivingTrips, t]);

  const clearIncomingOrder = useCallback(() => setIncomingOrder(null), []);

  const handleAcceptOrder = useCallback(async () => {
    const order = incomingOrderRef.current;
    if (!order) return;
    setAssigningTrip(true);
    try {
      const result = await tryAssignTrip(order);
      clearIncomingOrder();
      if (result.ok) {
        const token = localStorage.getItem(DRIVER_AUTH_TOKEN_KEY);
        const phone = parseDriverToken(token)?.phone ?? "unknown";
        useDriverTripStore.getState().startFromAssignment(result.trip, order, phone);
        toast.success(t("dashboard.tripAssigned"));
      } else {
        toast(t("dashboard.tripTaken"), { duration: 5000 });
      }
    } finally {
      setAssigningTrip(false);
    }
  }, [clearIncomingOrder, t]);

  const handleOrderExpire = useCallback(() => {
    const order = incomingOrderRef.current;
    toast.error(t("dashboard.requestMissedTripTitle"), {
      description: t("dashboard.requestMissedTripBody"),
      duration: 7000,
    });
    if (order) {
      appendMissedTripHistory({
        id: order.id,
        fareInr: order.fareInr,
        paymentMode: order.paymentMode,
      });
    }
    clearIncomingOrder();
    const tagging = getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY));
    const score = tagging?.performanceScore;
    if (typeof score !== "number") return;
    useDriverSuspensionStore.getState().recordMissWhenBelowThreshold(score);
  }, [clearIncomingOrder, t]);

  const isTripMode = appMode === DriverAppMode.TRIP_MODE;
  const expectingTripAssignments = isReceivingTrips && !isTripMode && !isSuspended;
  const showConnectivityPad =
    !browserOnline || (!socketConnected && (expectingTripAssignments || isTripMode));

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <DriverConnectivityBanner
        browserOnline={browserOnline}
        socketConnected={socketConnected}
        socketHadConnected={socketHadConnected}
        expectingTripAssignments={expectingTripAssignments}
        activeTrip={Boolean(activeTrip)}
      />
      <MapPlaceholder />

      {activeTrip ? <DriverTripLifecycleView connectivityPad={showConnectivityPad} /> : null}

      <DriverSideMenu open={sideMenuOpen} onClose={closeSideMenu} onSelect={handleMenuSelect} />

      <WalletBreakdownSheet open={walletOpen} onClose={closeWallet} />

      <DriverProfileSheet open={profileOpen} onClose={closeProfile} />

      <DriverNotificationsPanel
        open={notificationsOpen}
        onClose={closeNotifications}
        onReadsChanged={onNotificationReadsChanged}
      />

      <DriverSupportSheet open={supportOpen} onClose={closeSupport} />

      {incomingOrder && !activeTrip ? (
        <NewOrderRequestSheet
          order={incomingOrder}
          assigning={assigningTrip}
          onAccept={handleAcceptOrder}
          onExpire={handleOrderExpire}
        />
      ) : null}

      {!isTripMode ? (
        <header
          className={`sticky top-0 z-[51] flex shrink-0 items-center justify-between gap-2 border-b border-white/30 bg-[#DCD9CF]/90 px-4 pb-3 shadow-sm backdrop-blur-md ${
            showConnectivityPad ? "pt-12 sm:pt-14" : "pt-[max(1rem,env(safe-area-inset-top))]"
          }`}
        >
          <button
            type="button"
            onClick={openProfile}
            className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-md"
            aria-label={t("dashboard.profile")}
          >
            <UserAvatarIcon className="text-[var(--color-gray-500)]" />
            <span
              className={`absolute bottom-1 right-1 size-3 rounded-full border-2 border-white ${
                isReceivingTrips ? "bg-emerald-500" : "bg-[var(--color-gray-400)]"
              }`}
              aria-hidden
            />
          </button>

          <div className="flex min-w-0 flex-1 justify-center px-1">
            <BrandLogo variant="compact" className="h-8 w-auto max-w-[min(160px,42vw)] opacity-95" />
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openNotifications}
              className="relative flex size-11 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-md text-[var(--color-text-primary)]"
              aria-label={t("dashboard.notificationsTitle")}
            >
              <BellIcon />
              {unreadNotificationCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={openSideMenu}
              className="flex size-11 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-md text-[var(--color-text-primary)]"
              aria-label={t("dashboard.menu")}
            >
              <MenuIcon />
            </button>
          </div>
        </header>
      ) : null}

      {!isTripMode ? (
        <>
          <div className="relative z-[20] flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-4 pb-4 pt-3 pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto">
            <div className="pointer-events-auto space-y-3">
              <DriverAvailabilityPanel
                hidden={false}
                isReceivingTrips={isReceivingTrips}
                showWaitingNudge={isReceivingTrips && !incomingOrder}
              />
            </div>
            <div className="mt-3 space-y-3">
              <DriverPartnerTierStrip hidden={false} />
              <DashboardWalletSummary
                onOpenWallet={openWallet}
                onOpenPartnerTier={() => router.push("/driver/partner-tier")}
                onOpenTripHistory={() => router.push("/driver/trip-history")}
              />
              <DriverIncomingTripsPanel hidden={Boolean(activeTrip)} />
            </div>
          </div>
          <DriverAvailabilityBottomCta
            hidden={isSuspended}
            isReceivingTrips={isReceivingTrips}
            onGoOnline={onGoOnline}
            onGoOffline={onGoOffline}
          />
        </>
      ) : null}
    </div>
  );
}

export default function DriverDashboardPage() {
  return (
    <AuthGuard>
      <VerifiedDriverGuard>
        <DashboardContent />
      </VerifiedDriverGuard>
    </AuthGuard>
  );
}
