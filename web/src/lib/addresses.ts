export type AddressSuggestion = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
  source: string;
};

export type AddressesLookup = {
  postcode: string;
  outcode?: string;
  lat?: number;
  lng?: number;
  admin_district?: string;
  region?: string;
  suggestions: AddressSuggestion[];
  provider?: string;
  google_maps?: boolean;
  error?: string;
  code?: string;
};

function supabaseConfig() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  return { base, key };
}

function normalizePc(raw: string) {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** Browser fallback when Supabase /addresses edge function is missing or down. */
async function lookupViaPostcodesIo(postcode: string): Promise<AddressesLookup> {
  const compact = normalizePc(postcode);
  const res = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`,
  );
  const data = await res.json();
  if (!res.ok || !data.result) {
    throw new Error(`Postcode not found: ${postcode}`);
  }
  const r = data.result;
  const formatted: string = r.postcode;
  const lat = r.latitude as number;
  const lng = r.longitude as number;

  const suggestions: AddressSuggestion[] = [
    {
      id: `pci-${compact}`,
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

  // Optional Photon street density (best-effort)
  try {
    const photonUrl =
      `https://photon.komoot.io/api/?q=${encodeURIComponent(formatted)}&lat=${lat}&lon=${lng}&limit=10&lang=en`;
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
    /* ignore photon failures */
  }

  return {
    postcode: formatted,
    outcode: r.outcode,
    lat,
    lng,
    admin_district: r.admin_district,
    region: r.region,
    suggestions,
    provider: "postcodes.io+photon",
    google_maps: false,
  };
}

/** UK postcode lookup via Mobilare /addresses edge function (Google + postcodes.io). */
export async function lookupPostcode(postcode: string): Promise<AddressesLookup> {
  const q = postcode.trim();
  if (!q) throw new Error("Enter a UK postcode");

  const cfg = supabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.base}/functions/v1/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
        body: JSON.stringify({ postcode: q }),
      });
      const data = (await res.json()) as AddressesLookup & { message?: string };
      if (res.ok) return data;

      // Function missing / project not wired → fall through to public APIs
      const missingFn =
        res.status === 404 ||
        data.code === "NOT_FOUND" ||
        /not found/i.test(String(data.message || data.error || ""));
      if (!missingFn && res.status !== 401 && res.status !== 403) {
        throw new Error(data.error || data.message || "Postcode lookup failed");
      }
    } catch (e) {
      // Network / CORS / gateway errors → try public fallback
      if (e instanceof Error && /Postcode lookup failed|postcode required/i.test(e.message)) {
        throw e;
      }
    }
  }

  return lookupViaPostcodesIo(q);
}

export function looksLikeUkPostcode(value: string): boolean {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  return (
    /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/i.test(compact) ||
    /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(compact)
  );
}
