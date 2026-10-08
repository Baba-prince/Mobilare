export type ServiceType =
  | "courier"
  | "medical"
  | "legal"
  | "warehouse"
  | "removals"
  | "estate";

export const SERVICES: ServiceType[] = [
  "courier",
  "medical",
  "legal",
  "warehouse",
  "removals",
  "estate",
];

/** Base prices in pence, VAT-inclusive GBP */
const BASE_PENCE: Record<ServiceType, number> = {
  courier: 4500,
  medical: 7500,
  legal: 5500,
  warehouse: 12000,
  removals: 18000,
  estate: 6500,
};

const BAND_MULTIPLIER: Record<string, number> = {
  local: 1,
  regional: 1.35,
  national: 1.85,
};

/** Simple UK outward-code coverage for v1 (mainland-ish). Expand later. */
const BLOCKED_OUTWARDS = new Set([
  "IM", "JE", "GY", "BT", // islands / NI — quote as uncovered in v1
]);

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

/** Crude band from outward numeric difference — placeholder until Distance Matrix */
export function distanceBand(pickup: string, dropoff: string): string {
  const a = outwardCode(pickup);
  const b = outwardCode(dropoff);
  if (!a || !b) return "local";
  if (a === b) return "local";
  const num = (s: string) => parseInt(s.replace(/^[A-Z]+/, ""), 10) || 0;
  const delta = Math.abs(num(a) - num(b));
  if (delta <= 5) return "local";
  if (delta <= 20) return "regional";
  return "national";
}

export function etaMinutes(band: string, service: ServiceType): number {
  const base = band === "local" ? 90 : band === "regional" ? 180 : 360;
  if (service === "medical" || service === "legal") return Math.max(60, base - 15);
  if (service === "removals" || service === "warehouse") return base + 60;
  return base;
}

export function pricePence(
  service: ServiceType,
  pickup: string,
  dropoff: string,
): { amount: number; band: string; eta: number; coverage_ok: boolean } {
  const coverage_ok = isCovered(pickup) && isCovered(dropoff);
  const band = distanceBand(pickup, dropoff);
  const amount = Math.round(
    BASE_PENCE[service] * (BAND_MULTIPLIER[band] ?? 1),
  );
  return {
    amount,
    band,
    eta: etaMinutes(band, service),
    coverage_ok,
  };
}

export function assertService(v: string): ServiceType {
  if (!SERVICES.includes(v as ServiceType)) {
    throw new Error(
      `Invalid service_type. Allowed: ${SERVICES.join(", ")}`,
    );
  }
  return v as ServiceType;
}
