import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import {
  assertPropertySize,
  assertService,
  assertVehicle,
  normalizePostcode,
  pricePence,
} from "../_shared/pricing.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const service_type = assertService(String(body.service_type ?? ""));
    const pickup_postcode = normalizePostcode(String(body.pickup_postcode ?? ""));
    const dropoff_postcode = normalizePostcode(
      String(body.dropoff_postcode ?? ""),
    );
    const package_notes = body.package_notes
      ? String(body.package_notes).slice(0, 500)
      : null;

    if (!pickup_postcode || !dropoff_postcode) {
      return jsonResponse(req, {
        error: "pickup_postcode and dropoff_postcode required",
      }, 400);
    }

    const property_size = service_type === "removals"
      ? assertPropertySize(body.property_size)
      : undefined;
    const vehicle_type = body.vehicle_type
      ? assertVehicle(body.vehicle_type, "small_van")
      : undefined;
    const with_pack = Boolean(body.with_pack);

    const priced = pricePence(service_type, pickup_postcode, dropoff_postcode, {
      property_size,
      vehicle_type,
      with_pack,
    });

    if (!priced.coverage_ok) {
      return jsonResponse(req, {
        coverage_ok: false,
        error:
          "Postcode outside Mobilare coverage for online booking. Call 07984 884644.",
      }, 422);
    }

    const expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        service_type,
        pickup_postcode,
        dropoff_postcode,
        package_notes,
        amount_vat_inclusive_pence: priced.amount,
        distance_band: priced.band,
        eta_minutes: priced.eta,
        coverage_ok: true,
        expires_at,
        meta: {
          vat: "inclusive",
          currency: "GBP",
          estimated_miles: priced.estimated_miles,
          property_size: property_size ?? null,
          vehicle_type: vehicle_type ?? null,
          with_pack,
          breakdown: priced.breakdown,
          pricing_engine: "competitive_apr2026",
        },
      })
      .select(
        "id, amount_vat_inclusive_pence, distance_band, eta_minutes, expires_at, meta",
      )
      .single();

    if (error) {
      console.error(error);
      return jsonResponse(req, { error: "Failed to create quote" }, 500);
    }

    return jsonResponse(req, {
      coverage_ok: true,
      quote_id: data.id,
      service_type,
      pickup_postcode,
      dropoff_postcode,
      currency: "GBP",
      amount_vat_inclusive_pence: data.amount_vat_inclusive_pence,
      amount_display: `£${(data.amount_vat_inclusive_pence / 100).toFixed(2)}`,
      distance_band: data.distance_band,
      estimated_miles: priced.estimated_miles,
      eta_minutes: data.eta_minutes,
      vat: "inclusive",
      expires_at: data.expires_at,
      property_size: property_size ?? null,
      vehicle_type: vehicle_type ?? null,
      with_pack,
      breakdown: priced.breakdown,
      pricing_engine: "competitive_apr2026",
    });
  } catch (e) {
    return jsonResponse(req, { error: (e as Error).message }, 400);
  }
});
