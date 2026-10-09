import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { adminClient } from "../_shared/service.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const { conversation_id, message_body } = await req.json();
    if (!conversation_id || !message_body) {
      return jsonResponse(req, { error: "conversation_id and message_body required" }, 400);
    }

    const supabase = adminClient();
    const { data: convo } = await supabase
      .from("conversations")
      .select("*, customers(*)")
      .eq("id", conversation_id)
      .single();

    const lower = String(message_body).toLowerCase();
    let intent = "general";
    if (/quote|how much|price|cost/.test(lower)) intent = "quote_request";
    if (/where is|eta|driver|track/.test(lower)) intent = "tracking";
    if (/[a-z]{1,2}\d{1,2}\s*\d[a-z]{2}/i.test(message_body)) intent = "new_shipment";

    let suggested =
      intent === "tracking"
        ? `Hi ${convo?.customers?.name || "there"}, open live tracking at https://mobilare.co.uk/track with your booking reference.`
        : `Thanks for reaching out! I can help with quotes, bookings, and tracking. What's your pickup and drop-off postcode?`;

    // Production: OpenAI rewrite when configured
    const openai = Deno.env.get("OPENAI_API_KEY");
    if (openai) {
      try {
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openai}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
            temperature: 0.4,
            messages: [
              {
                role: "system",
                content:
                  "You are MCL, Mobilare's UK same-day courier ops assistant. Be concise, professional, VAT-inclusive GBP. Never invent booking refs.",
              },
              {
                role: "user",
                content:
                  `Customer message: ${message_body}\nDetected intent: ${intent}\nDraft reply to improve:\n${suggested}`,
              },
            ],
          }),
        });
        const ai = await aiRes.json();
        const text = ai.choices?.[0]?.message?.content?.trim();
        if (text) suggested = text;
      } catch (e) {
        console.error("openai", e);
      }
    }

    if (intent === "new_shipment" && convo?.customer_id) {
      const { data: shipment } = await supabase.from("shipments").insert({
        customer_id: convo.customer_id,
        status: "raw",
        service_type: "courier",
      }).select().single();

      if (shipment) {
        await supabase.from("outbound_messages").insert({
          customer_id: convo.customer_id,
          channel: "internal",
          template_key: "new_lead_from_bot",
          payload: { shipment_id: shipment.id },
        });
        suggested +=
          ` I've logged lead ${String(shipment.id).slice(0, 8).toUpperCase()} for ops to confirm.`;
      }
    }

    await supabase.from("messages").insert({
      conversation_id,
      sender_type: "bot",
      body: suggested,
      ai_suggested: true,
    });

    return jsonResponse(req, {
      intent,
      suggested,
      openai: Boolean(openai),
    });
  } catch (e) {
    return jsonResponse(req, { error: (e as Error).message }, 500);
  }
});
