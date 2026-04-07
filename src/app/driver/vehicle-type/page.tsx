"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/layout/AuthGuard";
import BottomCta from "@/components/layout/BottomCta";
import OnboardingStepHeader from "@/components/layout/OnboardingStepHeader";
import { CategoryIcon } from "@/components/driver/VehicleCategoryIcons";
import type { DriverVehicleCategory } from "@/context/DriverVehicleContext";
import { useDriverVehicle } from "@/context/DriverVehicleContext";
import { mergeDriverOnboardingProfile } from "@/lib/driver/driverOnboardingProfile";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";

const OPTIONS: {
  id: DriverVehicleCategory;
  title: string;
  description: string;
}[] = [
  {
    id: "walk",
    title: "Walk",
    description: "Short hyperlocal trips and last-mile deliveries on foot.",
  },
  {
    id: "bike",
    title: "Bike",
    description: "Fast delivery for documents and small parcels.",
  },
  {
    id: "mini_truck",
    title: "Mini Truck",
    description: "Versatile for medium furniture and home shifting.",
  },
];

function SelectedRing() {
  return (
    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2563EB]">
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
        <path
          d="M1 5l3 3 7-7"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function VehicleTypeContent() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const { category, setCategory } = useDriverVehicle();

  const [selected, setSelected] = useState<DriverVehicleCategory>(category ?? "walk");

  useEffect(() => {
    if (category) setSelected(category);
  }, [category]);

  const onContinue = useCallback(() => {
    setCategory(selected);
    mergeDriverOnboardingProfile({ vehicleCategory: selected });
    routerRef.current.replace(DRIVER_ONBOARDING.vehicleDetails);
  }, [selected, setCategory]);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <OnboardingStepHeader step={1} totalSteps={8} percent={10} />

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-5">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Select your vehicle type</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Choose the primary vehicle you will use for deliveries. This can be updated later in settings.
        </p>

        <div className="mt-6 space-y-3">
          {OPTIONS.map((opt) => {
            const isOn = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                className={`flex w-full items-start gap-3 rounded-[var(--radius-standard)] border-2 p-4 text-left transition-colors ${
                  isOn
                    ? "border-[#2563EB] bg-[#F8FAFF]"
                    : "border-[var(--color-gray-200)] bg-white"
                }`}
              >
                <CategoryIcon category={opt.id} selected={isOn} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-text-primary)]">{opt.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {opt.description}
                  </p>
                </div>
                {isOn ? <SelectedRing /> : <span className="mt-1 size-5 shrink-0 rounded-full border-2 border-[var(--color-gray-300)]" />}
              </button>
            );
          })}
        </div>
      </div>

      <BottomCta label="Continue" onClick={onContinue} />
    </div>
  );
}

export default function VehicleTypePage() {
  return (
    <AuthGuard>
      <VehicleTypeContent />
    </AuthGuard>
  );
}
