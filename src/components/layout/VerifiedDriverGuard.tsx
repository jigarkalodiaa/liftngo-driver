"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";
import { isDriverSessionVerified } from "@/lib/driver/authToken";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";

/**
 * Allows children when NextAuth session has tokens, or when the legacy mock `drv.*` token is verified.
 */
export default function VerifiedDriverGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [ready, setReady] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    if (status === "loading") return;

    const nextAuthOk = status === "authenticated" && Boolean(session?.accessToken);
    const token = localStorage.getItem(DRIVER_AUTH_TOKEN_KEY);
    const legacyVerified = isDriverSessionVerified(token);

    if (!nextAuthOk && !legacyVerified) {
      redirectedRef.current = true;
      router.replace(DRIVER_ONBOARDING.applicationReview);
      return;
    }
    setReady(true);
  }, [router, session?.accessToken, status]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center bg-[var(--color-gray-50)] text-[var(--color-text-secondary)]">
        <span className="inline-block size-5 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
