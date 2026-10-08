/**
 * Mobilare Competitive Pricing Engine
 * Benchmark: Anyvan / Britannia / Pickfords / Man & Van + courier market (Apr 2026)
 * All amounts VAT-inclusive GBP (pence).
 */

export type ServiceType =
  | "courier"
  | "medical"
  | "legal"
  | "warehouse"
  | "removals"
  | "estate";

export type PropertySize = "studio_1bed" | "2bed" | "3bed" | "4bed";
export type VehicleType = "small_van" | "luton";

export const SERVICES: ServiceType[] = [
  "courier",
  "medical",
  "legal",
  "warehouse",
  "removals",
  "estate",
];

/** Competitor removals benchmark (Anyvan avg, no pack) — reference only */
export const COMPETITOR_REMOVALS_ANYVAN_AVG_PENCE: Record<PropertySize, number> = {
  studio_1bed: 48300,
  "2bed": 55500,
  "3bed": 68800,
  "4bed": 93800,
};

/**
 * Mobilare removals (no pack) — ~3% under Anyvan avg for competitiveness.
 * Premium/with-pack and Britannia ranges are documented in docs/PRICING_ENGINE.md
 */
export const MOBILARE_REMOVALS_PENCE: Record<PropertySize, number> = {
  studio_1bed: 46900, // vs Anyvan £483
  "2bed": 53900, // vs £555
  "3bed": 66900, // vs £688
  "4bed": 90900, // vs £938
};

/** Same-day courier market */
export const COURIER_BASE_PENCE = 4999; // £49.99
export const RATE_SMALL_VAN_PENCE_PER_MILE = 50; // 50p
export const RATE_LUTON_PENCE_PER_MILE = 120; // £1.20
export const LONG_DISTANCE_EXTRA_PENCE_PER_MILE = 100; // +£1/mile

/** Specialty overlays on courier maths */
const SPECIALTY: Record<
  Exclude<ServiceType, "courier" | "removals" | "warehouse">,
  { base_extra: number; vehicle: VehicleType }
> = {
  medical: { base_extra: 2500, vehicle: "small_van" }, // +£25
  legal: { base_extra: 1000, vehicle: "small_van" }, // +£10
  estate: { base_extra: 1500, vehicle: "small_van" }, // +£15
};

const REMOVALS_BAND_MULT: Record<string, number> = {
  local: 1,
  regional: 1.12,
  national: 1.25,
};

const BLOCKED_OUTWARDS = new Set(["IM", "JE", "GY", "BT"]);

export function normalizePostcode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function outwardCode(postcode: string): string {
  const pc = normalizePostcode(postcode);
  if (pc.length < 5 || pc.length > 7) return "";
  return pc.slice(0, pc.length - 3);
}

export function isCovered(postcode: string): boolean {
  const out = outwardCode(postcode);
  if (!out || !/^[A-Z]{1,2}\d[A-Z\d]?$/.test(out)) return false;
  const area = out.replace(/\d.*$/, "");
  return !BLOCKED_OUTWARDS.has(area);
}

const LONDON = new Set(["E", "EC", "N", "NW", "SE", "SW", "W", "WC"]);
const SOUTH_EAST = new Set([
  ...LONDON,
  "BR", "CR", "DA", "EN", "HA", "IG", "KT", "RM", "SM", "TW", "UB", "WD",
  "CM", "SS", "ME", "TN", "RH", "GU", "SL", "RG", "AL", "HP", "LU", "MK",
]);

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

/** Estimated road miles until Distance Matrix is wired */
export function estimatedMiles(band: string): number {
  if (band === "local") return 8;
  if (band === "regional") return 35;
  return 90; // national / long-distance
}

export function etaMinutes(band: string, service: ServiceType): number {
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

export function assertPropertySize(v: unknown): PropertySize {
  const allowed: PropertySize[] = ["studio_1bed", "2bed", "3bed", "4bed"];
  const s = String(v ?? "studio_1bed") as PropertySize;
  if (!allowed.includes(s)) {
    throw new Error(`Invalid property_size. Allowed: ${allowed.join(", ")}`);
  }
  return s;
}

export function assertVehicle(v: unknown, fallback: VehicleType): VehicleType {
  if (v === "luton" || v === "small_van") return v;
  return fallback;
}

function mileageChargePence(
  miles: number,
  vehicle: VehicleType,
  band: string,
): number {
  const rate = vehicle === "luton"
    ? RATE_LUTON_PENCE_PER_MILE
    : RATE_SMALL_VAN_PENCE_PER_MILE;
  let total = rate * miles;
  if (band === "national") {
    total += LONG_DISTANCE_EXTRA_PENCE_PER_MILE * miles;
  }
  return Math.round(total);
}

export type PriceResult = {
  amount: number;
  band: string;
  eta: number;
  coverage_ok: boolean;
  estimated_miles: number;
  breakdown: Record<string, unknown>;
};

export function pricePence(
  service: ServiceType,
  pickup: string,
  dropoff: string,
  opts: {
    property_size?: PropertySize;
    vehicle_type?: VehicleType;
    with_pack?: boolean;
  } = {},
): PriceResult {
  const coverage_ok = isCovered(pickup) && isCovered(dropoff);
  const band = distanceBand(pickup, dropoff);
  const miles = estimatedMiles(band);
  const eta = etaMinutes(band, service);

  if (service === "removals") {
    const size = opts.property_size ?? "studio_1bed";
    let base = MOBILARE_REMOVALS_PENCE[size];
    // Optional with-pack ~ Anyvan premium uplift (~75% on studio benchmark)
    if (opts.with_pack) {
      const packMult: Record<PropertySize, number> = {
        studio_1bed: 84900 / 48300,
        "2bed": 96800 / 55500,
        "3bed": 118400 / 68800,
        "4bed": 157700 / 93800,
      };
      base = Math.round(base * packMult[size]);
    }
    const amount = Math.round(base * (REMOVALS_BAND_MULT[band] ?? 1));
    return {
      amount,
      band,
      eta,
      coverage_ok,
      estimated_miles: miles,
      breakdown: {
        engine: "competitive_removals_apr2026",
        property_size: size,
        with_pack: !!opts.with_pack,
        mobilare_base_pence: base,
        competitor_anyvan_avg_pence: COMPETITOR_REMOVALS_ANYVAN_AVG_PENCE[size],
        distance_multiplier: REMOVALS_BAND_MULT[band],
      },
    };
  }

  if (service === "warehouse") {
    const vehicle = assertVehicle(opts.vehicle_type, "luton");
    const base = 9999; // £99.99 warehouse transfer base
    const mileage = mileageChargePence(miles, vehicle, band);
    const amount = base + mileage;
    return {
      amount,
      band,
      eta,
      coverage_ok,
      estimated_miles: miles,
      breakdown: {
        engine: "competitive_courier_apr2026",
        base_pence: base,
        vehicle,
        rate_pence_per_mile: vehicle === "luton"
          ? RATE_LUTON_PENCE_PER_MILE
          : RATE_SMALL_VAN_PENCE_PER_MILE,
        long_distance_extra: band === "national",
        mileage_pence: mileage,
      },
    };
  }

  // courier + medical + legal + estate
  const vehicle = assertVehicle(
    opts.vehicle_type,
    service === "courier" ? "small_van" : (SPECIALTY[service as keyof typeof SPECIALTY]?.vehicle ?? "small_van"),
  );
  const extra = service === "courier"
    ? 0
    : (SPECIALTY[service as keyof typeof SPECIALTY]?.base_extra ?? 0);
  const base = COURIER_BASE_PENCE + extra;
  const mileage = mileageChargePence(miles, vehicle, band);
  const amount = base + mileage;

  return {
    amount,
    band,
    eta,
    coverage_ok,
    estimated_miles: miles,
    breakdown: {
      engine: "competitive_courier_apr2026",
      service,
      courier_base_pence: COURIER_BASE_PENCE,
      specialty_extra_pence: extra,
      vehicle,
      rate_pence_per_mile: vehicle === "luton"
        ? RATE_LUTON_PENCE_PER_MILE
        : RATE_SMALL_VAN_PENCE_PER_MILE,
      long_distance_extra_per_mile_pence: band === "national"
        ? LONG_DISTANCE_EXTRA_PENCE_PER_MILE
        : 0,
      estimated_miles: miles,
      mileage_pence: mileage,
      market_note: "Same-day courier market base £49.99; small van 50p/mi; Luton £1.20/mi; +£1/mi long distance",
    },
  };
}
