# Unblock deploy (required to leave 33%)

Two access blockers were hit from this machine:

1. **Supabase CLI account** can see other projects (Vexo, Arole-Adjo, …) but **cannot deploy** to `tkatskfyaxzlrgaktrtn` (403 privileges).
2. **Database password** in the connection string failed (`password authentication failed`).

API keys (anon + service_role) **do work** against the project. Schema is missing (`public.quotes` 404).

## Option A — Paste SQL (fastest for Phase 1)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/tkatskfyaxzlrgaktrtn/sql/new) while logged into the account that owns Mobilare.
2. Paste the full contents of `supabase/migrations/001_init.sql`.
3. Run. Confirm tables: `customers`, `quotes`, `bookings`, `payments`, `jobs`, `proof_of_delivery`.

## Option B — Fix CLI access (needed for Edge Function deploy)

1. Log into the **same Supabase account that owns** project `tkatskfyaxzlrgaktrtn`.
2. Create an access token: https://supabase.com/dashboard/account/tokens  
3. On this machine:

```bash
supabase login
cd ~/Mobilare
supabase link --project-ref tkatskfyaxzlrgaktrtn
./scripts/deploy.sh
```

Or invite the currently logged-in CLI user as **Owner** on that project.

## Option C — Correct DB password

Reset DB password in Project Settings → Database, put it in `.env` as `SUPABASE_DB_URL`, then:

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

## After schema + deploy

```bash
# set secrets
supabase secrets set --project-ref tkatskfyaxzlrgaktrtn \
  STRIPE_SECRET_KEY=sk_test_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  SUCCESS_URL=https://mobilare.co.uk/booking-success \
  CANCEL_URL=https://mobilare.co.uk/booking-cancel \
  CORS_ORIGIN=https://mobilare.co.uk,https://www.mobilare.co.uk,http://127.0.0.1:8765

# smoke quote
curl -s https://tkatskfyaxzlrgaktrtn.supabase.co/functions/v1/quote \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"service_type":"courier","pickup_postcode":"EC1A1BB","dropoff_postcode":"SW1A1AA"}'
```

Then open the local booking UI: http://127.0.0.1:8765/book/
