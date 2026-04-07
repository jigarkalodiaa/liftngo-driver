"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DRIVER_AUTH_TOKEN_KEY } from "@/lib/driver/authConstants";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [ready, setReady] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    if (!localStorage.getItem(DRIVER_AUTH_TOKEN_KEY)) {
      redirectedRef.current = true;
      routerRef.current.replace("/driver/login");
      return;
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--color-text-secondary)]">
        <span className="inline-block size-5 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
