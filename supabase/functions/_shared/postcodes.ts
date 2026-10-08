/**
 * postcodes.io lookup — validation + lat/lng + crow-flies miles.
 * https://postcodes.io/
 */

import { normalizePostcode, outwardCode } from "./pricing.ts";

const POSTCODES_IO = "https://api.postcodes.io";
/** Crow-flies → approximate road miles */
const ROAD_FACTOR = 1.25;

export type PostcodeGeo = {
  postcode: string; // formatted e.g. EC1A 1BB
  outcode: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string | null;
  admin_district: string | null;
};

export class PostcodeError extends Error {
  constructor(
    message: string,
    public code: "invalid" | "not_found" | "upstream" | "uncovered",
  ) {
    super(message);
    this.name = "PostcodeError";
  }
}

type BulkRow = {
  query: string;
  result: null | {
    postcode: string;
    outcode: string;
    latitude: number;
    longitude: number;
    country: string;
    region: string | null;
    admin_district: string | null;
  };
};

export async function lookupPostcodes(
  pickupRaw: string,
  dropoffRaw: string,
): Promise<{ pickup: PostcodeGeo; dropoff: PostcodeGeo }> {
  const pickupPc = normalizePostcode(pickupRaw);
  const dropoffPc = normalizePostcode(dropoffRaw);

  if (!pickupPc || !dropoffPc) {
    throw new PostcodeError("Enter pickup and drop-off postcodes", "invalid");
  }

  const res = await fetch(`${POSTCODES_IO}/postcodes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postcodes: [pickupPc, dropoffPc] }),
  });

  if (!res.ok) {
    throw new PostcodeError(
      "Postcode service unavailable — try again shortly",
      "upstream",
    );
  }

  const data = await res.json() as { status: number; result: BulkRow[] };
  const rows = data.result ?? [];
  const byQuery = new Map(
    rows.map((r) => [normalizePostcode(r.query), r.result]),
  );

  const pickupResult = byQuery.get(pickupPc);
  const dropoffResult = byQuery.get(dropoffPc);

  if (!pickupResult) {
    throw new PostcodeError(
      `Pickup postcode not found: ${pickupRaw}`,
      "not_found",
    );
  }
  if (!dropoffResult) {
    throw new PostcodeError(
      `Drop-off postcode not found: ${dropoffRaw}`,
      "not_found",
    );
  }

  const pickup = toGeo(pickupResult);
  const dropoff = toGeo(dropoffResult);

  if (!isGeoCovered(pickup) || !isGeoCovered(dropoff)) {
    throw new PostcodeError(
      "Postcode outside Mobilare online coverage (mainland GB). Call 07984 884644.",
      "uncovered",
    );
  }

  return { pickup, dropoff };
}

function toGeo(r: NonNullable<BulkRow["result"]>): PostcodeGeo {
  return {
    postcode: r.postcode,
    outcode: r.outcode,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    region: r.region,
    admin_district: r.admin_district,
  };
}

/** Block NI / Crown Dependencies; require England/Scotland/Wales */
export function isGeoCovered(geo: PostcodeGeo): boolean {
  const country = (geo.country || "").toLowerCase();
  if (
    country.includes("northern ireland") ||
    country.includes("channel") ||
    country === "isle of man"
  ) {
    return false;
  }
  const area = outwardCode(geo.postcode).replace(/\d.*$/, "");
  if (["IM", "JE", "GY", "BT"].includes(area)) return false;
  return ["england", "scotland", "wales"].some((c) => country.includes(c));
}

/** Haversine distance in miles (great-circle) */
export function haversineMiles(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 3958.7613; // Earth radius miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Approximate road miles from crow-flies */
export function roadMiles(crowMiles: number): number {
  return Math.max(1, Math.round(crowMiles * ROAD_FACTOR));
}

/** Band from real road miles */
export function bandFromMiles(miles: number): string {
  if (miles <= 15) return "local";
  if (miles <= 50) return "regional";
  return "national";
}

export function etaFromMiles(miles: number, service: string): number {
  // ~25 mph average urban/intercity mix + service buffer
  const drive = Math.round((miles / 25) * 60);
  let buffer = 45;
  if (service === "medical" || service === "legal") buffer = 30;
  if (service === "removals" || service === "warehouse") buffer = 90;
  return Math.max(60, drive + buffer);
}
