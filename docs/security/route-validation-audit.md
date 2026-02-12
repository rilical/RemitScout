# Plane A Route Validation Audit

This file is generated.
Regenerate with:

```bash
pnpm -C backend tsx scripts/ci/generate-route-validation-audit.ts
```

Last generated: 2026-02-12T17:05:16.225Z

## Summary
- Total route files scanned: 68
- Likely missing schema (uses request.* but no Zod detected): 4

## Likely Missing Schemas (Review P0)
- [ ] `routes/billing/webhook.ts`
- [ ] `routes/data-export.ts`
- [ ] `routes/pulse-teaser.ts`
- [ ] `routes/pulse.ts`

## Inventory
| Route File | Zod | body | query | params | Likely Missing |
|---|---:|---:|---:|---:|---:|
| `routes/account.ts` | ✅ | ✅ | — | — | — |
| `routes/admin.ts` | ✅ | ✅ | ✅ | — | — |
| `routes/ads.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/alerts.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/analytics.ts` | ✅ | — | ✅ | — | — |
| `routes/audit.ts` | ✅ | — | ✅ | ✅ | — |
| `routes/bank-vs-specialist.ts` | ✅ | — | ✅ | — | — |
| `routes/billing/checkout-session.ts` | ✅ | ✅ | — | — | — |
| `routes/billing/history.ts` | — | — | — | — | — |
| `routes/billing/portal.ts` | — | — | — | — | — |
| `routes/billing/pricing.ts` | — | — | — | — | — |
| `routes/billing/verify-session.ts` | ✅ | ✅ | — | — | — |
| `routes/billing/webhook.ts` | — | ✅ | — | — | ⚠️ |
| `routes/contact.ts` | ✅ | ✅ | — | — | — |
| `routes/corridor-currencies.ts` | ✅ | — | ✅ | — | — |
| `routes/corridor-limits.ts` | ✅ | — | ✅ | — | — |
| `routes/data-export.ts` | — | — | — | ✅ | ⚠️ |
| `routes/exports.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/geo.ts` | — | — | — | — | — |
| `routes/history.ts` | ✅ | ✅ | ✅ | — | — |
| `routes/indices.ts` | ✅ | — | ✅ | — | — |
| `routes/marketing.ts` | ✅ | ✅ | — | — | — |
| `routes/me.ts` | ✅ | ✅ | — | ✅ | — |
| `routes/newsletter.ts` | ✅ | ✅ | ✅ | — | — |
| `routes/notifications.ts` | ✅ | ✅ | — | — | — |
| `routes/ops/alansari-health.ts` | — | — | — | — | — |
| `routes/ops/alert-evaluation-admin.ts` | ✅ | ✅ | — | — | — |
| `routes/ops/b2b-sweep-status.ts` | — | — | — | — | — |
| `routes/ops/bossmoney-health.ts` | — | — | — | — | — |
| `routes/ops/dahabshiil-health.ts` | — | — | — | — | — |
| `routes/ops/db-admin.ts` | — | — | — | — | — |
| `routes/ops/indices-health.ts` | — | — | — | — | — |
| `routes/ops/instarem-health.ts` | — | — | — | — | — |
| `routes/ops/intermex-health.ts` | — | — | — | — | — |
| `routes/ops/koronapay-health.ts` | — | — | — | — | — |
| `routes/ops/mukuru-health.ts` | — | — | — | — | — |
| `routes/ops/observer-summary.ts` | ✅ | — | ✅ | — | — |
| `routes/ops/orbitremit-health.ts` | — | — | — | — | — |
| `routes/ops/pangea-health.ts` | — | — | — | — | — |
| `routes/ops/paysend-health.ts` | — | — | — | — | — |
| `routes/ops/placid-health.ts` | — | — | — | — | — |
| `routes/ops/provider-health.ts` | — | — | — | — | — |
| `routes/ops/remitbee-health.ts` | — | — | — | — | — |
| `routes/ops/remitly-health.ts` | — | — | — | — | — |
| `routes/ops/ria-health.ts` | — | — | — | — | — |
| `routes/ops/sendwave-health.ts` | — | — | — | — | — |
| `routes/ops/singx-health.ts` | — | — | — | — | — |
| `routes/ops/transfergo-health.ts` | — | — | — | — | — |
| `routes/ops/wellsfargo-health.ts` | — | — | — | — | — |
| `routes/ops/westernunion-health.ts` | — | — | — | — | — |
| `routes/ops/wirebarley-health.ts` | — | — | — | — | — |
| `routes/ops/wise-health.ts` | — | — | — | — | — |
| `routes/ops/worldremit-health.ts` | — | — | — | — | — |
| `routes/ops/xe-health.ts` | — | — | — | — | — |
| `routes/ops/xoom-health.ts` | — | — | — | — | — |
| `routes/popular-corridors.ts` | — | — | — | — | — |
| `routes/provider-metadata.ts` | ✅ | — | — | ✅ | — |
| `routes/provider-visits.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/providers.ts` | ✅ | — | ✅ | — | — |
| `routes/pulse-status.ts` | — | — | — | — | — |
| `routes/pulse-teaser.ts` | — | — | ✅ | — | ⚠️ |
| `routes/pulse.ts` | — | — | ✅ | ✅ | ⚠️ |
| `routes/quotes.ts` | ✅ | — | ✅ | — | — |
| `routes/rates.ts` | ✅ | — | ✅ | ✅ | — |
| `routes/recent-searches.ts` | ✅ | ✅ | ✅ | — | — |
| `routes/sessions.ts` | ✅ | ✅ | — | ✅ | — |
| `routes/telemetry.ts` | ✅ | ✅ | ✅ | — | — |
| `routes/watchlist.ts` | ✅ | ✅ | — | ✅ | — |

