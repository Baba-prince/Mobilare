# Squarespace install (closes live UI gaps)

## Reality check

Live https://mobilare.co.uk is currently **Vercel/Next.js**. The hero “Book now” only redirects to `/#contact?postcode=…`.  
This pack is for **Squarespace Code Blocks**. If the domain stays on Vercel, either migrate DNS to Squarespace or wire the same API from the Next.js form.

## Pages to create on Squarespace

| Page slug | Purpose |
|-----------|---------|
| `/book` | Paste `booking-form.html` |
| `/track` | Paste `track-widget.html` |
| `/booking-success` | Thank-you + “save your booking ref” |
| `/booking-cancel` | Payment cancelled → link back to `/book` |

## Steps

1. Deploy Supabase functions (`quote`, `checkout`, `webhook`, `track`).
2. In both HTML files, set `ANON_KEY` to the Supabase **anon** key (safe for browser).
3. Squarespace → Pages → add Code Block → paste HTML.
4. Settings → CORS already configured for mobilare.co.uk on functions.
5. Stripe Dashboard → webhook → `https://tkatskfyaxzlrgaktrtn.supabase.co/functions/v1/webhook`.

## Bridging the current Next.js stub

Until Squarespace owns the domain, change the Next.js submit handler from:

`/#contact?postcode=…`

to:

`/book?postcode=…` (Squarespace) **or** call `POST /functions/v1/quote` directly from React.
