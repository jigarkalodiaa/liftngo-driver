"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import BrandLogo from "@/components/layout/BrandLogo";
import { XMarkIcon } from "@/components/icons";
import { useLocale } from "@/context/LocaleContext";

export type SideMenuAction =
  | "profile"
  | "wallet"
  | "tripHistory"
  | "help"
  | "terms"
  | "support"
  | "logout";

type DriverSideMenuProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (action: SideMenuAction) => void;
};

function Item({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center rounded-xl px-4 py-3.5 text-left text-[15px] font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-gray-50)] active:bg-[var(--color-gray-100)]"
    >
      {label}
    </button>
  );
}

export default function DriverSideMenu({ open, onClose, onSelect }: DriverSideMenuProps) {
  const { t } = useLocale();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label={t("dashboard.sideMenuClose")} onClick={onClose} />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="relative flex h-full w-[min(100%,320px)] flex-col bg-white shadow-xl"
      >
        <div className="border-b border-[var(--color-gray-200)] px-3 py-3 pr-2">
          <div className="flex items-start justify-between gap-2">
            <p className="pl-1 pt-1 text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {t("dashboard.sideMenuTitle")}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-gray-100)]"
              aria-label={t("dashboard.sideMenuClose")}
            >
              <XMarkIcon className="size-6" />
            </button>
          </div>
          <div className="mt-2 pl-1">
            <BrandLogo className="h-9 w-auto max-w-[180px]" width={180} height={40} />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <Item label={t("dashboard.sideProfile")} onClick={() => onSelect("profile")} />
          <Item label={t("dashboard.sideWallet")} onClick={() => onSelect("wallet")} />
          <Item label={t("dashboard.sideTripHistory")} onClick={() => onSelect("tripHistory")} />
          <div className="my-2 border-t border-[var(--color-gray-100)]" />
          <Item label={t("dashboard.sideHelp")} onClick={() => onSelect("help")} />
          <Item label={t("dashboard.sideTerms")} onClick={() => onSelect("terms")} />
          <Item label={t("dashboard.sideSupport")} onClick={() => onSelect("support")} />
          <div className="my-2 border-t border-[var(--color-gray-100)]" />
          <Item label={t("dashboard.sideLogout")} onClick={() => onSelect("logout")} />
        </nav>
      </motion.aside>
    </div>
  );
}
