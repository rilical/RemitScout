# Plane A Route Validation Audit

This file is generated.
Regenerate with:

```bash
pnpm -C backend tsx scripts/ci/generate-route-validation-audit.ts
```

Last generated: 2026-03-07T20:48:25.372Z

## Summary
- Total route files scanned: 70
- Likely missing schema (uses request.* but no Zod detected): 11

## Likely Missing Schemas (Review P0)
- [ ] `routes/alerts/alerts-notifications.ts`
- [ ] `routes/alerts/alerts-smart.ts`
- [ ] `routes/billing/webhook.ts`
- [ ] `routes/data-export.ts`
- [ ] `routes/exports.ts`
- [ ] `routes/ops/indices-health.ts`
- [ ] `routes/ops/platform.ts`
- [ ] `routes/providers/providers-corridor.ts`
- [ ] `routes/providers/providers-detail.ts`
- [ ] `routes/providers/providers-pulse.ts`
- [ ] `routes/pulse-teaser.ts`

## Inventory
| Route File | Zod | body | query | params | Likely Missing |
|---|---:|---:|---:|---:|---:|
| `routes/account.ts` | ✅ | ✅ | ✅ | — | — |
| `routes/admin-discovery.ts` | ✅ | — | ✅ | ✅ | — |
| `routes/admin-feature-flags.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/admin-institutional.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/admin-newsletter.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/admin.ts` | ✅ | ✅ | ✅ | — | — |
| `routes/ads.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/alerts.ts` | — | — | — | — | — |
| `routes/alerts/alerts-crud.ts` | ✅ | ✅ | — | ✅ | — |
| `routes/alerts/alerts-evaluation.ts` | — | — | — | — | — |
| `routes/alerts/alerts-notifications.ts` | — | — | ✅ | — | ⚠️ |
| `routes/alerts/alerts-smart.ts` | — | — | ✅ | — | ⚠️ |
| `routes/alerts/index.ts` | — | — | — | — | — |
| `routes/alerts/shared.ts` | ✅ | — | — | — | — |
| `routes/analytics.ts` | ✅ | — | ✅ | — | — |
| `routes/audit.ts` | ✅ | — | ✅ | ✅ | — |
| `routes/auth.ts` | ✅ | ✅ | — | — | — |
| `routes/bank-vs-specialist.ts` | ✅ | — | ✅ | — | — |
| `routes/billing/checkout-session.ts` | ✅ | ✅ | — | — | — |
| `routes/billing/history.ts` | — | — | — | — | — |
| `routes/billing/portal.ts` | — | — | — | — | — |
| `routes/billing/pricing.ts` | — | — | — | — | — |
| `routes/billing/verify-session.ts` | ✅ | ✅ | — | — | — |
| `routes/billing/webhook.ts` | — | ✅ | — | — | ⚠️ |
| `routes/compliance.ts` | — | — | — | — | — |
| `routes/contact.ts` | ✅ | ✅ | — | — | — |
| `routes/corridor-coverage.ts` | ✅ | — | ✅ | ✅ | — |
| `routes/corridor-currencies.ts` | ✅ | — | ✅ | — | — |
| `routes/corridor-limits.ts` | ✅ | — | ✅ | — | — |
| `routes/data-export.ts` | — | — | — | ✅ | ⚠️ |
| `routes/exports-limit.ts` | — | — | — | — | — |
| `routes/exports.schema.ts` | ✅ | — | — | — | — |
| `routes/exports.service.ts` | — | — | — | — | — |
| `routes/exports.ts` | — | ✅ | ✅ | ✅ | ⚠️ |
| `routes/geo.ts` | — | — | — | — | — |
| `routes/history.ts` | ✅ | ✅ | ✅ | — | — |
| `routes/index-corrections.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/indices.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/marketing.ts` | ✅ | ✅ | — | — | — |
| `routes/me.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/newsletter.ts` | ✅ | ✅ | ✅ | — | — |
| `routes/notifications.ts` | ✅ | ✅ | — | — | — |
| `routes/ops/alert-evaluation-admin.ts` | ✅ | ✅ | — | — | — |
| `routes/ops/api-keys-admin.ts` | ✅ | — | ✅ | — | — |
| `routes/ops/b2b-sweep-status.ts` | — | — | — | — | — |
| `routes/ops/db-admin.ts` | ✅ | ✅ | — | — | — |
| `routes/ops/gold-exports.ts` | ✅ | — | ✅ | — | — |
| `routes/ops/indices-health.ts` | — | — | ✅ | — | ⚠️ |
| `routes/ops/observer-summary.ts` | ✅ | — | ✅ | — | — |
| `routes/ops/platform.ts` | — | ✅ | ✅ | ✅ | ⚠️ |
| `routes/ops/provider-health.ts` | ✅ | — | ✅ | — | — |
| `routes/ops/providers-explain.ts` | ✅ | — | ✅ | — | — |
| `routes/popular-corridors.ts` | — | — | — | — | — |
| `routes/provider-metadata.ts` | ✅ | — | — | ✅ | — |
| `routes/provider-visits.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/providers/index.ts` | — | — | — | — | — |
| `routes/providers/providers-corridor.ts` | — | — | — | ✅ | ⚠️ |
| `routes/providers/providers-detail.ts` | — | — | — | ✅ | ⚠️ |
| `routes/providers/providers-list.ts` | ✅ | — | ✅ | — | — |
| `routes/providers/providers-pulse.ts` | — | — | ✅ | ✅ | ⚠️ |
| `routes/pulse-status.ts` | — | — | — | — | — |
| `routes/pulse-teaser.ts` | — | — | ✅ | — | ⚠️ |
| `routes/pulse.ts` | ✅ | ✅ | ✅ | ✅ | — |
| `routes/quotes.ts` | ✅ | — | ✅ | — | — |
| `routes/rates.ts` | ✅ | — | ✅ | ✅ | — |
| `routes/recent-searches.ts` | ✅ | ✅ | ✅ | — | — |
| `routes/sessions.ts` | ✅ | ✅ | — | ✅ | — |
| `routes/telemetry.ts` | ✅ | ✅ | ✅ | — | — |
| `routes/usage.ts` | ✅ | — | ✅ | — | — |
| `routes/watchlist.ts` | ✅ | ✅ | — | ✅ | — |

