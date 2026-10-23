import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { getQuote } from "@/lib/quote-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const body = await req.json();
    const quote_id = String(body.quote_id || "");
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = body.phone ? String(body.phone).trim() : "";
    const company = body.company ? String(body.company).trim() : "";
    const pickup_address = String(body.pickup_address || "").trim();
    const dropoff_address = String(body.dropoff_address || "").trim();

    if (!quote_id || !name || !email || !pickup_address || !dropoff_address) {
      return NextResponse.json(
        { error: "quote_id, name, email, pickup_address, dropoff_address are required" },
        { status: 400 },
      );
    }

    const quote = await getQuote(quote_id);
    if (!quote) {
      return NextResponse.json({ error: "Quote not found — get a new quote" }, { status: 404 });
    }
    if (new Date(quote.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Quote expired — request a new quote" }, { status: 410 });
    }

    const booking_ref = `MB-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const successUrl =
      process.env.SUCCESS_URL || "https://mobilare.co.uk/booking-success";
    const cancelUrl =
      process.env.CANCEL_URL || "https://mobilare.co.uk/booking-cancel";

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      success_url: `${successUrl}?booking_ref=${encodeURIComponent(booking_ref)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancelUrl}?booking_ref=${encodeURIComponent(booking_ref)}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: quote.amount_vat_inclusive_pence,
            product_data: {
              name: `Mobilare ${quote.service_type} delivery`,
              description: `${quote.pickup_postcode} → ${quote.dropoff_postcode} (VAT inclusive)`,
            },
          },
        },
      ],
      metadata: {
        booking_ref,
        quote_id: quote.quote_id,
        customer_name: name,
        customer_phone: phone,
        company,
        pickup_address: pickup_address.slice(0, 450),
        dropoff_address: dropoff_address.slice(0, 450),
      },
    });

    return NextResponse.json({
      booking_ref,
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 400 },
    );
  }
}
