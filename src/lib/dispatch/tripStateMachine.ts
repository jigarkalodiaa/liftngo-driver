import type { TripMachineState } from "@/types/dispatch";

const TERMINAL: TripMachineState[] = ["COMPLETED", "CANCELLED", "EXPIRED"];

const ALLOWED: Record<TripMachineState, TripMachineState[]> = {
  IDLE: ["SEARCHING", "ASSIGNED", "CANCELLED"],
  SEARCHING: ["ASSIGNED", "EXPIRED", "CANCELLED", "IDLE"],
  ASSIGNED: ["ARRIVING", "CANCELLED", "EXPIRED", "IDLE"],
  ARRIVING: ["PICKED_UP", "CANCELLED", "EXPIRED"],
  PICKED_UP: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export function isTerminalTripState(s: TripMachineState): boolean {
  return TERMINAL.includes(s);
}

export function canTransitionTripState(from: TripMachineState, to: TripMachineState): boolean {
  if (from === to) return true;
  if (TERMINAL.includes(from)) return false;
  return ALLOWED[from]?.includes(to) ?? false;
}

/**
 * Map arbitrary backend / socket status strings to the strict machine enum.
 */
export function normalizeStatusToMachine(status: string): TripMachineState | null {
  const s = status.trim().toUpperCase().replace(/\s+/g, "_");
  const aliases: Record<string, TripMachineState> = {
    IDLE: "IDLE",
    SEARCHING: "SEARCHING",
    ASSIGNED: "ASSIGNED",
    EN_ROUTE_TO_PICKUP: "ARRIVING",
    ARRIVING: "ARRIVING",
    ARRIVED_AT_PICKUP: "ARRIVING",
    LOADING_CONFIRMED: "PICKED_UP",
    PICKED_UP: "PICKED_UP",
    TRIP_STARTED: "IN_TRANSIT",
    IN_TRANSIT: "IN_TRANSIT",
    EN_ROUTE_TO_DROP: "IN_TRANSIT",
    ARRIVED_AT_DROP: "IN_TRANSIT",
    UNLOADING_CONFIRMED: "IN_TRANSIT",
    PAYMENT_PENDING: "IN_TRANSIT",
    PAYMENT_COMPLETED: "IN_TRANSIT",
    TRIP_COMPLETED: "COMPLETED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    CANCELED: "CANCELLED",
    EXPIRED: "EXPIRED",
  };
  if (aliases[s]) return aliases[s];
  const fuzzy = status.toLowerCase();
  if (fuzzy.includes("search")) return "SEARCHING";
  if (fuzzy.includes("cancel")) return "CANCELLED";
  if (fuzzy.includes("expire")) return "EXPIRED";
  if (fuzzy.includes("complete")) return "COMPLETED";
  if (fuzzy.includes("pickup") || fuzzy.includes("arriv")) return "ARRIVING";
  if (fuzzy.includes("transit") || fuzzy.includes("started") || fuzzy.includes("route")) return "IN_TRANSIT";
  return null;
}

export function mergeMachineState(
  current: TripMachineState,
  incoming: TripMachineState,
): TripMachineState {
  if (incoming === current) return current;
  if (canTransitionTripState(current, incoming)) return incoming;
  /** Allow recovery from IDLE to in-flight when reconciling from server */
  if (current === "IDLE" && !TERMINAL.includes(incoming)) return incoming;
  return current;
}
