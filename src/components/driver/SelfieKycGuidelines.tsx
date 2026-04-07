import type { ReactNode } from "react";

function ProhibitedRing({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex size-[52px] items-center justify-center rounded-full bg-[var(--color-gray-100)]">
      {children}
      <svg
        className="pointer-events-none absolute inset-0 size-full text-[var(--color-error)]"
        viewBox="0 0 52 52"
        fill="none"
        aria-hidden
      >
        <circle cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="2" />
        <path d="M14 38L38 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function GlassesIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[var(--color-gray-500)]" aria-hidden>
      <circle cx="8" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.5 12h1M4 12h1.5M18.5 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MaskIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[var(--color-gray-500)]" aria-hidden>
      <path d="M4 10c0-2 2.5-4 8-4s8 2 8 4v6c0 2-2.5 4-8 4s-8-2-8-4v-6z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12h8M9 15h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[var(--color-gray-500)]" aria-hidden>
      <path d="M4 14l8-4 8 4-8 3-8-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 17v3M6 15v2M18 15v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type Variant = "card" | "row";

type Item = { icon: ReactNode; label: string };

const ITEMS_CARD: Item[] = [
  { icon: <GlassesIcon />, label: "No eyeglasses" },
  { icon: <MaskIcon />, label: "No Mask" },
  { icon: <CapIcon />, label: "No Cap" },
];

const ITEMS_ROW: Item[] = [
  { icon: <GlassesIcon />, label: "NO EYEGLASSES" },
  { icon: <MaskIcon />, label: "NO MASK" },
  { icon: <CapIcon />, label: "NO CAP" },
];

export default function SelfieKycGuidelines({ variant }: { variant: Variant }) {
  const items = variant === "card" ? ITEMS_CARD : ITEMS_ROW;
  const labelClass =
    variant === "card"
      ? "mt-2 text-center text-xs font-medium text-[#001B39]"
      : "mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]";

  return (
    <div
      className={
        variant === "card"
          ? "rounded-2xl border border-[var(--color-gray-100)] bg-white px-4 py-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
          : "w-full"
      }
    >
      <div className="flex justify-around gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <ProhibitedRing>{item.icon}</ProhibitedRing>
            <p className={labelClass}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
