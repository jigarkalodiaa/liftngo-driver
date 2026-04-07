"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/context/LocaleContext";
import { haversineKm, estimateEtaMinutes } from "@/lib/geo/haversineKm";
import { mapsDirectionsUrl, openStreetMapEmbedUrl } from "@/lib/driver/tripAssignment";
import type { TripPlace } from "@/lib/trip/tripTypes";
import { TripStatus } from "@/lib/trip/tripStatus";

type TripEnhancedMapCardProps = {
  title: string;
  mapsLabel: string;
  place: TripPlace;
  /** When en route, compare driver GPS to this pin for badge. */
  phase: "pickup" | "drop";
  tripStatus: TripStatus;
  callCustomerSlot?: React.ReactNode;
};

export default function TripEnhancedMapCard({
  title,
  mapsLabel,
  place,
  phase,
  tripStatus,
  callCustomerSlot,
}: TripEnhancedMapCardProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const embedUrl = openStreetMapEmbedUrl(place.lat, place.lng);
  const dirUrl = mapsDirectionsUrl(place.lat, place.lng);

  const enRoutePickup = tripStatus === TripStatus.EN_ROUTE_TO_PICKUP;
  const enRouteDrop = tripStatus === TripStatus.EN_ROUTE_TO_DROP;
  const showLiveEta = (phase === "pickup" && enRoutePickup) || (phase === "drop" && enRouteDrop);

  const [geoKm, setGeoKm] = useState<number | null>(null);

  useEffect(() => {
    if (!showLiveEta || typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoKm(null);
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, place.lat, place.lng);
        setGeoKm(km);
      },
      () => setGeoKm(null),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [showLiveEta, place.lat, place.lng]);

  const badgeText = useMemo(() => {
    if (showLiveEta && geoKm != null) {
      const eta = estimateEtaMinutes(geoKm);
      return t("tripUX.mapEtaBadge", { km: geoKm.toFixed(1), mins: eta });
    }
    return null;
  }, [showLiveEta, geoKm, t]);

  const recenter = useCallback(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <motion.div
      ref={containerRef}
      layout
      className="overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-md"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-gray-100)] px-3 py-2">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{title}</p>
        <div className="flex items-center gap-1">
          {badgeText ? (
            <span className="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
              {badgeText}
            </span>
          ) : null}
          <button
            type="button"
            onClick={recenter}
            className="rounded-lg border border-[var(--color-gray-200)] px-2 py-1 text-[10px] font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-gray-50)]"
          >
            {t("tripUX.mapRecenter")}
          </button>
        </div>
      </div>
      <div className="relative h-[200px] w-full bg-[var(--color-gray-200)]">
        <iframe title={title} src={embedUrl} className="size-full border-0" loading="lazy" />
        <div
          className="pointer-events-none absolute left-3 top-3 flex size-9 items-center justify-center rounded-full border-2 border-white bg-[var(--color-primary)] text-xs font-bold text-white shadow-md"
          aria-hidden
        >
          {phase === "pickup" ? "P" : "D"}
        </div>
        <p className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-lg bg-black/55 px-2 py-1 text-center text-[10px] font-medium text-white">
          {t("tripUX.mapRouteHint")}
        </p>
      </div>
      <div className="grid gap-2 border-t border-[var(--color-gray-100)] p-3 sm:grid-cols-2">
        <a
          href={dirUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-xl bg-[var(--color-primary)] py-3 text-center text-sm font-bold text-white hover:opacity-95"
        >
          {mapsLabel}
        </a>
        {callCustomerSlot ? (
          <div className="[&_a]:flex [&_a]:h-full [&_a]:min-h-[48px] [&_a]:items-center [&_a]:justify-center [&_a]:rounded-xl [&_a]:border-2 [&_a]:border-[var(--color-primary)] [&_a]:bg-white [&_a]:text-sm [&_a]:font-bold [&_a]:text-[var(--color-primary)]">
            {callCustomerSlot}
          </div>
        ) : (
          <span />
        )}
      </div>
    </motion.div>
  );
}
