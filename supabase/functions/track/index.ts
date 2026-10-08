import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "GET") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  const url = new URL(req.url);
  const ref = url.searchParams.get("ref") ?? url.searchParams.get("booking_ref");
  const token = url.searchParams.get("token");

  if (!ref && !token) {
    return jsonResponse(req, { error: "Provide ref or token" }, 400);
  }

  const supabase = serviceClient();
  let query = supabase
    .from("bookings")
    .select(
      `booking_ref, status, service_type, pickup_postcode, dropoff_postcode,
       amount_vat_inclusive_pence, currency, created_at,
       jobs ( status, eta_minutes, driver_name, updated_at,
         proof_of_delivery ( photo_url, lat, lng, captured_at ) )`,
    );

  if (token) query = query.eq("tracking_token", token);
  else query = query.eq("booking_ref", ref!);

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error(error);
    return jsonResponse(req, { error: "Lookup failed" }, 500);
  }
  if (!data) {
    return jsonResponse(req, { error: "Booking not found" }, 404);
  }

  const job = Array.isArray(data.jobs) ? data.jobs[0] : data.jobs;
  const pods = job?.proof_of_delivery;
  const pod = Array.isArray(pods) ? pods[0] : pods;

  return jsonResponse(req, {
    booking_ref: data.booking_ref,
    status: data.status,
    service_type: data.service_type,
    pickup_postcode: data.pickup_postcode,
    dropoff_postcode: data.dropoff_postcode,
    job: job
      ? {
        status: job.status,
        eta_minutes: job.eta_minutes,
        driver_name: job.driver_name,
        updated_at: job.updated_at,
      }
      : null,
    proof_of_delivery: pod
      ? {
        photo_url: pod.photo_url,
        lat: pod.lat,
        lng: pod.lng,
        captured_at: pod.captured_at,
      }
      : null,
  });
});
