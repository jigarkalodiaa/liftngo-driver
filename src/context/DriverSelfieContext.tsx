"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DriverSelfiePayload = {
  blob: Blob;
  previewUrl: string;
  mimeType: string;
  capturedAt: number;
};

type DriverSelfieContextValue = {
  selfie: DriverSelfiePayload | null;
  setSelfie: (payload: DriverSelfiePayload | null) => void;
  clearSelfie: () => void;
};

const DriverSelfieContext = createContext<DriverSelfieContextValue | null>(null);

export function DriverSelfieProvider({ children }: { children: ReactNode }) {
  const [selfie, setSelfieState] = useState<DriverSelfiePayload | null>(null);

  const setSelfie = useCallback((next: DriverSelfiePayload | null) => {
    setSelfieState((prev) => {
      if (prev?.previewUrl && prev.previewUrl !== next?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return next;
    });
  }, []);

  const clearSelfie = useCallback(() => {
    setSelfieState((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  const value = useMemo(
    () => ({ selfie, setSelfie, clearSelfie }),
    [selfie, setSelfie, clearSelfie],
  );

  return (
    <DriverSelfieContext.Provider value={value}>{children}</DriverSelfieContext.Provider>
  );
}

export function useDriverSelfie(): DriverSelfieContextValue {
  const ctx = useContext(DriverSelfieContext);
  if (!ctx) {
    throw new Error("useDriverSelfie must be used within DriverSelfieProvider");
  }
  return ctx;
}
