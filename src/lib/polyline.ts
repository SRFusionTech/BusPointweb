/** Decodes a Google encoded polyline (precision 5) — the backend ships trip road paths in this format. */
export function decodePolyline(encoded: string | null | undefined): { lat: number; lng: number }[] {
  const out: { lat: number; lng: number }[] = [];
  if (!encoded) return out;
  let i = 0;
  let lat = 0;
  let lng = 0;
  while (i < encoded.length) {
    for (let axis = 0; axis < 2; axis++) {
      let result = 0;
      let shift = 0;
      let b: number;
      do {
        b = encoded.charCodeAt(i++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20 && i < encoded.length);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lng += delta;
    }
    out.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return out;
}
