import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response("Stripe webhook not configured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    // Deno: prefer async constructor (SubtleCrypto)
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error("Signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = serviceClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (!bookingId) {
        return new Response("Missing booking_id metadata", { status: 400 });
      }

      await supabase
        .from("payments")
        .update({
          status: "succeeded",
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          raw: session as unknown as Record<string, unknown>,
        })
        .eq("stripe_checkout_session_id", session.id);

      await supabase
        .from("bookings")
        .update({ status: "paid" })
        .eq("id", bookingId);

      const { data: existing } = await supabase
        .from("jobs")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("jobs").insert({
          booking_id: bookingId,
          status: "queued",
          eta_minutes: 90,
        });
      }

      // Queue confirmation email when Resend is configured (process_queue sends it)
      const { data: booking } = await supabase
        .from("bookings")
        .select(
          "booking_ref, pickup_postcode, dropoff_postcode, customer_id, customers(email, name)",
        )
        .eq("id", bookingId)
        .maybeSingle();

      const customer = booking?.customers as
        | { email?: string; name?: string }
        | { email?: string; name?: string }[]
        | null;
      const cust = Array.isArray(customer) ? customer[0] : customer;
      if (booking && cust?.email) {
        await supabase.from("outbound_messages").insert({
          customer_id: booking.customer_id,
          channel: "email",
          template_key: "booking_paid",
          payload: {
            to: cust.email,
            subject: `Mobilare booking confirmed — ${booking.booking_ref}`,
            html:
              `<p>Hi ${cust.name || "there"},</p>` +
              `<p>Payment received. Your booking <strong>${booking.booking_ref}</strong> ` +
              `(${booking.pickup_postcode} → ${booking.dropoff_postcode}) is confirmed.</p>` +
              `<p><a href="https://mobilare.co.uk/track?ref=${booking.booking_ref}">Track this delivery</a></p>`,
            body:
              `Booking ${booking.booking_ref} paid. Track: https://mobilare.co.uk/track?ref=${booking.booking_ref}`,
          },
          status: "queued",
        });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await supabase
        .from("payments")
        .update({ status: "expired" })
        .eq("stripe_checkout_session_id", session.id);
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const pi = typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;
      if (pi) {
        const { data: payment } = await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent_id", pi)
          .select("booking_id")
          .maybeSingle();
        if (payment?.booking_id) {
          await supabase
            .from("bookings")
            .update({ status: "cancelled" })
            .eq("id", payment.booking_id);
        }
      }
    }
  } catch (e) {
    console.error(e);
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
