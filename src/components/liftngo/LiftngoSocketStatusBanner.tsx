"use client";

type Props = {
  connected: boolean;
  reconnecting: boolean;
  lastError: string | null;
  /** Shown when we never reached a successful connection (optional). */
  className?: string;
};

/**
 * Compact inline status for Socket.IO (use under header or above trip lists).
 */
export default function LiftngoSocketStatusBanner({ connected, reconnecting, lastError, className }: Props) {
  if (connected && !reconnecting) return null;

  const base =
    "rounded-xl border px-3 py-2 text-xs font-semibold leading-snug " +
    (className ?? "");

  if (reconnecting) {
    return (
      <div className={`${base} border-amber-200 bg-amber-50 text-amber-950`} role="status">
        Reconnecting to server…
      </div>
    );
  }

  if (lastError) {
    return (
      <div className={`${base} border-red-200 bg-red-50 text-red-900`} role="alert">
        Live updates unavailable: {lastError}
      </div>
    );
  }

  if (!connected) {
    return (
      <div className={`${base} border-[var(--color-gray-200)] bg-[var(--color-gray-50)] text-[var(--color-text-secondary)]`} role="status">
        Connecting…
      </div>
    );
  }

  return null;
}
