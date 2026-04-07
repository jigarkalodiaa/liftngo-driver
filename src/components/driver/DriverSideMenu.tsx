"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
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
        <div className="border-b border-[var(--color-gray-200)] px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
            {t("dashboard.sideMenuTitle")}
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">LiftNGo</p>
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
