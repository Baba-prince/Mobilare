# Mobilare UI investigation — gap analysis

**Investigated:** 2026-10-08  
**Live host:** https://mobilare.co.uk  
**Stated target UI:** Squarespace  
**Actual live stack:** Next.js App Router on **Vercel** (not Squarespace)

---

## What the live UI is today

| Route | Status | Role |
|-------|--------|------|
| `/` | 200 | Main marketing landing |
| `/landing` | 200 | Premium variant + postcode form |
| `/premium` | 200 | Premium marketing (no form) |
| `/book`, `/quote`, `/track`, `/checkout`, `/booking-success` | **404** | Missing |
| `/api/quote`, `/api/checkout` | **404** | Missing |

**Contact channels on site**

- `tel:07984884644`
- `mailto:bookings@mobilare.co.uk` (home)
- `mailto:customercare@mobilare.co.uk` (landing/premium)

**Hero “Book now” form (home + landing)**

- Single field: postcode
- Submit handler (client JS): `preventDefault` → redirect to `/#contact?postcode=…`
- **No API call, no quote, no Stripe, no Supabase**

**Promised in copy but not wired**

- Instant quote / coverage check
- Book in seconds / fixed rate
- Real-time tracking + proof of delivery (demo UI only — static “Live Job #3847”)
- “No card required” for quote step (OK for quote; pay-in-full still required at booking)

---

## Platform mismatch (critical)

| Claim | Reality | Gap |
|-------|---------|-----|
| UI hosted by Squarespace | Live site is Vercel/Next.js | Embeds for Squarespace won’t appear on current domain until Squarespace hosts (or DNS points there) |
| Full booking UI | Marketing site + stub form | Need quote → details → pay → success pages/blocks |
| Stripe set up | No Stripe client/keys in frontend | Backend + Checkout redirect required |
| Backend | Empty GitHub repo; no public API | Supabase Edge Functions + schema |

**Closure strategy (dual-ready):**

1. Build **API + Squarespace Code Block pack** as source of truth for booking UI (per product ask).
2. Keep CORS + redirects on `https://mobilare.co.uk` / `https://www.mobilare.co.uk`.
3. If DNS stays on Vercel Next.js, either:
   - **A)** Point domain to Squarespace and paste embeds, or  
   - **B)** Replace stub form in the Next.js app to call the same Edge Functions (same API contract).

v1 delivery assumes **A** (Squarespace embeds). API remains host-agnostic so **B** is a thin client swap later.

---

## Service catalogue (bookable v1 — all six)

| `service_type` | Site label |
|----------------|------------|
| `courier` | Same-Day Courier |
| `medical` | Medical Delivery |
| `legal` | Legal Documents |
| `warehouse` | Warehouse Transfers |
| `removals` | Removals & Bulk |
| `estate` | Estate Deliveries |

---

## Locked product decisions

1. Payment: **pay in full** at booking  
2. Pricing: **VAT-inclusive** GBP  
3. Services: **all six**  
4. CORS / redirects: **mobilare.co.uk** (+ www)  
5. Admin v1: **Supabase dashboard only**

---

## UI → API field map (to close the stub)

| UI step (promised) | API | Squarespace block |
|--------------------|-----|-------------------|
| Coverage / postcode | `POST /quote` | Step 1 of booking form |
| Real quote (price + ETA) | response of `/quote` | Price panel |
| Book details | `POST /checkout` body | Step 2 fields |
| Pay | Stripe Checkout URL | Redirect |
| Success | static page + email later | `/booking-success` |
| Track | `GET /track?ref=` | Track widget |
| Live job / POD | `jobs` + `proof_of_delivery` | Track widget (read) |

---

## Gap closure checklist

- [ ] Replace stub postcode submit with multi-step quote/book embed  
- [ ] Create Squarespace pages: Book, Success, Cancel, Track (or sections)  
- [ ] Deploy Edge Functions + set secrets  
- [ ] Stripe webhook live endpoint  
- [ ] Confirm DNS: Squarespace vs Vercel before production cutover  
- [ ] Rotate leaked credentials  
- [ ] Publishable Stripe key (`pk_test_…`) stored in env (secret only was provided)  
- [ ] Success/cancel URLs exist on the live host  

See also: `docs/PHASE_PLAN.md`, open `artifacts/phase-monitor.html`.
