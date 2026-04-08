/** Performance score color bands (driver UI). */
export type PerformanceColorBand = "green" | "yellow" | "red";

export function performanceColorBand(score: number): PerformanceColorBand {
  if (score > 80) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

export function performanceTextClass(band: PerformanceColorBand): string {
  switch (band) {
    case "green":
      return "text-emerald-700";
    case "yellow":
      return "text-amber-700";
    default:
      return "text-red-600";
  }
}
