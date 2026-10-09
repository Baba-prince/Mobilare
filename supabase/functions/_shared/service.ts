import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/** Resolve service role across naming variants used by CRM + core functions. */
export function serviceRoleKey(): string {
  const key =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SERVICE_KEY") ||
    Deno.env.get("SERVICE_ROLE_KEY");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return key;
}

export function supabaseUrl(): string {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new Error("Missing SUPABASE_URL");
  return url;
}

export function adminClient(): SupabaseClient {
  return createClient(supabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
