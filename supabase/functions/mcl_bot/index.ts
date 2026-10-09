
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { conversation_id, message_body, channel } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_KEY')!)

  // 1. Get conversation
  const { data: convo } = await supabase.from('conversations').select('*, customers(*)').eq('id', conversation_id).single()

  // 2. AI intent detection (simplified - plug OpenAI here)
  const lower = message_body.toLowerCase()
  let intent = 'general'
  if (lower.includes('quote') || lower.includes('how much') || lower.includes('price')) intent = 'quote_request'
  if (lower.includes('where is') || lower.includes('eta') || lower.includes('driver')) intent = 'tracking'
  if (lower.match(/bn\d|sw\d|ec\d/)) intent = 'new_shipment'

  // 3. Auto-create shipment if intent = new_shipment
  if (intent === 'new_shipment' && convo?.customer_id) {
    const { data: shipment } = await supabase.from('shipments').insert({
      customer_id: convo.customer_id,
      status: 'raw',
      pickup_postcode: 'BN1',
      dropoff_postcode: 'SW11',
      service_type: 'next_day',
      price: 149
    }).select().single()

    await supabase.from('messages').insert({
      conversation_id,
      sender_type: 'bot',
      body: `Got it! I created shipment ${shipment.id.slice(0,8).toUpperCase()} BN1 → SW11. Our ops will confirm price £149 in 5 mins. Need anything else?`,
      ai_suggested: false
    })

    // Enqueue ops notification
    await supabase.from('outbound_messages').insert({
      customer_id: convo.customer_id,
      channel: 'internal',
      template_key: 'new_lead_from_bot',
      payload: { shipment_id: shipment.id }
    })
  }

  // 4. Generate AI suggested reply for admin
  const suggested = intent === 'tracking' 
    ? `Hi ${convo?.customers?.name || 'there'}, your driver is 8 mins away. Live track: https://mobilare.co.uk/track/${convo?.shipment_id || ''}`
    : `Thanks for reaching out! I can help with quotes, bookings, and tracking. What's your pickup and dropoff postcode?`

  await supabase.from('messages').insert({
    conversation_id,
    sender_type: 'bot',
    body: suggested,
    ai_suggested: true
  })

  return new Response(JSON.stringify({ intent, suggested }), { headers: { 'Content-Type': 'application/json' } })
})
