import { PaymentMode } from "@/lib/trip/tripStatus";

/** Platform commission (10%). */
export const PLATFORM_COMMISSION_RATE = 0.1;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type PaymentWalletEffect = {
  /** Change to running wallet balance (₹). */
  walletDelta: number;
  /** Amount to add to session/lifetime “net earnings” display (₹). */
  earningsDelta: number;
  commission: number;
  driverShare: number;
};

/**
 * PREPAID: platform already paid — credit driver 90% to wallet.
 * CASH: driver collected 100% from customer — deduct 10% commission from wallet.
 */
export function computePaymentWalletEffect(fareInr: number, mode: PaymentMode): PaymentWalletEffect {
  const fare = round2(fareInr);
  const commission = round2(fare * PLATFORM_COMMISSION_RATE);
  const driverShare = round2(fare - commission);

  if (mode === PaymentMode.PREPAID) {
    return {
      walletDelta: driverShare,
      earningsDelta: driverShare,
      commission,
      driverShare,
    };
  }

  return {
    walletDelta: -commission,
    earningsDelta: driverShare,
    commission,
    driverShare,
  };
}
