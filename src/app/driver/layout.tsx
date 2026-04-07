import DriverTripModeGate from "@/components/driver/DriverTripModeGate";
import DriverProviders from "./DriverProviders";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-[var(--color-gray-100)]">
      <div className="flex w-full max-w-[450px] flex-col bg-white shadow-sm sm:shadow-lg">
        <DriverProviders>
          <DriverTripModeGate>{children}</DriverTripModeGate>
        </DriverProviders>
      </div>
    </div>
  );
}
