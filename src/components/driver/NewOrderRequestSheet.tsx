"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import type { IncomingOrderRequest } from "@/lib/driver/dummyOrderRequest";
import { ORDER_REQUEST_TIMEOUT_SEC } from "@/lib/driver/dummyOrderRequest";

function formatInrWhole(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

function PickupIcon() {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" />
        <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5" opacity="0.85" />
      </svg>
    </div>
  );
}

function DropIcon() {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-500 shadow-sm" aria-hidden>
      <svg width="16" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="11" r="2.5" fill="white" />
      </svg>
    </div>
  );
}

const HANDLE_PX = 52;
const TRACK_PAD_PX = 8;
const ACCEPT_RATIO = 0.86;

type AcceptSliderProps = {
  disabled?: boolean;
  acceptLabel: string;
  onAccept: () => void;
};

function AcceptSlider({ disabled, acceptLabel, onAccept }: AcceptSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  /** Synced from layout/resize/pointer for a11y (no ref reads during render). */
  const [maxOffset, setMaxOffset] = useState(0);
  const maxOffsetRef = useRef(0);
  const drag = useRef({ active: false, startClient: 0, startOffset: 0 });
  const acceptedRef = useRef(false);

  const updateMax = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    const m = Math.max(0, t.clientWidth - HANDLE_PX - TRACK_PAD_PX * 2);
    maxOffsetRef.current = m;
    setMaxOffset(m);
  }, []);

  useLayoutEffect(() => {
    updateMax();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateMax());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateMax]);

  const finishAccept = useCallback(() => {
    if (acceptedRef.current) return;
    acceptedRef.current = true;
    const m = maxOffsetRef.current;
    setOffset(m);
    onAccept();
  }, [onAccept]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || acceptedRef.current) return;
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    drag.current = { active: true, startClient: e.clientX, startOffset: offset };
    updateMax();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || acceptedRef.current) return;
    updateMax();
    const dx = e.clientX - drag.current.startClient;
    const max = maxOffsetRef.current;
    const next = Math.min(max, Math.max(0, drag.current.startOffset + dx));
    setOffset(next);
    if (max > 0 && next >= max * ACCEPT_RATIO) finishAccept();
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (acceptedRef.current) return;
    setOffset(0);
  };

  return (
    <div
      ref={trackRef}
      className="relative h-[52px] w-full select-none overflow-hidden rounded-xl bg-[var(--color-primary)] shadow-inner"
    >
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold tracking-wide text-white/95">
        {acceptLabel}
      </span>
      <div
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(maxOffset > 0 ? (offset / maxOffset) * 100 : 0)}
        aria-label={acceptLabel}
        className="absolute top-1/2 z-[1] flex size-[52px] cursor-grab touch-none items-center justify-center rounded-lg bg-[#3d3e6e] active:cursor-grabbing"
        style={{
          left: TRACK_PAD_PX,
          transform: `translateX(${offset}px) translateY(-50%)`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <span className="text-lg font-bold leading-none text-white">&raquo;&raquo;</span>
      </div>
    </div>
  );
}

type NewOrderRequestSheetProps = {
  order: IncomingOrderRequest;
  /** True while mock/API assignment is in progress after slide-to-accept. */
  assigning?: boolean;
  onAccept: () => void;
  onExpire: () => void;
};

export default function NewOrderRequestSheet({
  order,
  assigning = false,
  onAccept,
  onExpire,
}: NewOrderRequestSheetProps) {
  const { t } = useLocale();
  const [remainingMs, setRemainingMs] = useState(ORDER_REQUEST_TIMEOUT_SEC * 1000);
  const expireRef = useRef(onExpire);

  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let didExpire = false;
    const end = Date.now() + ORDER_REQUEST_TIMEOUT_SEC * 1000;
    const id = window.setInterval(() => {
      const left = Math.max(0, end - Date.now());
      setRemainingMs(left);
      if (left <= 0 && !didExpire) {
        didExpire = true;
        window.clearInterval(id);
        expireRef.current();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [order.id]);

  const progress = remainingMs / (ORDER_REQUEST_TIMEOUT_SEC * 1000);

  return (
    <>
      <div className="fixed inset-0 z-[52] bg-black/25" aria-hidden />

      <div
        className="fixed inset-x-0 bottom-0 z-[53] max-h-[72vh] overflow-y-auto rounded-t-3xl border-t border-[var(--color-gray-200)] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.15)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-order-title"
      >
        <div className="mx-auto max-w-lg px-4 pb-8 pt-2">
          <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[var(--color-gray-200)]" aria-hidden />

          <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-gray-200)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-100 ease-linear"
              style={{ width: `${Math.max(0, progress) * 100}%` }}
            />
          </div>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 id="new-order-title" className="text-lg font-bold text-[var(--color-text-primary)]">
                {t("orderSheet.newRequest")}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{order.serviceType}</p>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatInrWhole(order.fareInr)}</p>
          </div>

          <div className="mt-4 rounded-xl bg-[#EEF2FF] px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm text-[var(--color-text-secondary)]">{t("orderSheet.distance")}</span>
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  {t("orderSheet.minsAway", { n: order.distanceMinutes })}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {t("orderSheet.kmRemaining", { n: order.distanceKm })}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-5 pl-1">
            <div className="flex gap-3">
              <PickupIcon />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs text-[var(--color-text-secondary)]">{t("orderSheet.pickup")}</p>
                <p className="mt-0.5 font-bold text-[var(--color-text-primary)]">{order.pickup.title}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{order.pickup.subtitle}</p>
              </div>
            </div>

            <div
              className="absolute left-[17px] top-10 h-[calc(100%-2.5rem)] w-px bg-[var(--color-gray-200)]"
              aria-hidden
            />

            <div className="mt-5 flex gap-3">
              <DropIcon />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs text-[var(--color-text-secondary)]">{t("orderSheet.drop")}</p>
                <p className="mt-0.5 font-bold text-[var(--color-text-primary)]">{order.drop.title}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{order.drop.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="relative mt-8">
            <AcceptSlider
              disabled={assigning}
              acceptLabel={t("orderSheet.accept")}
              onAccept={onAccept}
            />
            {assigning ? (
              <div className="absolute inset-0 z-[2] flex items-center justify-center rounded-xl bg-[var(--color-primary)]/85">
                <span className="inline-block size-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
