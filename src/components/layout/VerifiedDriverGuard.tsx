"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import { isDriverSessionVerified } from "@/lib/driver/authToken";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";

/**
 * Allows children only when the session token marks the driver as verified (mock: OTP 4768).
 * Others are sent to the pending-verification screen.
 */
export default function VerifiedDriverGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    const token = localStorage.getItem(DRIVER_AUTH_TOKEN_KEY);
    if (!isDriverSessionVerified(token)) {
      redirectedRef.current = true;
      router.replace(DRIVER_ONBOARDING.applicationReview);
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center bg-[var(--color-gray-50)] text-[var(--color-text-secondary)]">
        <span className="inline-block size-5 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
