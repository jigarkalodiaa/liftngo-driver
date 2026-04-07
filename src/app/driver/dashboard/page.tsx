"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DriverAvailabilityPanel from "@/components/driver/DriverAvailabilityPanel";
import DriverPartnerTierCard from "@/components/driver/DriverPartnerTierCard";
import DashboardWalletSummary from "@/components/driver/DashboardWalletSummary";
import DriverConnectivityBanner from "@/components/driver/DriverConnectivityBanner";
import { BellIcon, MenuIcon } from "@/components/icons";
import AuthGuard from "@/components/layout/AuthGuard";
import VerifiedDriverGuard from "@/components/layout/VerifiedDriverGuard";
import { useLocale } from "@/context/LocaleContext";
import { useDriverSelfie } from "@/context/DriverSelfieContext";
import { useDriverVehicle } from "@/context/DriverVehicleContext";
import { DRIVER_AUTH_TOKEN_KEY, DRIVER_LOGIN_PHONE_SESSION_KEY } from "@/lib/driver/authConstants";
import { getDriverTaggingFromToken, parseDriverToken } from "@/lib/driver/authToken";
import { clearDriverOnboardingProfile } from "@/lib/driver/driverOnboardingProfile";
import { DRIVER_NOTIFICATION_IDS, loadReadNotificationIds } from "@/lib/driver/driverNotificationsStorage";
import { DUMMY_INCOMING_ORDER, type IncomingOrderRequest } from "@/lib/driver/dummyOrderRequest";
import { tryAssignTrip } from "@/lib/driver/tripAssignment";
import { DriverAppMode } from "@/lib/driver/appMode";
import { useDriverAppMode } from "@/hooks/useDriverAppMode";
import { connectDriverSocket, emitDriverAvailability } from "@/lib/socket/driverSocketClient";
import { TripStatus } from "@/lib/trip/tripStatus";
import { useDriverAvailabilityStore } from "@/stores/driverAvailabilityStore";
import { useDriverTripStore } from "@/stores/driverTripStore";
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

function emitAvailability(available: boolean) {
  const seg = getDriverTaggingFromToken(localStorage.getItem(DRIVER_AUTH_TOKEN_KEY))?.segment;
  emitDriverAvailability(available, seg);
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
  const routerRef = useRef(router);
  routerRef.current = router;
  const { clearSelfie } = useDriverSelfie();
  const { clearVehicle } = useDriverVehicle();

  const activeTrip = useDriverTripStore((s) => s.activeTrip);
  const appMode = useDriverAppMode();
  const isReceivingTrips = useDriverAvailabilityStore((s) => s.isReceivingTrips);
  const setReceivingTrips = useDriverAvailabilityStore((s) => s.setReceivingTrips);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
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
    const token = localStorage.getItem(DRIVER_AUTH_TOKEN_KEY);
    const phone = parseDriverToken(token)?.phone ?? "unknown";
    const s = connectDriverSocket(phone);
    const onConnect = () => {
      setSocketHadConnected(true);
      setSocketConnected(true);
      emitAvailability(useDriverAvailabilityStore.getState().isReceivingTrips);
    };
    const onDisconnect = () => setSocketConnected(false);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    if (s.connected) {
      setSocketHadConnected(true);
      setSocketConnected(true);
      emitAvailability(useDriverAvailabilityStore.getState().isReceivingTrips);
    } else {
      setSocketConnected(false);
    }
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);

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
    if (!isReceivingTrips || appMode === DriverAppMode.TRIP_MODE) {
      if (!isReceivingTrips) setIncomingOrder(null);
      return;
    }
    const timerId = window.setTimeout(() => {
      setIncomingOrder(DUMMY_INCOMING_ORDER);
    }, 2200);
    return () => window.clearTimeout(timerId);
  }, [isReceivingTrips, appMode]);

  const unreadNotificationCount = useMemo(() => {
    void notificationBadgeTick;
    const read = loadReadNotificationIds();
    return DRIVER_NOTIFICATION_IDS.filter((id) => !read.has(id)).length;
  }, [notificationBadgeTick, notificationsOpen]);

  const handleSignOut = useCallback(() => {
    clearSelfie();
    clearVehicle();
    useDriverTripStore.getState().reset();
    useDriverWalletStore.getState().reset();
    useDriverAvailabilityStore.getState().reset();
    localStorage.removeItem("liftngo-driver-trip");
    localStorage.removeItem("liftngo-driver-wallet");
    localStorage.removeItem("liftngo-driver-availability");
    localStorage.removeItem(DRIVER_AUTH_TOKEN_KEY);
    sessionStorage.removeItem(DRIVER_LOGIN_PHONE_SESSION_KEY);
    clearDriverOnboardingProfile();
    setSideMenuOpen(false);
    routerRef.current.replace("/driver/login");
  }, [clearSelfie, clearVehicle]);

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
          routerRef.current.push("/driver/trip-history");
          break;
        case "help":
          routerRef.current.push("/faq");
          break;
        case "terms":
          routerRef.current.push("/driver/terms");
          break;
        case "support":
          setSupportOpen(true);
          break;
        case "logout":
          handleSignOut();
          break;
      }
    },
    [handleSignOut],
  );

  const onGoOnline = useCallback(() => {
    setReceivingTrips(true);
    emitAvailability(true);
    toast.success(t("dashboard.nowOnlineCelebration"));
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([35, 25, 35]);
    }
  }, [setReceivingTrips, t]);

  const onGoOffline = useCallback(() => {
    setReceivingTrips(false);
    emitAvailability(false);
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
    toast(t("dashboard.requestTimeout"));
    clearIncomingOrder();
  }, [clearIncomingOrder, t]);

  const isTripMode = appMode === DriverAppMode.TRIP_MODE;
  const expectingTripAssignments = isReceivingTrips && !isTripMode;
  const showConnectivityPad = !browserOnline || (expectingTripAssignments && !socketConnected);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <DriverConnectivityBanner
        browserOnline={browserOnline}
        socketConnected={socketConnected}
        socketHadConnected={socketHadConnected}
        expectingTripAssignments={expectingTripAssignments}
      />
      <MapPlaceholder />

      {activeTrip ? <DriverTripLifecycleView /> : null}

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
          className={`sticky top-0 z-50 flex shrink-0 items-start justify-between border-b border-white/30 bg-[#DCD9CF]/90 px-4 pb-3 shadow-sm backdrop-blur-md ${
            showConnectivityPad ? "pt-12 sm:pt-14" : "pt-[max(1rem,env(safe-area-inset-top))]"
          }`}
        >
          <button
            type="button"
            onClick={openProfile}
            className="relative flex size-12 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-md"
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

          <div className="relative flex items-center gap-2">
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
        <div className="relative z-40 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-4 pb-8 pt-3 pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto">
          <DriverAvailabilityPanel
            hidden={false}
            isReceivingTrips={isReceivingTrips}
            showWaitingNudge={isReceivingTrips && !incomingOrder}
            onGoOnline={onGoOnline}
            onGoOffline={onGoOffline}
          />
          <div className="mt-3 space-y-3">
            <DriverPartnerTierCard hidden={false} />
            <DashboardWalletSummary onOpen={openWallet} />
          </div>
        </div>
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
