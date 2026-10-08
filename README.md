# Mobilare backend

Squarespace (target) booking UI → Supabase Edge Functions → Stripe Checkout → webhook → Postgres.

## Open the phase monitor

```bash
cd Mobilare
python3 -m http.server 8765
# then open http://127.0.0.1:8765/artifacts/phase-monitor.html
```

Or open `artifacts/phase-monitor.html` directly (embedded readiness snapshot).

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/PHASE_PLAN.md`](docs/PHASE_PLAN.md) | Locked phase plan |
| [`docs/UI_GAP_ANALYSIS.md`](docs/UI_GAP_ANALYSIS.md) | Live UI investigation + gaps |
| [`artifacts/phase-monitor.html`](artifacts/phase-monitor.html) | Readiness web artifact |
| [`squarespace/INSTALL.md`](squarespace/INSTALL.md) | Embed install steps |

## Locked decisions

- Pay in full · VAT inclusive · GBP  
- All 6 services bookable  
- CORS: mobilare.co.uk (+ www)  
- Admin v1: Supabase dashboard  

## Setup

```bash
cp .env.example .env
# fill secrets locally — never commit .env
# rotate any keys that were pasted into chat
```

Apply DB + deploy (requires [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## API

| Function | Method | Path |
|----------|--------|------|
| quote | POST | `/functions/v1/quote` |
| checkout | POST | `/functions/v1/checkout` |
| webhook | POST | `/functions/v1/webhook` (Stripe signature) |
| track | GET | `/functions/v1/track?ref=MB-…` |

## Critical gap

Live site is **Vercel/Next.js**, not Squarespace. Hero “Book now” only jumps to `#contact?postcode=`.  
Use `squarespace/` embeds after DNS/hosting is decided, or call the same API from the Next.js form.

## Security

Do not commit Stripe secret keys, Supabase **service_role**, or DB passwords. Anon key may appear in Squarespace embeds (browser-safe) once RLS is on.

## Live backend (staging)

- Supabase project: `opvpkxvbvhltchxwlinr` (eu-west-2)
- Dashboard: https://supabase.com/dashboard/project/opvpkxvbvhltchxwlinr
- Local book UI: http://127.0.0.1:8765/book/
- Phase monitor: http://127.0.0.1:8765/artifacts/phase-monitor.html

> Original project ref `tkatskfyaxzlrgaktrtn` was not accessible to this CLI account (403). A new Mobilare project was created under the logged-in org so deploy could proceed.

## Frontend (Next.js)

App lives in [`web/`](web/) — marketing pages, customer/driver auth wizard, portals, and admin dashboard.

```bash
cd web && npm run dev
```

Deploy: set Vercel root directory to `web`.

