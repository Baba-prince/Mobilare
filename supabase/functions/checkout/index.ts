import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return jsonResponse(req, { error: "Stripe not configured" }, 500);
    }

    const body = await req.json();
    const quote_id = String(body.quote_id ?? "");
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = body.phone ? String(body.phone).trim() : null;
    const company = body.company ? String(body.company).trim() : null;
    const pickup_address = String(body.pickup_address ?? "").trim();
    const dropoff_address = String(body.dropoff_address ?? "").trim();
    const notes = body.notes ? String(body.notes).slice(0, 1000) : null;

    if (!quote_id || !name || !email || !pickup_address || !dropoff_address) {
      return jsonResponse(req, {
        error:
          "quote_id, name, email, pickup_address, dropoff_address are required",
      }, 400);
    }

    const supabase = serviceClient();
    const { data: quote, error: qErr } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quote_id)
      .single();

    if (qErr || !quote) {
      return jsonResponse(req, { error: "Quote not found" }, 404);
    }
    if (new Date(quote.expires_at).getTime() < Date.now()) {
      return jsonResponse(req, { error: "Quote expired — request a new quote" }, 410);
    }

    const { data: customer, error: cErr } = await supabase
      .from("customers")
      .insert({ name, email, phone, company })
      .select("id")
      .single();
    if (cErr || !customer) {
      console.error(cErr);
      return jsonResponse(req, { error: "Failed to save customer" }, 500);
    }

    const { data: refRow, error: refErr } = await supabase.rpc(
      "generate_booking_ref",
    );
    // fallback if RPC not exposed: generate client-side style ref
    let booking_ref = refRow as string | null;
    if (refErr || !booking_ref) {
      booking_ref = `MB-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    }

    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .insert({
        booking_ref,
        quote_id: quote.id,
        customer_id: customer.id,
        status: "awaiting_payment",
        service_type: quote.service_type,
        pickup_address,
        dropoff_address,
        pickup_postcode: quote.pickup_postcode,
        dropoff_postcode: quote.dropoff_postcode,
        notes,
        amount_vat_inclusive_pence: quote.amount_vat_inclusive_pence,
        currency: "GBP",
      })
      .select("id, booking_ref, tracking_token, amount_vat_inclusive_pence")
      .single();

    if (bErr || !booking) {
      console.error(bErr);
      return jsonResponse(req, { error: "Failed to create booking" }, 500);
    }

    const successUrl = Deno.env.get("SUCCESS_URL") ??
      "https://mobilare.co.uk/booking-success";
    const cancelUrl = Deno.env.get("CANCEL_URL") ??
      "https://mobilare.co.uk/booking-cancel";

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      success_url:
        `${successUrl}?booking_ref=${encodeURIComponent(booking.booking_ref)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        `${cancelUrl}?booking_ref=${encodeURIComponent(booking.booking_ref)}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: booking.amount_vat_inclusive_pence,
            product_data: {
              name: `Mobilare ${quote.service_type} delivery`,
              description:
                `${quote.pickup_postcode} → ${quote.dropoff_postcode} (VAT inclusive)`,
            },
          },
        },
      ],
      metadata: {
        booking_id: booking.id,
        booking_ref: booking.booking_ref,
        quote_id: quote.id,
      },
    });

    const { error: pErr } = await supabase.from("payments").insert({
      booking_id: booking.id,
      stripe_checkout_session_id: session.id,
      amount_pence: booking.amount_vat_inclusive_pence,
      currency: "GBP",
      status: "pending",
    });
    if (pErr) console.error(pErr);

    return jsonResponse(req, {
      booking_id: booking.id,
      booking_ref: booking.booking_ref,
      tracking_token: booking.tracking_token,
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (e) {
    console.error(e);
    return jsonResponse(req, { error: (e as Error).message }, 400);
  }
});
