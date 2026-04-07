/**
 * Single public origin for Nest (REST + Socket.IO on same host).
 * Set `NEXT_PUBLIC_NGROK_BACKEND_URL` once so API + WebSocket stay in sync (no drift).
 *
 * Precedence:
 * - API: `NEXT_PUBLIC_LIFTNGO_API_URL` → else ngrok sync → else localhost
 * - Socket: `NEXT_PUBLIC_SOCKET_URL` → else ngrok sync → else localhost
 */

const LOCAL_DEFAULT = "http://localhost:3001";

function trimOrigin(v: string | undefined): string | undefined {
  const t = v?.trim();
  if (!t) return undefined;
  return t.replace(/\/$/, "");
}

/** Shared tunnel / staging URL (optional). */
export function getLiftngoNgrokSyncUrl(): string | undefined {
  return trimOrigin(process.env.NEXT_PUBLIC_NGROK_BACKEND_URL);
}

export function getLiftngoApiBaseUrl(): string {
  return (
    trimOrigin(process.env.NEXT_PUBLIC_LIFTNGO_API_URL) ??
    getLiftngoNgrokSyncUrl() ??
    LOCAL_DEFAULT
  );
}

export function getLiftngoSocketUrl(): string {
  return (
    trimOrigin(process.env.NEXT_PUBLIC_SOCKET_URL) ??
    getLiftngoNgrokSyncUrl() ??
    LOCAL_DEFAULT
  );
}

/** Free ngrok: avoid HTML interstitial on programmatic `fetch` from the browser. */
export function shouldSendNgrokBrowserWarningHeader(): boolean {
  return process.env.NEXT_PUBLIC_NGROK_SKIP_BROWSER_WARNING === "1";
}

export function mergeLiftngoFetchHeaders(base?: HeadersInit): Headers {
  const h = new Headers(base ?? {});
  if (shouldSendNgrokBrowserWarningHeader()) {
    h.set("ngrok-skip-browser-warning", "true");
  }
  return h;
}
