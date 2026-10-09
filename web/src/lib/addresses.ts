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
  if (!base || !key) {
    throw new Error("Supabase public env is not configured");
  }
  return { base, key };
}

/** UK postcode lookup via Mobilare /addresses edge function (Google + postcodes.io). */
export async function lookupPostcode(postcode: string): Promise<AddressesLookup> {
  const q = postcode.trim();
  if (!q) throw new Error("Enter a UK postcode");

  const { base, key } = supabaseConfig();
  const res = await fetch(`${base}/functions/v1/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ postcode: q }),
  });
  const data = (await res.json()) as AddressesLookup;
  if (!res.ok) {
    throw new Error(data.error || "Postcode lookup failed");
  }
  return data;
}

export function looksLikeUkPostcode(value: string): boolean {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/i.test(compact) ||
    /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(compact);
}
