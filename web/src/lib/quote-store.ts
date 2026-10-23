import { promises as fs } from "fs";
import path from "path";

export type StoredQuote = {
  quote_id: string;
  service_type: string;
  amount_vat_inclusive_pence: number;
  amount_display: string;
  currency: string;
  distance_band: string;
  eta_minutes: number;
  estimated_miles: number;
  crow_miles: number;
  pickup_postcode: string;
  dropoff_postcode: string;
  pickup_formatted: string;
  dropoff_formatted: string;
  coverage_ok: boolean;
  expires_at: string;
  created_at: string;
};

const DATA_DIR = process.env.MOBILARE_DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "quotes.json");

async function readAll(): Promise<Record<string, StoredQuote>> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Record<string, StoredQuote>;
  } catch {
    return {};
  }
}

async function writeAll(data: Record<string, StoredQuote>) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

export async function saveQuote(q: StoredQuote) {
  const all = await readAll();
  all[q.quote_id] = q;
  await writeAll(all);
}

export async function getQuote(id: string) {
  const all = await readAll();
  return all[id] || null;
}
