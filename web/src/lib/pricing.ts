/** Browser/server port of Mobilare competitive pricing (VAT-inclusive pence). */

export type ServiceType =
  | "courier"
  | "medical"
  | "legal"
  | "warehouse"
  | "removals"
  | "estate";

export type PropertySize = "studio_1bed" | "2bed" | "3bed" | "4bed";
export type VehicleType = "small_van" | "luton";

const SERVICES: ServiceType[] = [
  "courier",
  "medical",
  "legal",
  "warehouse",
  "removals",
  "estate",
];

const MOBILARE_REMOVALS_PENCE: Record<PropertySize, number> = {
  studio_1bed: 46900,
  "2bed": 53900,
  "3bed": 66900,
  "4bed": 90900,
};

const COURIER_BASE_PENCE = 4999;
const RATE_SMALL_VAN = 50;
const RATE_LUTON = 120;
const LONG_EXTRA = 100;

const SPECIALTY: Partial<Record<ServiceType, { base_extra: number; vehicle: VehicleType }>> = {
  medical: { base_extra: 2500, vehicle: "small_van" },
  legal: { base_extra: 1000, vehicle: "small_van" },
  estate: { base_extra: 1500, vehicle: "small_van" },
};

const REMOVALS_BAND_MULT: Record<string, number> = {
  local: 1,
  regional: 1.12,
  national: 1.25,
};

const LONDON = new Set(["E", "EC", "N", "NW", "SE", "SW", "W", "WC"]);
const SOUTH_EAST = new Set([
  "E", "EC", "N", "NW", "SE", "SW", "W", "WC",
  "BR", "CR", "DA", "EN", "HA", "IG", "KT", "RM", "SM", "TW", "UB", "WD",
  "CM", "SS", "ME", "TN", "RH", "GU", "SL", "RG", "AL", "HP", "LU", "MK",
]);

export function normalizePostcode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function outwardCode(postcode: string): string {
  const pc = normalizePostcode(postcode);
  if (pc.length < 5 || pc.length > 7) return "";
  return pc.slice(0, pc.length - 3);
}

export function distanceBand(pickup: string, dropoff: string): string {
  const a = outwardCode(pickup);
  const b = outwardCode(dropoff);
  if (!a || !b) return "local";
  if (a === b) return "local";
  const area = (out: string) => out.replace(/\d.*$/, "");
  const areaA = area(a);
  const areaB = area(b);
  if (areaA === areaB) return "local";
  if (LONDON.has(areaA) && LONDON.has(areaB)) return "local";
  if (SOUTH_EAST.has(areaA) && SOUTH_EAST.has(areaB)) return "regional";
  return "national";
}

function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function roadMilesFromCrow(crow: number): number {
  return Math.round(crow * 1.25 * 10) / 10;
}

export function etaFromMiles(miles: number, service: ServiceType): number {
  const band = miles < 15 ? "local" : miles < 50 ? "regional" : "national";
  const base = band === "local" ? 90 : band === "regional" ? 180 : 360;
  if (service === "medical" || service === "legal") return Math.max(60, base - 15);
  if (service === "removals" || service === "warehouse") return base + 120;
  return base;
}

export function assertService(v: string): ServiceType {
  if (!SERVICES.includes(v as ServiceType)) {
    throw new Error(`Invalid service_type. Allowed: ${SERVICES.join(", ")}`);
  }
  return v as ServiceType;
}

function mileageCharge(miles: number, vehicle: VehicleType, band: string): number {
  const rate = vehicle === "luton" ? RATE_LUTON : RATE_SMALL_VAN;
  let total = rate * miles;
  if (band === "national") total += LONG_EXTRA * miles;
  return Math.round(total);
}

export function priceQuote(opts: {
  service: ServiceType;
  pickup: string;
  dropoff: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  property_size?: PropertySize;
  vehicle_type?: VehicleType;
  with_pack?: boolean;
}) {
  const crow = haversineMiles(
    { lat: opts.pickupLat, lng: opts.pickupLng },
    { lat: opts.dropoffLat, lng: opts.dropoffLng },
  );
  const miles = roadMilesFromCrow(crow);
  const band =
    miles < 15 ? "local" : miles < 50 ? distanceBand(opts.pickup, opts.dropoff) : "national";
  const resolvedBand = miles < 15 ? "local" : miles < 50 ? (band === "national" ? "regional" : band) : "national";
  const eta = etaFromMiles(miles, opts.service);

  let amount = 0;
  if (opts.service === "removals") {
    const size = opts.property_size || "studio_1bed";
    let base = MOBILARE_REMOVALS_PENCE[size];
    if (opts.with_pack) {
      const packMult: Record<PropertySize, number> = {
        studio_1bed: 84900 / 48300,
        "2bed": 96800 / 55500,
        "3bed": 118400 / 68800,
        "4bed": 157700 / 93800,
      };
      base = Math.round(base * packMult[size]);
    }
    amount = Math.round(base * (REMOVALS_BAND_MULT[resolvedBand] ?? 1));
  } else if (opts.service === "warehouse") {
    const vehicle = opts.vehicle_type === "small_van" ? "small_van" : "luton";
    amount = 9999 + mileageCharge(miles, vehicle, resolvedBand);
  } else {
    const vehicle =
      opts.vehicle_type ||
      SPECIALTY[opts.service]?.vehicle ||
      "small_van";
    const extra = opts.service === "courier" ? 0 : SPECIALTY[opts.service]?.base_extra || 0;
    amount = COURIER_BASE_PENCE + extra + mileageCharge(miles, vehicle, resolvedBand);
  }

  return {
    amount_pence: amount,
    amount_display: `£${(amount / 100).toFixed(2)}`,
    distance_band: resolvedBand,
    eta_minutes: eta,
    estimated_miles: miles,
    crow_miles: Math.round(crow * 10) / 10,
  };
}
