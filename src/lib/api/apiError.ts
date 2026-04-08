import axios from "axios";

export type ApiResult<T> = 
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; code?: string };

export type ApiResultVoid = 
  | { ok: true }
  | { ok: false; status: number; message: string; code?: string };

export function extractAxiosError(e: unknown): { status: number; message: string; code?: string } {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status ?? 0;
    const raw = e.response?.data;
    let message = e.message;
    let code: string | undefined;

    if (raw && typeof raw === "object") {
      const o = raw as { message?: string; error?: string; code?: string };
      if (typeof o.message === "string") message = o.message;
      else if (typeof o.error === "string") message = o.error;
      if (typeof o.code === "string") code = o.code;
    } else if (typeof raw === "string") {
      message = raw;
    }

    return { status, message, code };
  }

  const message = e instanceof Error ? e.message : "network_error";
  return { status: 0, message };
}

export function toApiError(e: unknown): ApiResultVoid & { ok: false } {
  const { status, message, code } = extractAxiosError(e);
  return { ok: false, status, message, code };
}

export function toApiErrorWithData<T>(e: unknown): ApiResult<T> & { ok: false } {
  const { status, message, code } = extractAxiosError(e);
  return { ok: false, status, message, code };
}

const isDev = process.env.NODE_ENV === "development";

export function logApiRequest(method: string, path: string, data?: unknown): void {
  if (isDev) {
    console.log(`[API] ${method} ${path}`, data ?? "");
  }
}

export function logApiResponse(method: string, path: string, result: { ok: boolean; status?: number }): void {
  if (isDev) {
    const status = result.ok ? "✓" : `✗ ${result.status}`;
    console.log(`[API] ${method} ${path} → ${status}`);
  }
}

export function logApiError(method: string, path: string, error: unknown): void {
  if (isDev) {
    console.error(`[API] ${method} ${path} ERROR:`, error);
  }
}
