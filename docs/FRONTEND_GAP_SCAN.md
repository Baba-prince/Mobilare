# Frontend gap scan — Mobilare

**Scanned:** 2026-10-08  
**Surfaces:** https://mobilare.co.uk (Vercel/Next.js) · local staging `127.0.0.1:8765` · `squarespace/` embeds

---

## Critical (blocks real bookings on the public site)

| # | Gap | Evidence | Close with |
|---|-----|----------|------------|
| F1 | **No live booking journey on mobilare.co.uk** | `/book`, `/track`, `/booking-success`, `/booking-cancel` all **404** | Add these routes on Squarespace **or** Next.js and point CTAs there |
| F2 | **Hero “Book now” is a stub** | JS: `preventDefault` → `/#contact?postcode=…` — **no `fetch`**, no Stripe, no Supabase | Wire submit to quote API or redirect to `/book?postcode=` |
| F3 | **Landing form is the same stub** | Same `/#contact?postcode=` behaviour on `/landing` | Same fix as F2 |
| F4 | **Copy promises “Instant quote” / fixed price; UI shows £0 prices** | Marketing claims quote in 90s; HTML has **no £ amounts**, no quote result panel | Surface competitive engine prices in UI after quote |
| F5 | **Stripe success/cancel URLs are localhost** | Edge secrets / `.env` → `127.0.0.1:8765/...` | Switch to `https://mobilare.co.uk/booking-success` (+ cancel) before public traffic |
| F6 | **DNS / host mismatch** | Product ask = Squarespace; live = **Vercel Next.js** | Decide host of truth, then ship embeds or Next client |

---

## High (broken or misleading UX)

| # | Gap | Detail |
|---|-----|--------|
| F7 | `#contact` does not complete a book | Contact is mailto/tel; postcode query is not turned into a quote |
| F8 | `/premium` has **no booking form** | Dead-end for “Book” intent from premium funnel |
| F9 | Demo “Live Job #3847” looks real | Static POD/tracking theatre — not tied to `/track` API |
| F10 | No public pricing page | `/pricing` 404 — competitors show ranges; engine exists but unused on site |
| F11 | www vs apex | Confirm `www.mobilare.co.uk` health + redirects (historically flaky) |

---

## Medium (local / Squarespace pack gaps)

| # | Gap | Detail |
|---|-----|--------|
| F12 | Booking UI not a real `<form>` | Enter key may not submit; weaker a11y |
| F13 | Missing ARIA / focus management | Screen-reader & error announcements weak |
| F14 | Track page iframe + `contentDocument` | Prefill-by-ref can fail depending on browser; prefer query param inside widget |
| F15 | No client-side field validation | Empty name/email can hit API before Stripe |
| F16 | Quote breakdown not shown | API returns `breakdown`; UI only shows total |
| F17 | No loading / retry UX beyond button disable | Network fail messaging is minimal |
| F18 | TODO comment still in embed | Cosmetics / clarity for installers |

---

## Low / polish

| # | Gap |
|---|-----|
| F19 | No saved draft quote in `localStorage` if user leaves checkout |
| F20 | No “call us” fallback CTA on uncovered postcode in embed (API returns message only) |
| F21 | Service icons/copy on home not linked to preselected `service_type` on `/book` |
| F22 | Empty `src/` folders in repo — unused scaffolding |

---

## What *is* ready (not gaps)

- Competitive pricing engine live on Supabase `quote`
- Local book → checkout → Stripe test path
- Track + success/cancel pages on **local** staging
- Squarespace embeds with anon key + property/vehicle fields

---

## Recommended close order

1. **F2/F3** — Change Next.js form redirect from `/#contact?postcode=` → `/book?postcode=` (once `/book` exists) **or** call `POST /functions/v1/quote` in-page.  
2. **F1/F5** — Ship `/book`, `/track`, success/cancel on the **public domain**; update Stripe URLs.  
3. **F4/F10** — Show price after quote; optional `/pricing` table from engine.  
4. **F9** — Label demo as “Example” or bind to real track API.  
5. **F12–F17** — Harden local/Squarespace pack (form, a11y, validation, breakdown).

---

## Quick verify commands

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://mobilare.co.uk/book   # expect 200 when closed
open http://127.0.0.1:8765/book/   # staging — works today
```
