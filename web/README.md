# Mobilare web

Next.js App Router frontend matching the live Mobilare design (Inter + Outfit, teal `#0D6E7F`, ink gradients).

## Surfaces

**Marketing (12)**  
`/` · `/how-it-works` · `/see-how-it-works` · `/pricing` · `/coverage` · `/about` · `/blog` · `/careers` · `/help` · `/contact` · `/status` · `/drive`

**Booking**  
`/book` · `/track` · `/booking-success` · `/booking-cancel`

**Auth / onboarding**  
`/auth/sign-up` (customer | driver wizard) · `/auth/sign-in` · `/auth/sign-out` · `/onboarding/customer` · `/onboarding/driver`

**Portals**  
Customer `/account` · Driver `/driver` · Admin `/admin` (bookings, customers, drivers, billing, settings)

## Dev

```bash
cd web
cp .env.example .env.local   # add anon key
npm run dev
```

Point Vercel project root to `web/` for mobilare.co.uk.
