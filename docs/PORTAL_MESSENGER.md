# Portal messenger (Users · Drivers · CRM)

Replicates RoadAngel Tri-Chat UX (`MessengerApp` × three faces) with **Supabase** transport — not `localStorage`.

## Entrances

| Face | Portal | Messages |
|------|--------|----------|
| Customer | `/account` | `/account/messages` (support → CRM) |
| Driver | `/driver` | `/driver/messages` (driver desk → CRM) |
| CRM Admin | `/admin` + `/admin-crm` | `/admin/messages` |
| Hub | `/portal` | Role doors after sign-in |

Sign-in routes to `/portal` (same idea as `roadagel.com/portal`).

## Schema

Migration: `supabase/migrations/004_portal_messenger.sql`

- Extends `conversations` / `messages` / `conversation_participants`
- RPCs: `open_support_thread`, `open_driver_thread`, `send_portal_message`, `mark_conversation_read`
- RLS: customer/driver own threads; admins (`admin_users` or `profiles.role = admin`) see all
- Realtime publication on `messages` + `conversations`

## RoadAngel vs Mobilare

| Piece | RoadAngel | Mobilare |
|-------|-----------|----------|
| UI | Shared `MessengerApp` | Same pattern (Next.js) |
| Transport | `localStorage` | Postgres + Realtime |
| Customer support | Notes / WhatsApp | In-app support threads |
| Portal | `/portal` dual doors | `/portal` three doors |

## Apply

```bash
cd Mobilare
supabase db push --linked
# or: psql "$SUPABASE_DB_URL" -f supabase/migrations/004_portal_messenger.sql
```
