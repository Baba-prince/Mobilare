
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_KEY')!)
  const { data: queued } = await supabase.from('outbound_messages').select('*').eq('status','queued').lt('attempts',3).limit(20)

  for (const msg of queued || []) {
    try {
      if (msg.channel === 'sms' || msg.channel === 'whatsapp') {
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`, {
          method: 'POST',
          headers: { Authorization: 'Basic ' + btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`) },
          body: new URLSearchParams({ To: msg.payload.to, From: msg.channel==='whatsapp' ? 'whatsapp:'+Deno.env.get('TWILIO_FROM') : Deno.env.get('TWILIO_FROM')!, Body: msg.payload.body })
        })
      }
      if (msg.channel === 'email') {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${Deno.env.get('RESEND_KEY')}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ from: 'Mobilare <noreply@mobilare.co.uk>', to: msg.payload.to, subject: msg.payload.subject, html: msg.payload.html })
        })
      }
      await supabase.from('outbound_messages').update({ status:'sent' }).eq('id', msg.id)
    } catch(e) {
      await supabase.from('outbound_messages').update({ status:'queued', attempts: msg.attempts+1 }).eq('id', msg.id)
    }
  }
  return new Response('processed')
})
