"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** High-level category from onboarding (maps to 2W / 3W–style / 4W-style use cases). */
export type DriverVehicleCategory = "walk" | "bike" | "mini_truck";

export type DriverVehicleDetails = {
  registrationNumber: string;
  vehicleTypeDetail: string;
  bodyType: string;
  isOwner: boolean;
};

/** When the driver is not the RC owner, collected on the owner-information step. */
export type DriverOwnerInformation = {
  fullName: string;
  phone: string;
  aadhaarFile: File | null;
  consentFile: File | null;
};

const defaultDetails: DriverVehicleDetails = {
  registrationNumber: "",
  vehicleTypeDetail: "3 Wheeler EV",
  bodyType: "Close",
  isOwner: true,
};

const defaultOwnerInformation: DriverOwnerInformation = {
  fullName: "",
  phone: "",
  aadhaarFile: null,
  consentFile: null,
};

type DriverVehicleContextValue = {
  category: DriverVehicleCategory | null;
  setCategory: (c: DriverVehicleCategory | null) => void;
  details: DriverVehicleDetails;
  setDetails: (patch: Partial<DriverVehicleDetails>) => void;
  ownerInformation: DriverOwnerInformation;
  setOwnerInformation: (patch: Partial<DriverOwnerInformation>) => void;
  clearVehicle: () => void;
};

const DriverVehicleContext = createContext<DriverVehicleContextValue | null>(null);

export function DriverVehicleProvider({ children }: { children: ReactNode }) {
  const [category, setCategory] = useState<DriverVehicleCategory | null>(null);
  const [details, setDetailsState] = useState<DriverVehicleDetails>({ ...defaultDetails });
  const [ownerInformation, setOwnerInformationState] = useState<DriverOwnerInformation>({
    ...defaultOwnerInformation,
  });

  const setDetails = useCallback((patch: Partial<DriverVehicleDetails>) => {
    setDetailsState((d) => ({ ...d, ...patch }));
  }, []);

  const setOwnerInformation = useCallback((patch: Partial<DriverOwnerInformation>) => {
    setOwnerInformationState((d) => ({ ...d, ...patch }));
  }, []);

  const clearVehicle = useCallback(() => {
    setCategory(null);
    setDetailsState({ ...defaultDetails });
    setOwnerInformationState({ ...defaultOwnerInformation });
  }, []);

  const value = useMemo(
    () => ({
      category,
      setCategory,
      details,
      setDetails,
      ownerInformation,
      setOwnerInformation,
      clearVehicle,
    }),
    [category, details, setDetails, ownerInformation, setOwnerInformation, clearVehicle],
  );

  return (
    <DriverVehicleContext.Provider value={value}>{children}</DriverVehicleContext.Provider>
  );
}

export function useDriverVehicle(): DriverVehicleContextValue {
  const ctx = useContext(DriverVehicleContext);
  if (!ctx) {
    throw new Error("useDriverVehicle must be used within DriverVehicleProvider");
  }
  return ctx;
}
