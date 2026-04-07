"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon, MenuIcon } from "@/components/icons";
import BrandLogo from "@/components/layout/BrandLogo";

type AppHeaderProps = {
  title: string;
  /** Override default browser back. Omit to use `router.back()`. */
  onBack?: () => void;
  onMenu?: () => void;
  showBack?: boolean;
  showMenu?: boolean;
};

export default function AppHeader({
  title,
  onBack,
  onMenu,
  showBack = true,
  showMenu = true,
}: AppHeaderProps) {
  const router = useRouter();
  const goBack = onBack ?? (() => router.back());

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-gray-200)] bg-white px-4 py-3">
      {showBack ? (
        <button
          type="button"
          onClick={goBack}
          className="rounded p-1 text-[var(--color-text-primary)] hover:bg-[var(--color-gray-100)]"
          aria-label="Go back"
        >
          <ArrowLeftIcon />
        </button>
      ) : (
        <span className="w-8" />
      )}

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5 px-1">
        <BrandLogo variant="compact" className="h-7 w-auto max-w-[100px] shrink-0" />
        <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-text-primary)]">{title}</span>
      </div>

      {showMenu ? (
        <button
          type="button"
          onClick={onMenu}
          className="rounded p-1 text-[var(--color-text-primary)] hover:bg-[var(--color-gray-100)]"
          aria-label="Menu"
        >
          <MenuIcon />
        </button>
      ) : (
        <span className="w-8" />
      )}
    </header>
  );
}
