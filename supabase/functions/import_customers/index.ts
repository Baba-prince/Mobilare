
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
serve(async (req) => {
  const rows = await req.json() // from CSV parser
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_KEY')!)
  // staging validation omitted for brevity - use Zod in frontend then upsert
  for (const r of rows) {
    await supabase.from('customers').upsert({ name: r.name, phone: r.phone, email: r.email, tags: r.tags?.split(',') || [] }, { onConflict: 'phone' })
  }
  return new Response('imported')
})
