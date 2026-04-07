"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DriverLocale } from "@/lib/i18n/constants";
import { DRIVER_LOCALE_KEY, isDriverLocale } from "@/lib/i18n/constants";
import { driverDictionaries } from "@/lib/i18n/dictionaries";
import { resolveMessage } from "@/lib/i18n/getMessage";

type LocaleContextValue = {
  locale: DriverLocale | null;
  /** Effective locale for `t()` — English until a language is chosen. */
  activeLocale: DriverLocale;
  hydrated: boolean;
  setLocale: (locale: DriverLocale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  /** Always `null` on first paint (server + client) so SSR HTML matches hydration; sync from storage in `useEffect`. */
  const [locale, setLocaleState] = useState<DriverLocale | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem(DRIVER_LOCALE_KEY);
    if (isDriverLocale(s)) setLocaleState(s);
    setHydrated(true);
  }, []);

  const setLocale = useCallback((next: DriverLocale) => {
    setLocaleState(next);
    localStorage.setItem(DRIVER_LOCALE_KEY, next);
  }, []);

  const activeLocale: DriverLocale = locale ?? "en";

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) =>
      resolveMessage(driverDictionaries, activeLocale, path, vars),
    [activeLocale],
  );

  const value = useMemo(
    () => ({ locale, activeLocale, hydrated, setLocale, t }),
    [locale, activeLocale, hydrated, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

/** Safe for optional i18n (e.g. shared components outside driver). */
export function useOptionalLocale(): LocaleContextValue | null {
  return useContext(LocaleContext);
}
