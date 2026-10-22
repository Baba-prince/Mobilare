import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Suggestion = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
  source: string;
};

function normalize(raw: string) {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const postcodeRaw = String(body.postcode || "");
    const pc = normalize(postcodeRaw);
    if (!pc) {
      return NextResponse.json({ error: "postcode required" }, { status: 400 });
    }

    const pcRes = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`,
    );
    const pcData = await pcRes.json();
    if (!pcRes.ok || !pcData.result) {
      return NextResponse.json(
        { error: `Postcode not found: ${postcodeRaw}`, code: "not_found" },
        { status: 422 },
      );
    }

    const r = pcData.result;
    const formatted: string = r.postcode;
    const lat = r.latitude as number;
    const lng = r.longitude as number;
    const suggestions: Suggestion[] = [
      {
        id: `pci-${pc}`,
        label: [formatted, r.admin_ward, r.admin_district, r.region, r.country]
          .filter(Boolean)
          .join(", "),
        line1: [r.admin_ward, r.admin_district].filter(Boolean).join(", ") || formatted,
        line2: [r.region, r.country, formatted].filter(Boolean).join(", "),
        postcode: formatted,
        lat,
        lng,
        source: "postcodes.io",
      },
    ];

    try {
      const photonUrl =
        `https://photon.komoot.io/api/?q=${encodeURIComponent(formatted)}&lat=${lat}&lon=${lng}&limit=12&lang=en`;
      const pr = await fetch(photonUrl, { headers: { Accept: "application/json" } });
      if (pr.ok) {
        const pj = await pr.json();
        const seen = new Set(suggestions.map((s) => s.label.toLowerCase()));
        for (const f of pj.features || []) {
          const p = f.properties || {};
          const line1 = [p.housenumber, p.street || p.name].filter(Boolean).join(" ");
          if (!line1) continue;
          const label = [line1, p.city || p.county, formatted].filter(Boolean).join(", ");
          if (seen.has(label.toLowerCase())) continue;
          seen.add(label.toLowerCase());
          const coords = f.geometry?.coordinates;
          suggestions.push({
            id: `ph-${suggestions.length}`,
            label,
            line1,
            line2: [p.city || p.county, formatted].filter(Boolean).join(", "),
            postcode: formatted,
            lat: Array.isArray(coords) ? coords[1] : lat,
            lng: Array.isArray(coords) ? coords[0] : lng,
            source: "photon",
          });
        }
      }
    } catch {
      /* optional */
    }

    return NextResponse.json({
      postcode: formatted,
      outcode: r.outcode,
      lat,
      lng,
      admin_district: r.admin_district,
      region: r.region,
      suggestions,
      provider: "postcodes.io+photon",
      google_maps: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lookup failed" },
      { status: 500 },
    );
  }
}

/** Partial postcode autocomplete e.g. OL8 → list of matching postcodes */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const compact = normalize(q);
  if (compact.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}/autocomplete`,
    );
    const data = await res.json();
    const list: string[] = Array.isArray(data.result) ? data.result : [];
    const slice = list.slice(0, 8);

    // Parallel enrich (fast dropdown)
    const enriched = await Promise.all(
      slice.map(async (pc) => {
        try {
          const det = await fetch(
            `https://api.postcodes.io/postcodes/${encodeURIComponent(pc.replace(/\s+/g, ""))}`,
          );
          const dj = await det.json();
          const r = dj.result;
          return {
            id: `ac-${pc}`,
            postcode: r?.postcode || pc,
            label: r
              ? [r.postcode, r.admin_district, r.region].filter(Boolean).join(" · ")
              : pc,
            line1: r?.postcode || pc,
            line2: [r?.admin_district, r?.region].filter(Boolean).join(" · ") || "UK",
            lat: r?.latitude ?? null,
            lng: r?.longitude ?? null,
            source: "autocomplete",
          };
        } catch {
          return {
            id: `ac-${pc}`,
            postcode: pc,
            label: pc,
            line1: pc,
            line2: "UK",
            lat: null,
            lng: null,
            source: "autocomplete",
          };
        }
      }),
    );

    return NextResponse.json({
      query: q,
      suggestions: enriched,
      provider: "postcodes.io/autocomplete",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Autocomplete failed", suggestions: [] },
      { status: 500 },
    );
  }
}
