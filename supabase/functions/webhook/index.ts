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
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
