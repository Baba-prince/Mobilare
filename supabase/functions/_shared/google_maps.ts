/**
 * Google Maps Platform helpers (Geocoding + Places Text Search).
 * Requires secret GOOGLE_MAPS_API_KEY on Edge Functions.
 */

export type LatLng = { lat: number; lng: number };

export type PlaceSuggestion = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
  source: "google";
};

export function googleMapsKey(): string | null {
  return (
    Deno.env.get("GOOGLE_MAPS_API_KEY") ||
    Deno.env.get("GOOGLE_API_KEY") ||
    null
  );
}

export async function geocodeAddress(
  query: string,
  opts?: { region?: string; components?: string },
): Promise<(LatLng & { formatted: string; place_id?: string }) | null> {
  const key = googleMapsKey();
  if (!key || !query.trim()) return null;

  const params = new URLSearchParams({
    address: query,
    key,
    region: opts?.region ?? "uk",
  });
  if (opts?.components) params.set("components", opts.components);

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
  );
  const data = await res.json();
  if (data.status !== "OK" || !data.results?.[0]) return null;
  const r = data.results[0];
  return {
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    formatted: r.formatted_address as string,
    place_id: r.place_id as string | undefined,
  };
}

export async function geocodePostcode(postcode: string): Promise<LatLng | null> {
  const g = await geocodeAddress(postcode, {
    region: "uk",
    components: "country:GB",
  });
  return g ? { lat: g.lat, lng: g.lng } : null;
}

/** Nearby / text search for street addresses around a postcode. */
export async function placesForPostcode(
  postcode: string,
  lat: number,
  lng: number,
): Promise<PlaceSuggestion[]> {
  const key = googleMapsKey();
  if (!key) return [];

  const queries = [
    `addresses near ${postcode}, UK`,
    `${postcode} United Kingdom`,
  ];
  const out: PlaceSuggestion[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    const params = new URLSearchParams({
      query: q,
      location: `${lat},${lng}`,
      radius: "1200",
      region: "uk",
      key,
    });
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
      );
      const data = await res.json();
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") continue;
      for (const p of data.results ?? []) {
        const label = String(p.formatted_address || p.name || "");
        if (!label || seen.has(label.toLowerCase())) continue;
        seen.add(label.toLowerCase());
        const parts = label.split(",").map((s: string) => s.trim());
        out.push({
          id: `g-${p.place_id}`,
          label,
          line1: parts[0] || String(p.name || label),
          line2: parts.slice(1).join(", "),
          postcode,
          lat: p.geometry?.location?.lat ?? lat,
          lng: p.geometry?.location?.lng ?? lng,
          source: "google",
        });
      }
    } catch {
      /* try next */
    }
    if (out.length >= 16) break;
  }

  return out.slice(0, 16);
}

export async function directionsRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<{
  distance_metres: number;
  duration_seconds: number;
  polyline: string | null;
} | null> {
  const key = googleMapsKey();
  if (!key) return null;

  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: "driving",
    region: "uk",
    key,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params}`,
  );
  const data = await res.json();
  if (data.status !== "OK" || !data.routes?.[0]) return null;
  const leg = data.routes[0].legs?.[0];
  return {
    distance_metres: leg?.distance?.value ?? 0,
    duration_seconds: leg?.duration?.value ?? 0,
    polyline: data.routes[0].overview_polyline?.points ?? null,
  };
}
