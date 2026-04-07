const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

/** Cached formatter — avoids allocating Intl on every render. */
export function formatInr(amount: number): string {
  return inrFormatter.format(amount);
}
