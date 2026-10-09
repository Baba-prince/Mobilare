import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { adminClient } from "../_shared/service.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const rows = Array.isArray(body.customers) ? body.customers : [];
    if (!rows.length) {
      return jsonResponse(req, { error: "customers[] required" }, 400);
    }

    const supabase = adminClient();
    const payload = rows.map((r: Record<string, unknown>) => ({
      name: String(r.name || "Unknown"),
      email: String(r.email || ""),
      phone: r.phone ? String(r.phone) : null,
      company: r.company ? String(r.company) : null,
      company_name: r.company_name || r.company
        ? String(r.company_name || r.company)
        : null,
      tags: Array.isArray(r.tags) ? r.tags : [],
    }));

    const { data, error } = await supabase.from("customers").insert(payload)
      .select("id");
    if (error) throw error;

    return jsonResponse(req, { imported: data?.length ?? 0, ids: data });
  } catch (e) {
    return jsonResponse(req, { error: (e as Error).message }, 500);
  }
});
