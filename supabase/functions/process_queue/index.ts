import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { adminClient } from "../_shared/service.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const supabase = adminClient();
  const { data: queued } = await supabase
    .from("outbound_messages")
    .select("*")
    .eq("status", "queued")
    .lt("attempts", 3)
    .limit(20);

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const msg of queued || []) {
    try {
      const payload = msg.payload || {};
      if (msg.channel === "sms" || msg.channel === "whatsapp") {
        const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const token = Deno.env.get("TWILIO_AUTH_TOKEN");
        const from = Deno.env.get("TWILIO_FROM");
        if (!sid || !token || !from) throw new Error("Twilio not configured");
        const to = payload.to;
        if (!to) throw new Error("Missing payload.to");
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: "Basic " + btoa(`${sid}:${token}`),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: msg.channel === "whatsapp" ? `whatsapp:${to}` : to,
              From: msg.channel === "whatsapp" ? `whatsapp:${from}` : from,
              Body: String(payload.body || ""),
            }),
          },
        );
        if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
      }

      if (msg.channel === "email") {
        const key = Deno.env.get("RESEND_KEY") || Deno.env.get("RESEND_API_KEY");
        if (!key) throw new Error("Resend not configured");
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: Deno.env.get("RESEND_FROM") ||
              "Mobilare <noreply@mobilare.co.uk>",
            to: payload.to,
            subject: payload.subject || "Mobilare update",
            html: payload.html || `<p>${payload.body || ""}</p>`,
          }),
        });
        if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
      }

      await supabase.from("outbound_messages").update({ status: "sent" }).eq(
        "id",
        msg.id,
      );
      results.push({ id: msg.id, ok: true });
    } catch (e) {
      await supabase.from("outbound_messages").update({
        status: "queued",
        attempts: (msg.attempts || 0) + 1,
      }).eq("id", msg.id);
      results.push({ id: msg.id, ok: false, error: (e as Error).message });
    }
  }

  return jsonResponse(req, {
    processed: results.length,
    results,
    twilio: Boolean(Deno.env.get("TWILIO_ACCOUNT_SID")),
    resend: Boolean(
      Deno.env.get("RESEND_KEY") || Deno.env.get("RESEND_API_KEY"),
    ),
  });
});
