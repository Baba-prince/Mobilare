import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { normalizePostcode } from "../_shared/pricing.ts";
import {
  geocodePostcode,
  googleMapsKey,
  placesForPostcode,
} from "../_shared/google_maps.ts";

type Suggestion = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
  source: "google" | "postcodes.io" | "photon";
};

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
    let lat = r.latitude as number;
    let lng = r.longitude as number;

    // Prefer Google geocode when configured (production)
    if (googleMapsKey()) {
      const g = await geocodePostcode(formatted);
      if (g) {
        lat = g.lat;
        lng = g.lng;
      }
    }

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

    let provider = "postcodes.io+photon";

    if (googleMapsKey()) {
      const googlePlaces = await placesForPostcode(formatted, lat, lng);
      for (const s of googlePlaces) push(s);
      if (googlePlaces.length) provider = "google+postcodes.io";
    }

    // Photon fallback for density when Google missing / sparse
    if (suggestions.length < 8) {
      const photonQueries = [
        formatted,
        `${r.admin_ward || ""} ${formatted}`.trim(),
        `${r.admin_district || ""} ${formatted}`.trim(),
      ];
      for (const q of photonQueries) {
        const url =
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&limit=12&lang=en`;
        try {
          const res = await fetch(url, {
            headers: { Accept: "application/json" },
          });
          if (!res.ok) continue;
          const data = await res.json() as {
            features?: Array<{
              properties?: Record<string, string | number | undefined>;
              geometry?: { coordinates?: number[] };
            }>;
          };
          for (const f of data.features ?? []) {
            const p = f.properties ?? {};
            const line1 = [p.housenumber, p.street || p.name].filter(Boolean)
              .join(" ") || String(p.name || p.street || "");
            if (!line1) continue;
            const line2 = [
              p.district,
              p.city,
              p.postcode || formatted,
              p.country,
            ].filter(Boolean).join(", ");
            const label = [line1, line2].filter(Boolean).join(", ");
            const coords = f.geometry?.coordinates;
            push({
              id: `ph-${p.osm_id ?? label.slice(0, 24)}`,
              label,
              line1,
              line2,
              postcode: String(p.postcode || formatted),
              lat: coords?.[1] ?? lat,
              lng: coords?.[0] ?? lng,
              source: "photon",
            });
          }
        } catch {
          /* next */
        }
        if (suggestions.length >= 16) break;
      }
      if (!googleMapsKey()) provider = "postcodes.io+photon";
      else if (provider === "google+postcodes.io") {
        provider = "google+postcodes.io+photon";
      }
    }

    return jsonResponse(req, {
      postcode: formatted,
      outcode: r.outcode,
      lat,
      lng,
      admin_district: r.admin_district,
      region: r.region,
      suggestions: suggestions.slice(0, 16),
      provider,
      google_maps: Boolean(googleMapsKey()),
      note: googleMapsKey()
        ? "Addresses powered by Google Maps + postcodes.io."
        : "Set GOOGLE_MAPS_API_KEY for production Places suggestions. Using postcodes.io + Photon fallback.",
    });
  } catch (e) {
    return jsonResponse(req, { error: (e as Error).message }, 500);
  }
});
