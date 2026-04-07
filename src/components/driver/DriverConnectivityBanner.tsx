"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/context/LocaleContext";

type DriverConnectivityBannerProps = {
  browserOnline: boolean;
  socketConnected: boolean;
  socketHadConnected: boolean;
  /** Driver is "online" for trips and not on an active trip — offers need live connection. */
  expectingTripAssignments: boolean;
  /** Active trip — show trip-specific socket copy so drivers know local steps still work. */
  activeTrip: boolean;
};

/**
 * Top-of-screen clarity: internet vs server link when offers or live trip sync depend on it.
 * Avoids technical jargon; pairs with local online/offline intent.
 */
function DriverConnectivityBanner({
  browserOnline,
  socketConnected,
  socketHadConnected,
  expectingTripAssignments,
  activeTrip,
}: DriverConnectivityBannerProps) {
  const { t } = useLocale();

  const showNoInternet = !browserOnline;
  const showTripSocketProblem =
    activeTrip && browserOnline && !socketConnected && socketHadConnected;
  const showTripSocketConnecting =
    activeTrip && browserOnline && !socketConnected && !socketHadConnected;
  const showIdleSocketProblem =
    !activeTrip &&
    browserOnline &&
    expectingTripAssignments &&
    !socketConnected &&
    socketHadConnected;
  const showIdleSocketConnecting =
    !activeTrip &&
    browserOnline &&
    expectingTripAssignments &&
    !socketConnected &&
    !socketHadConnected;

  const messageKey = showNoInternet
    ? "dashboard.bannerNoInternet"
    : showTripSocketProblem
      ? "dashboard.bannerSocketTripIssue"
      : showTripSocketConnecting
        ? "dashboard.bannerSocketTripConnecting"
        : showIdleSocketProblem
          ? "dashboard.bannerSocketIssue"
          : showIdleSocketConnecting
            ? "dashboard.bannerSocketConnecting"
            : null;

  const visible = messageKey !== null;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key={messageKey}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="pointer-events-none fixed left-0 right-0 top-0 z-[100] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <div
            className={`pointer-events-auto flex max-w-lg items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-md ${
              showNoInternet
                ? "border-rose-200/90 bg-rose-50 text-rose-900"
                : "border-amber-200/80 bg-amber-50 text-amber-900"
            }`}
          >
            <span className="relative flex size-2 shrink-0">
              <span
                className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${
                  showNoInternet ? "bg-rose-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex size-2 rounded-full ${
                  showNoInternet ? "bg-rose-500" : "bg-amber-500"
                }`}
              />
            </span>
            {t(messageKey)}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default memo(DriverConnectivityBanner);
