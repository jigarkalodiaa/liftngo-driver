/**
 * @deprecated Use `@/services/api/authApi` instead. This file is kept for backward compatibility.
 */

export type ApiErrorBody = {
  error: string;
  code?: string;
};

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function sendOtp(phone: string): Promise<{ success: boolean }> {
  const res = await fetch("/api/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const body = await parseJson<{ success?: boolean; error?: string; code?: string }>(res);
  if (!res.ok) {
    const err = new Error(body?.error || "Could not send OTP") as Error & { code?: string };
    err.code = body?.code;
    throw err;
  }
  if (!body?.success) {
    const err = new Error(body?.error || "Could not send OTP") as Error & { code?: string };
    err.code = body?.code;
    throw err;
  }
  return { success: true };
}

export type DriverType = "existing" | "new";

export type DriverSegmentApi = "PREMIUM" | "STANDARD";

export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<{
  success: boolean;
  token: string;
  driverType: DriverType;
  driverVerified: boolean;
  segment?: DriverSegmentApi;
  performanceScore?: number;
  cancellationRatePct?: number;
}> {
  const res = await fetch("/api/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  const body = await parseJson<{
    success?: boolean;
    token?: string;
    driverType?: DriverType;
    driverVerified?: boolean;
    segment?: DriverSegmentApi;
    performanceScore?: number;
    cancellationRatePct?: number;
    error?: string;
    code?: string;
  }>(res);
  if (!res.ok) {
    const err = new Error(body?.error || "Verification failed") as Error & { code?: string };
    err.code = body?.code;
    throw err;
  }
  if (!body?.success || !body.token) {
    throw new Error(body?.error || "Verification failed");
  }
  return {
    success: true,
    token: body.token,
    driverType: body.driverType ?? "existing",
    driverVerified: body.driverVerified === true,
    segment: body.segment,
    performanceScore: body.performanceScore,
    cancellationRatePct: body.cancellationRatePct,
  };
}

export async function resendOtp(phone: string): Promise<{ success: boolean }> {
  const res = await fetch("/api/resend-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const body = await parseJson<{ success?: boolean; error?: string; code?: string }>(res);
  if (!res.ok) {
    const err = new Error(body?.error || "Could not resend OTP") as Error & { code?: string };
    err.code = body?.code;
    throw err;
  }
  if (!body?.success) {
    throw new Error(body?.error || "Could not resend OTP");
  }
  return { success: true };
}
