import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { normalizePostcode } from "../_shared/pricing.ts";

type Suggestion = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
  source: "postcodes.io" | "nominatim";
};

const UA = {
  "User-Agent": "MobilareCourier/1.0 (bookings@mobilare.co.uk)",
  "Accept": "application/json",
};

async function nominatimJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return null;
  return await res.json();
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST" && req.method !== "GET") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    let postcodeRaw = "";
    if (req.method === "GET") {
      postcodeRaw = new URL(req.url).searchParams.get("postcode") ?? "";
    } else {
      const body = await req.json();
      postcodeRaw = String(body.postcode ?? "");
    }

    const pc = normalizePostcode(postcodeRaw);
    if (!pc) {
      return jsonResponse(req, { error: "postcode required" }, 400);
    }

    const pcRes = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`,
    );
    const pcData = await pcRes.json();
    if (!pcRes.ok || !pcData.result) {
      return jsonResponse(req, {
        error: `Postcode not found: ${postcodeRaw}`,
        code: "not_found",
      }, 422);
    }

    const r = pcData.result;
    const formatted: string = r.postcode;
    const lat = r.latitude as number;
    const lng = r.longitude as number;
    const suggestions: Suggestion[] = [];
    const seen = new Set<string>();

    const push = (s: Suggestion) => {
      const key = s.label.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      suggestions.push(s);
    };

    push({
      id: `pci-${pc}`,
      label: [formatted, r.admin_ward, r.admin_district, r.region, r.country]
        .filter(Boolean).join(", "),
      line1: [r.admin_ward, r.admin_district].filter(Boolean).join(", ") ||
        formatted,
      line2: [r.region, r.country, formatted].filter(Boolean).join(", "),
      postcode: formatted,
      lat,
      lng,
      source: "postcodes.io",
    });

    type NomPlace = {
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
      type?: string;
      class?: string;
      address?: Record<string, string>;
    };

    const addPlace = (place: NomPlace) => {
      const addr = place.address ?? {};
      const line1 = [
        addr.house_number,
        addr.road || addr.pedestrian || addr.footway || addr.residential,
      ].filter(Boolean).join(" ") ||
        addr.building ||
        addr.amenity ||
        addr.shop ||
        place.display_name.split(",")[0];

      const line2 = [
        addr.suburb || addr.neighbourhood || addr.city_district,
        addr.city || addr.town || addr.village || r.admin_district,
        formatted,
      ].filter(Boolean).join(", ");

      push({
        id: `osm-${place.place_id}`,
        label: place.display_name,
        line1,
        line2,
        postcode: formatted,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        source: "nominatim",
      });
    };

    // 1) Reverse geocode centroid
    const rev = await nominatimJson(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
    ) as NomPlace | null;
    if (rev?.display_name) addPlace(rev);
    await delay(300);

    // 2) Bounded search around postcode for buildings / amenities / roads
    const d = 0.012; // ~1km box
    const viewbox = `${lng - d},${lat + d},${lng + d},${lat - d}`;
    const searches = [
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formatted)}&countrycodes=gb&format=json&addressdetails=1&limit=15`,
      `https://nominatim.openstreetmap.org/search?q=${
        encodeURIComponent(r.admin_ward || r.admin_district || "London")
      }&countrycodes=gb&format=json&addressdetails=1&limit=15&viewbox=${viewbox}&bounded=1`,
      `https://nominatim.openstreetmap.org/search?street=&city=${
        encodeURIComponent(r.admin_district || "")
      }&postalcode=${encodeURIComponent(formatted)}&countrycodes=gb&format=json&addressdetails=1&limit=15`,
    ];

    for (const url of searches) {
      const data = await nominatimJson(url);
      if (Array.isArray(data)) {
        for (const place of data as NomPlace[]) addPlace(place);
      }
      await delay(300);
      if (suggestions.length >= 18) break;
    }

    return jsonResponse(req, {
      postcode: formatted,
      outcode: r.outcode,
      lat,
      lng,
      admin_district: r.admin_district,
      region: r.region,
      suggestions: suggestions.slice(0, 18),
      provider: "postcodes.io+nominatim",
      note:
        "Choose a suggested address for pickup/drop-off. Manual entry remains available. For Royal Mail PAF house-number complete lists, Ideal Postcodes / getAddress.io can be added later.",
    });
  } catch (e) {
    return jsonResponse(req, { error: (e as Error).message }, 500);
  }
});

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
