import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import {
  directionsRoute,
  geocodeAddress,
  geocodePostcode,
  googleMapsKey,
} from "../_shared/google_maps.ts";

/**
 * Production maps API:
 * POST { action: "geocode", query }
 * POST { action: "route", origin_postcode, destination_postcode }
 * GET  ?postcode=
 */
Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (!googleMapsKey()) {
    return jsonResponse(req, {
      error: "GOOGLE_MAPS_API_KEY not configured",
      code: "maps_not_configured",
    }, 503);
  }

  try {
    if (req.method === "GET") {
      const pc = new URL(req.url).searchParams.get("postcode") ?? "";
      const g = await geocodePostcode(pc);
      if (!g) return jsonResponse(req, { error: "not found" }, 404);
      return jsonResponse(req, { postcode: pc, ...g, provider: "google" });
    }

    if (req.method !== "POST") {
      return jsonResponse(req, { error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    const action = String(body.action ?? "geocode");

    if (action === "geocode") {
      const query = String(body.query ?? body.postcode ?? "");
      const g = await geocodeAddress(query, {
        region: "uk",
        components: "country:GB",
      });
      if (!g) return jsonResponse(req, { error: "not found" }, 404);
      return jsonResponse(req, { ...g, provider: "google" });
    }

    if (action === "route") {
      const o = String(body.origin_postcode ?? "");
      const d = String(body.destination_postcode ?? "");
      const origin = await geocodePostcode(o);
      const dest = await geocodePostcode(d);
      if (!origin || !dest) {
        return jsonResponse(req, { error: "Could not geocode postcodes" }, 422);
      }
      const route = await directionsRoute(origin, dest);
      return jsonResponse(req, {
        origin: { postcode: o, ...origin },
        destination: { postcode: d, ...dest },
        route,
        provider: "google",
      });
    }

    return jsonResponse(req, { error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse(req, { error: (e as Error).message }, 500);
  }
});
