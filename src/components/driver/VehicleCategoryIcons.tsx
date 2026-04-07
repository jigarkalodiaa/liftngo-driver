import type { FC, ReactNode } from "react";
import type { DriverVehicleCategory } from "@/context/DriverVehicleContext";

function IconBox({
  selected,
  children,
}: {
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${
        selected ? "bg-[#2563EB]" : "bg-[var(--color-gray-100)]"
      }`}
    >
      {children}
    </div>
  );
}

export function WalkIcon({ selected }: { selected: boolean }) {
  return (
    <IconBox selected={selected}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="5" r="2" fill={selected ? "#fff" : "var(--color-gray-600)"} />
        <path
          d="M12 8v5l-2 6M12 13l2 4M9 21h2M13 21h2"
          stroke={selected ? "#fff" : "var(--color-gray-600)"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBox>
  );
}

export function BikeIcon({ selected }: { selected: boolean }) {
  const c = selected ? "#fff" : "var(--color-gray-600)";
  return (
    <IconBox selected={selected}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="7" cy="16" r="3" stroke={c} strokeWidth="1.8" />
        <circle cx="17" cy="16" r="3" stroke={c} strokeWidth="1.8" />
        <path
          d="M10 16l3-8 4 4M13 8l3-2M16 12l2 2"
          stroke={c}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBox>
  );
}

export function TruckIcon({ selected }: { selected: boolean }) {
  const c = selected ? "#fff" : "var(--color-gray-600)";
  return (
    <IconBox selected={selected}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 14h10v4H3v-4zM13 14l3-4h5v8h-8v-4"
          stroke={c}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="18" r="2" stroke={c} strokeWidth="1.8" />
        <circle cx="17" cy="18" r="2" stroke={c} strokeWidth="1.8" />
      </svg>
    </IconBox>
  );
}

const ICONS: Record<DriverVehicleCategory, FC<{ selected: boolean }>> = {
  walk: WalkIcon,
  bike: BikeIcon,
  mini_truck: TruckIcon,
};

export function CategoryIcon({
  category,
  selected,
}: {
  category: DriverVehicleCategory;
  selected: boolean;
}) {
  const Cmp = ICONS[category];
  return <Cmp selected={selected} />;
}
