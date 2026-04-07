"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";

type OnboardingStepHeaderProps = {
  step: number;
  totalSteps?: number;
  percent: number;
  /** Override default browser back. Omit to use `router.back()`. */
  onBack?: () => void;
};

export default function OnboardingStepHeader({
  step,
  totalSteps = 8,
  percent,
  onBack,
}: OnboardingStepHeaderProps) {
  const router = useRouter();
  const goBack = onBack ?? (() => router.back());
  const pct = Math.min(100, Math.max(0, percent));

  return (
    <header className="border-b border-[var(--color-gray-200)] bg-white px-4 pb-3 pt-2">
      <div className="relative flex items-center justify-between py-2">
        <button
          type="button"
          onClick={goBack}
          className="z-10 rounded-full p-1.5 text-[var(--color-text-primary)] hover:bg-[var(--color-gray-100)]"
          aria-label="Go back"
        >
          <ArrowLeftIcon />
        </button>
        <span className="pointer-events-none absolute inset-x-0 text-center text-sm font-semibold text-[var(--color-text-primary)]">
          Step {step} of {totalSteps}
        </span>
        <span className="z-10 text-sm font-semibold text-[var(--color-primary)]">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-gray-200)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </header>
  );
}
