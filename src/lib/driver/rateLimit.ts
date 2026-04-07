/** Best-effort sliding window rate limit per key. Not reliable across serverless instances — use edge/Redis in production. */

const buckets = new Map<string, number[]>();

export function slidingWindowAllow(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const prev = buckets.get(key) ?? [];
  const pruned = prev.filter((t) => now - t < windowMs);
  if (pruned.length >= limit) {
    buckets.set(key, pruned);
    return false;
  }
  pruned.push(now);
  buckets.set(key, pruned);
  return true;
}

export function getClientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") || "unknown";
}
