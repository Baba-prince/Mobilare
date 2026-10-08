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
  source: "postcodes.io" | "photon";
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

    // District-level option (always available)
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

    // Photon (OSM) — works from most cloud IPs; Nominatim often blocks datacenters
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
            properties?: {
              osm_id?: number;
              name?: string;
              street?: string;
              housenumber?: string;
              district?: string;
              city?: string;
              state?: string;
              postcode?: string;
              country?: string;
              type?: string;
            };
            geometry?: { coordinates?: number[] };
          }>;
        };

        for (const f of data.features ?? []) {
          const p = f.properties ?? {};
          // Prefer GB-ish results near this postcode
          const featurePc = (p.postcode || "").replace(/\s+/g, "").toUpperCase();
          const samePc = !featurePc || featurePc === pc ||
            featurePc.startsWith(pc.slice(0, 3));
          if (!samePc && p.city && r.admin_district &&
            !String(p.city).toLowerCase().includes(
              String(r.admin_district).toLowerCase().split(" ")[0],
            )) {
            continue;
          }

          const line1 = [p.housenumber, p.street || p.name].filter(Boolean)
            .join(" ") || p.name || p.street;
          if (!line1) continue;

          const line2 = [
            p.district,
            p.city,
            p.postcode || formatted,
            p.country,
          ].filter(Boolean).join(", ");

          const label = [line1, line2].filter(Boolean).join(", ");
          const coords = f.geometry?.coordinates; // [lng, lat]
          push({
            id: `ph-${p.osm_id ?? label.slice(0, 24)}`,
            label,
            line1,
            line2,
            postcode: p.postcode || formatted,
            lat: coords?.[1] ?? lat,
            lng: coords?.[0] ?? lng,
            source: "photon",
          });
        }
      } catch {
        /* try next query */
      }
      if (suggestions.length >= 16) break;
    }

    return jsonResponse(req, {
      postcode: formatted,
      outcode: r.outcode,
      lat,
      lng,
      admin_district: r.admin_district,
      region: r.region,
      suggestions: suggestions.slice(0, 16),
      provider: "postcodes.io+photon",
      note:
        "Select a suggested address. Use manual entry if your exact unit is missing. PAF-complete house lists need Ideal Postcodes / getAddress.io.",
    });
  } catch (e) {
    return jsonResponse(req, { error: (e as Error).message }, 500);
  }
});
