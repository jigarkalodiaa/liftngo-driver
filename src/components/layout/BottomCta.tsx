"use client";

import { ArrowRightIcon } from "@/components/icons";

type BottomCtaProps = {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function BottomCta({ label, onClick, loading, disabled }: BottomCtaProps) {
  return (
    <div className="sticky bottom-0 border-t border-[var(--color-gray-100)] bg-white px-5 pb-6 pt-3">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-standard)] bg-[var(--color-primary)] py-4 text-base font-semibold text-white transition-opacity hover:opacity-95 disabled:pointer-events-none disabled:opacity-40"
      >
        {loading ? (
          <span className="inline-block size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : null}
        <span>{label}</span>
        {!loading ? <ArrowRightIcon /> : null}
      </button>
    </div>
  );
}
