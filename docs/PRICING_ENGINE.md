# Mobilare Competitive Pricing Engine (Apr 2026)

Source: Anyvan (~97k moves), Britannia / Pickfords, Man & Van + courier market.

## Competitor benchmark — removals

| Property | Anyvan Avg (No Pack) | Anyvan Premium (With Pack) | Britannia / Pickfords | Man & Van Hourly |
|----------|----------------------|----------------------------|-----------------------|------------------|
| 1 Bed / Studio | £483 | £849 | £700–£1,100 | £40–£90/hr |
| 2 Bed | £555 | £968 | £900–£1,400 | £90/hr 2 men + LWB |
| 3 Bed | £688 | £1,184 | £1,200–£1,800 | £100/hr 2 men + Luton |
| 4 Bed | £938 | £1,577 | £1,500–£2,500 | £110/hr + stairs |

## Competitor benchmark — courier

| Item | Rate |
|------|------|
| Same-day base | £49.99 |
| Small van | 50p / mile |
| Luton | £1.20 / mile |
| Long distance | + £1 / mile |

## Mobilare live rates (VAT inclusive)

**Courier / specialty** = £49.99 base (+ specialty) + vehicle mileage + long-distance extra on national band.

| Service | Extra on base | Default vehicle |
|---------|---------------|-----------------|
| Courier | £0 | Small van |
| Legal | +£10 | Small van |
| Estate | +£15 | Small van |
| Medical | +£25 | Small van |
| Warehouse | £99.99 base | Luton |

**Estimated miles (until Distance Matrix):** local 8 · regional 35 · national 90.

**Removals (no pack)** — ~3% under Anyvan avg:

| Property | Mobilare |
|----------|----------|
| Studio / 1 bed | £469 |
| 2 bed | £539 |
| 3 bed | £669 |
| 4 bed | £909 |

Distance multipliers on removals: local ×1 · regional ×1.12 · national ×1.25.  
With-pack uses Anyvan premium uplift ratios.

Implemented in `supabase/functions/_shared/pricing.ts`.
