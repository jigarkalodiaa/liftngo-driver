const DEBUG =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SOCKET_DEBUG === "1";

export function isDispatchSocketDebug(): boolean {
  if (typeof window === "undefined") return DEBUG;
  return DEBUG || window.localStorage?.getItem("liftngo_socket_debug") === "1";
}

export function dispatchSocketLog(
  channel: "socket" | "driver" | "customer",
  event: string,
  payload?: unknown,
): void {
  if (!isDispatchSocketDebug()) return;
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console -- intentional debug
  console.debug(`[liftngo:${channel}] ${ts} ${event}`, payload ?? "");
}
