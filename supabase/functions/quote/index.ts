import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import {
  assertPropertySize,
  assertService,
  assertVehicle,
  normalizePostcode,
  pricePence,
} from "../_shared/pricing.ts";
import {
  PostcodeError,
  bandFromMiles,
  etaFromMiles,
  haversineMiles,
  lookupPostcodes,
  roadMiles,
} from "../_shared/postcodes.ts";
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
    const pickup_raw = String(body.pickup_postcode ?? "");
    const dropoff_raw = String(body.dropoff_postcode ?? "");
    const package_notes = body.package_notes
      ? String(body.package_notes).slice(0, 500)
      : null;

    if (!pickup_raw.trim() || !dropoff_raw.trim()) {
      return jsonResponse(req, {
        error: "pickup_postcode and dropoff_postcode required",
      }, 400);
    }

    // Validate + geocode via postcodes.io
    const { pickup, dropoff } = await lookupPostcodes(pickup_raw, dropoff_raw);
    const crow = haversineMiles(pickup, dropoff);
    const miles = roadMiles(crow);
    const band = bandFromMiles(miles);
    const eta = etaFromMiles(miles, service_type);

    const property_size = service_type === "removals"
      ? assertPropertySize(body.property_size)
      : undefined;
    const vehicle_type = body.vehicle_type
      ? assertVehicle(body.vehicle_type, "small_van")
      : undefined;
    const with_pack = Boolean(body.with_pack);

    const priced = pricePence(
      service_type,
      normalizePostcode(pickup.postcode),
      normalizePostcode(dropoff.postcode),
      {
        property_size,
        vehicle_type,
        with_pack,
        geo: {
          miles,
          crow_miles: Math.round(crow * 10) / 10,
          band,
          eta,
          pickup_geo: {
            postcode: pickup.postcode,
            outcode: pickup.outcode,
            lat: pickup.latitude,
            lng: pickup.longitude,
            region: pickup.region,
            admin_district: pickup.admin_district,
          },
          dropoff_geo: {
            postcode: dropoff.postcode,
            outcode: dropoff.outcode,
            lat: dropoff.latitude,
            lng: dropoff.longitude,
            region: dropoff.region,
            admin_district: dropoff.admin_district,
          },
        },
      },
    );

    const expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        service_type,
        pickup_postcode: normalizePostcode(pickup.postcode),
        dropoff_postcode: normalizePostcode(dropoff.postcode),
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
          crow_miles: Math.round(crow * 10) / 10,
          property_size: property_size ?? null,
          vehicle_type: vehicle_type ?? null,
          with_pack,
          breakdown: priced.breakdown,
          pricing_engine: "competitive_apr2026",
          postcode_provider: "postcodes.io",
          pickup_formatted: pickup.postcode,
          dropoff_formatted: dropoff.postcode,
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
      pickup_postcode: normalizePostcode(pickup.postcode),
      dropoff_postcode: normalizePostcode(dropoff.postcode),
      pickup_formatted: pickup.postcode,
      dropoff_formatted: dropoff.postcode,
      currency: "GBP",
      amount_vat_inclusive_pence: data.amount_vat_inclusive_pence,
      amount_display: `£${(data.amount_vat_inclusive_pence / 100).toFixed(2)}`,
      distance_band: data.distance_band,
      estimated_miles: priced.estimated_miles,
      crow_miles: Math.round(crow * 10) / 10,
      eta_minutes: data.eta_minutes,
      vat: "inclusive",
      expires_at: data.expires_at,
      property_size: property_size ?? null,
      vehicle_type: vehicle_type ?? null,
      with_pack,
      pickup: {
        lat: pickup.latitude,
        lng: pickup.longitude,
        region: pickup.region,
        admin_district: pickup.admin_district,
      },
      dropoff: {
        lat: dropoff.latitude,
        lng: dropoff.longitude,
        region: dropoff.region,
        admin_district: dropoff.admin_district,
      },
      breakdown: priced.breakdown,
      pricing_engine: "competitive_apr2026",
      postcode_provider: "postcodes.io",
    });
  } catch (e) {
    if (e instanceof PostcodeError) {
      const status = e.code === "upstream" ? 503 : 422;
      return jsonResponse(req, {
        coverage_ok: false,
        error: e.message,
        code: e.code,
      }, status);
    }
    return jsonResponse(req, { error: (e as Error).message }, 400);
  }
});
