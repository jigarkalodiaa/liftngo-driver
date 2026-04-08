import { API_PATHS } from "@/lib/api/apiPaths";
import {
  type ApiResult,
  logApiRequest,
  logApiResponse,
} from "@/lib/api/apiError";

// ============================================================================
// Types
// ============================================================================

export type DriverType = "existing" | "new";
export type DriverSegmentApi = "PREMIUM" | "STANDARD";

export type VerifyOtpResponse = {
  token: string;
  driverType: DriverType;
  driverVerified: boolean;
  segment?: DriverSegmentApi;
  performanceScore?: number;
  cancellationRatePct?: number;
};

type ApiErrorBody = {
  success?: boolean;
  error?: string;
  code?: string;
  message?: string;
};

// ============================================================================
// Helpers
// ============================================================================

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function createApiError(body: ApiErrorBody | null, fallbackMessage: string): Error & { code?: string } {
  const err = new Error(body?.error || body?.message || fallbackMessage) as Error & { code?: string };
  err.code = body?.code;
  return err;
}

// ============================================================================
// Send OTP
// ============================================================================

export async function sendOtp(phone: string): Promise<ApiResult<{ success: boolean }>> {
  const path = API_PATHS.SEND_OTP;
  logApiRequest("POST", path, { phone: phone.slice(0, 4) + "****" });

  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const body = await parseJson<ApiErrorBody & { success?: boolean }>(res);

    if (!res.ok || !body?.success) {
      const message = body?.error || body?.message || "Could not send OTP";
      logApiResponse("POST", path, { ok: false, status: res.status });
      return { ok: false, status: res.status, message, code: body?.code };
    }

    logApiResponse("POST", path, { ok: true });
    return { ok: true, data: { success: true } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "network_error";
    logApiResponse("POST", path, { ok: false, status: 0 });
    return { ok: false, status: 0, message };
  }
}

// ============================================================================
// Verify OTP
// ============================================================================

export async function verifyOtp(phone: string, otp: string): Promise<ApiResult<VerifyOtpResponse>> {
  const path = API_PATHS.VERIFY_OTP;
  logApiRequest("POST", path, { phone: phone.slice(0, 4) + "****" });

  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });

    const body = await parseJson<
      ApiErrorBody & {
        success?: boolean;
        token?: string;
        driverType?: DriverType;
        driverVerified?: boolean;
        segment?: DriverSegmentApi;
        performanceScore?: number;
        cancellationRatePct?: number;
      }
    >(res);

    if (!res.ok || !body?.success || !body.token) {
      const message = body?.error || body?.message || "Verification failed";
      logApiResponse("POST", path, { ok: false, status: res.status });
      return { ok: false, status: res.status, message, code: body?.code };
    }

    logApiResponse("POST", path, { ok: true });
    return {
      ok: true,
      data: {
        token: body.token,
        driverType: body.driverType ?? "existing",
        driverVerified: body.driverVerified === true,
        segment: body.segment,
        performanceScore: body.performanceScore,
        cancellationRatePct: body.cancellationRatePct,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "network_error";
    logApiResponse("POST", path, { ok: false, status: 0 });
    return { ok: false, status: 0, message };
  }
}

// ============================================================================
// Resend OTP
// ============================================================================

export async function resendOtp(phone: string): Promise<ApiResult<{ success: boolean }>> {
  const path = API_PATHS.RESEND_OTP;
  logApiRequest("POST", path, { phone: phone.slice(0, 4) + "****" });

  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const body = await parseJson<ApiErrorBody & { success?: boolean }>(res);

    if (!res.ok || !body?.success) {
      const message = body?.error || body?.message || "Could not resend OTP";
      logApiResponse("POST", path, { ok: false, status: res.status });
      return { ok: false, status: res.status, message, code: body?.code };
    }

    logApiResponse("POST", path, { ok: true });
    return { ok: true, data: { success: true } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "network_error";
    logApiResponse("POST", path, { ok: false, status: 0 });
    return { ok: false, status: 0, message };
  }
}
