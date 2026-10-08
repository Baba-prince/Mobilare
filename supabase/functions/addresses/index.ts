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
  source: "postcodes.io" | "nominatim" | "overpass";
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

    // Area / district option from postcodes.io
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

    // Nominatim reverse at postcode centroid
    try {
      const revUrl =
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`;
      const revRes = await fetch(revUrl, {
        headers: {
          "User-Agent": "MobilareCourier/1.0 (bookings@mobilare.co.uk)",
          "Accept": "application/json",
        },
      });
      if (revRes.ok) {
        const place = await revRes.json() as {
          place_id?: number;
          display_name?: string;
          address?: Record<string, string>;
        };
        if (place.display_name) {
          const addr = place.address ?? {};
          const line1 = [
            addr.house_number,
            addr.road || addr.pedestrian || addr.residential,
          ].filter(Boolean).join(" ") || place.display_name.split(",")[0];
          push({
            id: `osm-rev-${place.place_id ?? pc}`,
            label: place.display_name,
            line1,
            line2: [addr.suburb || addr.neighbourhood, formatted].filter(Boolean)
              .join(", "),
            postcode: formatted,
            lat,
            lng,
            source: "nominatim",
          });
        }
      }
    } catch {
      /* ignore */
    }

    // Nearby named roads via Overpass (selectable street addresses)
    try {
      const query = `
[out:json][timeout:12];
(
  way["highway"~"^(residential|primary|secondary|tertiary|unclassified|living_street|service)$"]["name"](around:250,${lat},${lng});
);
out tags center 25;
`.trim();
      const opRes = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "MobilareCourier/1.0 (bookings@mobilare.co.uk)",
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (opRes.ok) {
        const op = await opRes.json() as {
          elements?: Array<{
            id: number;
            tags?: { name?: string; "addr:housenumber"?: string };
            center?: { lat: number; lon: number };
          }>;
        };
        const roads = new Map<string, { id: number; lat: number; lon: number }>();
        for (const el of op.elements ?? []) {
          const name = el.tags?.name?.trim();
          if (!name || roads.has(name.toLowerCase())) continue;
          roads.set(name.toLowerCase(), {
            id: el.id,
            lat: el.center?.lat ?? lat,
            lon: el.center?.lon ?? lng,
          });
        }
        for (const [nameKey, meta] of roads) {
          // restore proper casing from first matching element
          const el = (op.elements ?? []).find((e) =>
            e.tags?.name?.toLowerCase() === nameKey
          );
          const road = el?.tags?.name ?? nameKey;
          const label = `${road}, ${r.admin_district || r.region || ""}, ${formatted}`
            .replace(/, ,/g, ",")
            .replace(/\s+,/g, ",");
          push({
            id: `ovp-${meta.id}`,
            label,
            line1: road,
            line2: [r.admin_district, formatted].filter(Boolean).join(", "),
            postcode: formatted,
            lat: meta.lat,
            lng: meta.lon,
            source: "overpass",
          });
          if (suggestions.length >= 16) break;
        }
      }
    } catch {
      /* ignore */
    }

    return jsonResponse(req, {
      postcode: formatted,
      outcode: r.outcode,
      lat,
      lng,
      admin_district: r.admin_district,
      region: r.region,
      suggestions,
      provider: "postcodes.io+nominatim+overpass",
      note:
        "Street suggestions are nearby named roads at this postcode. Pick one, then add unit/flat in notes if needed. For Royal Mail PAF-complete lists, connect Ideal Postcodes / getAddress.io later.",
    });
  } catch (e) {
    return jsonResponse(req, { error: (e as Error).message }, 500);
  }
});
