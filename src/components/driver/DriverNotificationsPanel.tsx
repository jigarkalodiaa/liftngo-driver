"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { XMarkIcon } from "@/components/icons";
import { useLocale } from "@/context/LocaleContext";
import type { DriverNotificationId } from "@/lib/driver/driverNotificationsStorage";
import {
  DRIVER_NOTIFICATION_IDS,
  loadReadNotificationIds,
  saveReadNotificationIds,
} from "@/lib/driver/driverNotificationsStorage";

const TITLE_KEY: Record<DriverNotificationId, string> = {
  welcome: "dashboard.notifWelcomeTitle",
  tips: "dashboard.notifTipsTitle",
  payout: "dashboard.notifPayoutTitle",
};

const BODY_KEY: Record<DriverNotificationId, string> = {
  welcome: "dashboard.notifWelcomeBody",
  tips: "dashboard.notifTipsBody",
  payout: "dashboard.notifPayoutBody",
};

type DriverNotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
  /** Called when read state changes (e.g. to refresh bell badge). */
  onReadsChanged?: () => void;
};

export default function DriverNotificationsPanel({
  open,
  onClose,
  onReadsChanged,
}: DriverNotificationsPanelProps) {
  const { t, activeLocale } = useLocale();
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (open) setReadIds(loadReadNotificationIds());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const items = useMemo(
    () =>
      DRIVER_NOTIFICATION_IDS.map((id) => ({
        id,
        title: t(TITLE_KEY[id]),
        body: t(BODY_KEY[id]),
      })),
    [t],
  );

  const markRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        saveReadNotificationIds(next);
        return next;
      });
      onReadsChanged?.();
    },
    [onReadsChanged],
  );

  const markAllRead = useCallback(() => {
    const next = new Set<string>(DRIVER_NOTIFICATION_IDS);
    saveReadNotificationIds(next);
    setReadIds(next);
    onReadsChanged?.();
  }, [onReadsChanged]);

  const unreadCount = useMemo(
    () => items.filter((it) => !readIds.has(it.id)).length,
    [items, readIds],
  );

  if (!open) return null;

  const dateLocale = activeLocale === "hi" ? "hi-IN" : "en-IN";
  const closeLabel = t("dashboard.notificationsClose");

  return (
    <div className="fixed inset-0 z-[75] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-notifications-title"
        className="relative flex h-full w-[min(100%,380px)] flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-gray-200)] px-4 py-3">
          <h2 id="driver-notifications-title" className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("dashboard.notificationsTitle")}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-gray-50)]"
              >
                {t("dashboard.notificationsMarkAll")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-gray-100)]"
              aria-label={closeLabel}
            >
              <XMarkIcon className="size-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-2">
            {items.map((it) => {
              const read = readIds.has(it.id);
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => markRead(it.id)}
                    className={`w-full rounded-xl border border-[var(--color-gray-100)] px-3 py-3 text-left transition-colors hover:bg-[var(--color-gray-50)] ${
                      read ? "bg-white opacity-80" : "bg-[var(--color-primary)]/5 border-[var(--color-primary)]/15"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm font-bold ${
                          read ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
                        }`}
                      >
                        {it.title}
                      </p>
                      {!read ? (
                        <span className="shrink-0 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          {t("dashboard.notificationsNew")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{it.body}</p>
                    <p className="mt-2 text-[10px] text-[var(--color-gray-400)]">
                      {new Date().toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
