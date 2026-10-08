# Test flow output — competitive pricing

Engine: `competitive_apr2026`

| Case | Quote | Band | Miles | ETA |
|------|-------|------|-------|-----|
| Courier EC→SW small van (local) | £53.99 | local | 8 | 90 min |
| Courier EC→M1 small van (national) | £184.99 | national | 90 | 360 min |
| Courier EC→SW Luton | £59.59 | local | 8 | 90 min |
| Medical EC→SW | £78.99 | local | 8 | 75 min |
| Legal EC→SW | £63.99 | local | 8 | 75 min |
| Estate EC→SW | £68.99 | local | 8 | 90 min |
| Warehouse EC→SW Luton | £109.59 | local | 8 | 210 min |
| Removals 1bed | £469.00 | local | 8 | 210 min |
| Removals 2bed | £539.00 | local | 8 | 210 min |
| Removals 3bed | £669.00 | local | 8 | 210 min |
| Removals 4bed | £909.00 | local | 8 | 210 min |
| Removals 1bed + pack | £824.39 | local | 8 | 210 min |
| Removals 3bed national | £836.25 | national | 90 | 480 min |

## Expected vs market

- Courier local small van ≈ £49.99 + 50p×8mi = **£53.99**
- Courier national ≈ £49.99 + (50p+£1)×90mi = **£184.99**
- Removals 1–4 bed (no pack) = **£469 / £539 / £669 / £909** (~3% under Anyvan avg)
