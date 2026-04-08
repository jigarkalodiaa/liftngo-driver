/** Minimum wallet balance (₹) required to receive trip offers. Below this → suspended until topped up. */
export const MIN_DRIVER_WALLET_BALANCE_INR = 100;

/** Coerce persisted / API wallet values to a finite rupee amount (avoids string JSON or bad types breaking checks). */
export function normalizeWalletBalanceInr(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.round(raw * 100) / 100;
  }
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[,\s₹]/g, "").trim();
    const n = parseFloat(cleaned);
    if (Number.isFinite(n)) return Math.round(n * 100) / 100;
  }
  return 0;
}

/** True when balance is strictly below {@link MIN_DRIVER_WALLET_BALANCE_INR} (e.g. negative or 0–99.99). */
export function isWalletBelowMinimum(balance: unknown): boolean {
  return normalizeWalletBalanceInr(balance) < MIN_DRIVER_WALLET_BALANCE_INR;
}

/** Amount (₹) the driver must add so balance reaches at least {@link MIN_DRIVER_WALLET_BALANCE_INR}. */
export function walletShortfallToMinimum(balance: unknown): number {
  const b = normalizeWalletBalanceInr(balance);
  return Math.max(0, Math.round((MIN_DRIVER_WALLET_BALANCE_INR - b) * 100) / 100);
}
