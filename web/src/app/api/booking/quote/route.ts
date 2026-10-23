import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { assertService, normalizePostcode, priceQuote, type PropertySize, type VehicleType } from "@/lib/pricing";
import { saveQuote } from "@/lib/quote-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function geo(postcode: string) {
  const pc = normalizePostcode(postcode);
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
  const data = await res.json();
  if (!res.ok || !data.result) {
    throw new Error(`Postcode not found: ${postcode}`);
  }
  return data.result as {
    postcode: string;
    outcode: string;
    latitude: number;
    longitude: number;
    region: string | null;
    admin_district: string | null;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const service_type = assertService(String(body.service_type || ""));
    const pickup_raw = String(body.pickup_postcode || "");
    const dropoff_raw = String(body.dropoff_postcode || "");
    if (!pickup_raw.trim() || !dropoff_raw.trim()) {
      return NextResponse.json(
        { error: "pickup_postcode and dropoff_postcode required" },
        { status: 400 },
      );
    }

    const [pickup, dropoff] = await Promise.all([geo(pickup_raw), geo(dropoff_raw)]);
    const priced = priceQuote({
      service: service_type,
      pickup: pickup.postcode,
      dropoff: dropoff.postcode,
      pickupLat: pickup.latitude,
      pickupLng: pickup.longitude,
      dropoffLat: dropoff.latitude,
      dropoffLng: dropoff.longitude,
      property_size: body.property_size as PropertySize | undefined,
      vehicle_type: body.vehicle_type as VehicleType | undefined,
      with_pack: Boolean(body.with_pack),
    });

    const quote_id = randomUUID();
    const payload = {
      quote_id,
      service_type,
      amount_vat_inclusive_pence: priced.amount_pence,
      amount_display: priced.amount_display,
      currency: "GBP",
      distance_band: priced.distance_band,
      eta_minutes: priced.eta_minutes,
      estimated_miles: priced.estimated_miles,
      crow_miles: priced.crow_miles,
      pickup_postcode: pickup.postcode,
      dropoff_postcode: dropoff.postcode,
      pickup_formatted: pickup.postcode,
      dropoff_formatted: dropoff.postcode,
      coverage_ok: true,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    await saveQuote(payload);

    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Quote failed" },
      { status: 400 },
    );
  }
}
