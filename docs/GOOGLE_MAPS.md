# Google Maps & live location (Mobilare)

## Stack (already beyond RoadAngel)

| API | Used for |
|-----|----------|
| Maps JavaScript API | Browser maps (`RouteMap`) |
| Geocoding API | Postcodes → lat/lng (edge) |
| Places API (New) | Address suggestions (`/addresses`) |
| Routes API | Driving polyline + ETA (`/track`, `/maps`) |
| Browser Geolocation | Driver `watchPosition` → `publish_driver_location` |

RoadAngel: Maps JS display + one-shot GPS only (no Routes/Places/Geocoding in product).

## Portal surfaces

| Role | Route | Function |
|------|-------|----------|
| Customer | `/account/bookings`, `/track` | Live track map: P/D + road polyline + driver pin (polled) |
| Driver | `/driver/location` | Share GPS → `driver_locations` + `jobs.last_lat/lng` |
| CRM | `/admin/map` | Dispatch map of live driver pins |
| Marketing | PostcodeFinder | Places + postcodes.io |

## Env

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Maps JS (browser, HTTP referrer restricted)
- `GOOGLE_MAPS_API_KEY` — Edge Geocoding / Places / Routes (IP restricted)

## Migrations

- `004_portal_messenger.sql` — messaging (prerequisite helpers)
- `005_driver_live_location.sql` — `driver_locations`, `publish_driver_location`, job GPS mirror

## Apply + redeploy track function

```bash
# when Supabase project is healthy:
psql "$SUPABASE_DB_URL" -f supabase/migrations/005_driver_live_location.sql
supabase functions deploy track --project-ref <ref>
```
