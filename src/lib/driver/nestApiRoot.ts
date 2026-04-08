import { getLiftngoApiBaseUrl } from "@/config/liftngoApi";

/** Resolves REST base including `/api/v1` when env only sets the host (e.g. http://localhost:3001). */
export function getNestApiV1Root(): string {
  const b = getLiftngoApiBaseUrl().replace(/\/$/, "");
  if (b.endsWith("/api/v1") || b.endsWith("/v1")) return b;
  return `${b}/api/v1`;
}
