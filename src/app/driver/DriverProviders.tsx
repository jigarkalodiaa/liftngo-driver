"use client";

import { DriverSelfieProvider } from "@/context/DriverSelfieContext";
import { DriverVehicleProvider } from "@/context/DriverVehicleContext";
import { LocaleProvider } from "@/context/LocaleContext";

export default function DriverProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <DriverSelfieProvider>
        <DriverVehicleProvider>{children}</DriverVehicleProvider>
      </DriverSelfieProvider>
    </LocaleProvider>
  );
}
