import {
  computeDriverSegment,
  type DriverSegment,
  type DriverSegmentPayload,
} from "@/lib/driver/driverSegment";

export type DriverTokenPayload = {
  phone: string;
  role: string;
  driverType: "existing" | "new";
  /** True only for verified drivers (mock: OTP 4768). */
  driverVerified?: boolean;
  /** Dispatch pool: priority vs standard (from performance rules or server). */
  segment?: DriverSegment;
  performanceScore?: number;
  cancellationRatePct?: number;
  iat: number;
};

function decodeBase64UrlSegment(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Parses mock token `drv.{base64url-json}.{sig}` from verify-otp. */
export function parseDriverToken(token: string | null): DriverTokenPayload | null {
  if (!token?.startsWith("drv.")) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = decodeBase64UrlSegment(parts[1]);
    return JSON.parse(json) as DriverTokenPayload;
  } catch {
    return null;
  }
}

export function isDriverSessionVerified(token: string | null): boolean {
  const p = parseDriverToken(token);
  return p?.driverVerified === true;
}

/**
 * Segment + metrics from session token (JWT payload). Older tokens without fields return null.
 */
export function getDriverTaggingFromToken(token: string | null): DriverSegmentPayload | null {
  const p = parseDriverToken(token);
  if (!p) return null;
  const score = p.performanceScore;
  const cancel = p.cancellationRatePct;
  if (typeof score === "number" && typeof cancel === "number") {
    const segment = p.segment ?? computeDriverSegment({ performanceScore: score, cancellationRatePct: cancel });
    return { performanceScore: score, cancellationRatePct: cancel, segment };
  }
  return null;
}
