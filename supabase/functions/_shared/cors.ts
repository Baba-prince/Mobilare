const DEFAULT_ORIGINS = [
  "https://mobilare.co.uk",
  "https://www.mobilare.co.uk",
];

export function allowedOrigins(): string[] {
  const fromEnv = Deno.env.get("CORS_ORIGIN");
  if (!fromEnv) return DEFAULT_ORIGINS;
  return fromEnv.split(",").map((s) => s.trim()).filter(Boolean);
}

export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("Origin") ?? "";
  const allow = allowedOrigins().includes(origin) ? origin : allowedOrigins()[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
    },
  });
}

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  return null;
}
