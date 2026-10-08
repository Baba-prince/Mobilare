# Mobilare Backend — Phase Plan (locked)

**Site:** https://mobilare.co.uk  
**Repo:** https://github.com/Baba-prince/Mobilare  
**Flow:** Squarespace form → Supabase Edge Functions → Stripe Checkout → webhook → Postgres  
**Monitor:** open `artifacts/phase-monitor.html`  
**UI gaps:** `docs/UI_GAP_ANALYSIS.md`

---

## Locked decisions

| # | Decision | Value |
|---|----------|--------|
| 1 | Payment | Pay in full at booking |
| 2 | VAT | Inclusive (GBP) |
| 3 | Services v1 | All six: courier, medical, legal, warehouse, removals, estate |
| 4 | CORS / redirects | `https://mobilare.co.uk`, `https://www.mobilare.co.uk` |
| 5 | Admin v1 | Supabase dashboard only |

---

## Architecture

```
Squarespace (or dual-ready embed)
    → POST /functions/v1/quote
    → POST /functions/v1/checkout  → Stripe Checkout
    → POST /functions/v1/webhook   → payments + bookings + jobs
    → GET  /functions/v1/track
```

---

## Phases

### Phase 0 — Security & workspace
- Work folder, gitignore, `.env.example`
- **Rotate** any keys pasted in chat
- Add `pk_test_…` (publishable) — only `sk_test_…` was supplied

### Phase 1 — Database
Tables: `customers`, `quotes`, `bookings`, `payments`, `jobs`, `proof_of_delivery`  
RLS: deny public writes; service role via Edge Functions

### Phase 2 — Quote API
`POST /quote` — coverage + VAT-inclusive price for all 6 services

### Phase 3 — Checkout + Stripe webhook
`POST /checkout` — full payment Checkout Session  
`POST /webhook` — `checkout.session.completed` → paid + job created

### Phase 4 — Track API
`GET /track` — public status by booking ref

### Phase 5 — Ops / notifications
Email confirmation (later); dashboard = Supabase tables

### Phase 6 — Squarespace pack
Multi-step booking embed + track widget + INSTALL.md  
Closes live stub (`/#contact?postcode=`)

### Phase 7 — Deploy & go-live
Deploy functions, webhook, test card, then live keys  
Resolve **Vercel vs Squarespace DNS** before cutover

---

## Production readiness gates

1. Secrets rotated and only in Supabase secrets / local `.env`
2. Migrations applied
3. All four functions deployed
4. Stripe test payment end-to-end
5. Squarespace (or Next.js) booking UI calling API
6. Success / cancel pages live on mobilare.co.uk
7. Webhook signature verified in test
8. CORS locked to Mobilare domains
9. DNS ownership confirmed (Squarespace vs Vercel)
10. Live Stripe keys only after UAT checklist green

---

## Build sequence status

Tracked live in `artifacts/phase-monitor.html` and `artifacts/readiness.json`.
