const CH = "liftngo_dispatch_tabs";

type TabMessage =
  | { type: "accept_lock"; tripId: string; tabId: string }
  | { type: "accept_release"; tripId: string; tabId: string }
  | { type: "trip_sync"; payload: unknown };

let channel: BroadcastChannel | null = null;
let tabId = "";

function ensureChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!tabId) tabId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  if (!channel) channel = new BroadcastChannel(CH);
  return channel;
}

export function getDispatchTabId(): string {
  if (typeof window === "undefined") return "ssr";
  if (!tabId) tabId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return tabId;
}

export function broadcastAcceptLock(tripId: string): void {
  const ch = ensureChannel();
  if (!ch) return;
  ch.postMessage({ type: "accept_lock", tripId, tabId: getDispatchTabId() } satisfies TabMessage);
}

export function broadcastAcceptRelease(tripId: string): void {
  const ch = ensureChannel();
  if (!ch) return;
  ch.postMessage({ type: "accept_release", tripId, tabId: getDispatchTabId() } satisfies TabMessage);
}

export function subscribeDispatchTabMessages(handler: (msg: TabMessage) => void): () => void {
  const ch = ensureChannel();
  if (!ch) return () => {};
  const fn = (ev: MessageEvent<TabMessage>) => handler(ev.data);
  ch.addEventListener("message", fn);
  return () => ch.removeEventListener("message", fn);
}
