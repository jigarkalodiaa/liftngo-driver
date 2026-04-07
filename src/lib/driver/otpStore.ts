/** In-memory OTP for mock / single-instance dev. Replace with SMS provider + Redis for production. */

type Entry = { otp: string; exp: number };

function store(): Map<string, Entry> {
  const g = globalThis as unknown as { __liftngoDriverOtp?: Map<string, Entry> };
  if (!g.__liftngoDriverOtp) {
    g.__liftngoDriverOtp = new Map();
  }
  return g.__liftngoDriverOtp;
}

export function saveOtp(phone: string, otp: string, ttlMs = 10 * 60 * 1000): void {
  store().set(phone, { otp, exp: Date.now() + ttlMs });
}

export function refreshOtp(phone: string, otp: string, ttlMs = 10 * 60 * 1000): void {
  saveOtp(phone, otp, ttlMs);
}

export function verifyAndConsumeOtp(phone: string, otp: string): boolean {
  const e = store().get(phone);
  if (!e || Date.now() > e.exp) {
    store().delete(phone);
    return false;
  }
  if (e.otp !== otp) {
    return false;
  }
  store().delete(phone);
  return true;
}

export function issueOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
