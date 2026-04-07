/** REST API base (trips accept/reject, etc.). Defaults to same host as typical monorepo backend. */
export function getLiftngoApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_LIFTNGO_API_URL?.trim() || "http://localhost:3001";
  }
  return process.env.NEXT_PUBLIC_LIFTNGO_API_URL?.trim() || "http://localhost:3001";
}
