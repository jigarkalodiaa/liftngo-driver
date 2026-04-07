import { create } from "zustand";

type State = {
  connected: boolean;
  /** True between disconnect and reconnect attempt */
  reconnecting: boolean;
  lastError: string | null;
  lastDisconnectReason: string | null;
};

type Actions = {
  setConnected: (v: boolean) => void;
  setReconnecting: (v: boolean) => void;
  setLastError: (msg: string | null) => void;
  setLastDisconnectReason: (reason: string | null) => void;
  reset: () => void;
};

export const useLiftngoSocketRuntimeStore = create<State & Actions>((set) => ({
  connected: false,
  reconnecting: false,
  lastError: null,
  lastDisconnectReason: null,
  setConnected: (v) => set({ connected: v }),
  setReconnecting: (v) => set({ reconnecting: v }),
  setLastError: (msg) => set({ lastError: msg }),
  setLastDisconnectReason: (reason) => set({ lastDisconnectReason: reason }),
  reset: () =>
    set({
      connected: false,
      reconnecting: false,
      lastError: null,
      lastDisconnectReason: null,
    }),
}));
