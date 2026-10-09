/**
 * Google Maps Platform helpers.
 * Uses Geocoding (stable) + Places API (New) + Routes API.
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

/** Nearby / text search for street addresses around a postcode (Places API New). */
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
    try {
      const res = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location",
          },
          body: JSON.stringify({
            textQuery: q,
            locationBias: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: 1200.0,
              },
            },
            regionCode: "GB",
            maxResultCount: 10,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) continue;
      for (const p of data.places ?? []) {
        const label = String(
          p.formattedAddress || p.displayName?.text || "",
        );
        if (!label || seen.has(label.toLowerCase())) continue;
        seen.add(label.toLowerCase());
        const parts = label.split(",").map((s: string) => s.trim());
        const placeId = String(p.id || "").replace(/^places\//, "");
        out.push({
          id: `g-${placeId || label}`,
          label,
          line1: parts[0] || String(p.displayName?.text || label),
          line2: parts.slice(1).join(", "),
          postcode,
          lat: p.location?.latitude ?? lat,
          lng: p.location?.longitude ?? lng,
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

/** Driving route via Routes API (computeRoutes). */
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

  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: origin.lat, longitude: origin.lng },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng,
            },
          },
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        regionCode: "GB",
      }),
    },
  );
  const data = await res.json();
  if (!res.ok || !data.routes?.[0]) return null;
  const route = data.routes[0];
  const durationRaw = String(route.duration ?? "0s");
  const duration_seconds = Number(durationRaw.replace(/s$/, "")) || 0;
  return {
    distance_metres: Number(route.distanceMeters ?? 0),
    duration_seconds,
    polyline: route.polyline?.encodedPolyline ?? null,
  };
}
