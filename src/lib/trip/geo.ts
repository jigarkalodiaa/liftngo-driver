/** Earth radius in metres (WGS84 mean). */
const R_EARTH_M = 6_371_000;

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Great-circle distance between two WGS84 points in metres. */
export function haversineDistanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_EARTH_M * c;
}
