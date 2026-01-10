# Local Prototype Readiness Map (Massive)

Goal
- Build a fully working local prototype before AWS (SQS/Lambda) is enabled.
- Validate end-to-end business flows: signup/signin, free vs plus gating, watchlists, alerts, quotes, analytics, ops, and outbound tracking.
- Ensure data pipelines fill silver/gold locally with consistent freshness.

Ground Rules (Local Only)
- No AWS dependencies. Disable or bypass SQS/Lambda. Use local scripts and workers.
- Prefer deterministic runs and reproducible outputs.
- Capture failures with timestamps and corridor/provider details.

What We Just Added (Do Not Regress)
- Outbound transition flow: /go/:provider with telemetry + provider-visit tracking.
  - File: frontend/pages/go/[provider].vue
  - Layout: frontend/layouts/blank.vue
  - Shared URL builder: frontend/lib/outbound.ts
- CTAs rerouted through /go:
  - frontend/pages/send-money/[from]-to-[to].vue
  - frontend/components/home/FeaturedProvidersDynamic.vue
  - frontend/components/shared/ProviderCard.vue
- Ops partner hub metrics and revenue analytics:
  - frontend/pages/dashboard.vue
  - frontend/composables/useAnalytics.ts

System Map (Local)
1) Frontend (Nuxt)
   - Entry: frontend/app.vue
   - Home compare form, /send-money, /dashboard, /pulse, /admin
2) Plane A (API)
   - B2C quotes, providers, telemetry, ops health, analytics, auth, billing
3) Plane B (Ingestion)
   - Provider scraping, corridor capability probing, quote refresh worker
4) Plane C (Pulse)
   - Pulse charts + summary use cached gold data (no seeded defaults).
5) DB
   - bronze (raw), silver (normalized), gold (aggregates)
6) Cache
   - Redis (optional local), memory fallback

Local Boot Sequence (Reference)
- All services (frontend + planes): pnpm dev:all
- Backend only (planes only): pnpm dev:backend
- Frontend: pnpm -C frontend dev
- Plane A: pnpm -C backend dev:plane-a
- Plane B (continuous pipeline): pnpm -C backend dev:plane-b
- Plane B (single ingest pass): pnpm -C backend dev:plane-b:once
- Plane C: pnpm -C backend dev:plane-c
- Continuous local pipeline (direct):
  - pnpm -C backend dev:pipeline
- Data jobs as needed:
  - pnpm -C backend oanda:sync-rates:once
  - pnpm -C backend gold:fx-rates
  - pnpm -C backend gold:popular-corridors
  - pnpm -C backend gold:pulse-cache
  - pnpm -C backend telemetry:analytics
  - pnpm -C backend smart-alerts:refresh
  - pnpm -C backend b2c:refresh-worker

Checklist: Local Prototype Readiness

Checklist Status Summary (Code)
- Auth + Entitlements: code-ready.
- B2C Compare Flow: code-ready (corridor errors + currency capability + mid-market fallback in place).
- Provider Outbound Flow: code-ready (/go tracking + affiliate/outbound routing).
- Watchlists + Alerts: code-ready (local→server merge + alert remap on login).
- Ops + Analytics: code-ready (rate-limit bypass + analytics endpoints + telemetry job).
- Data Pipelines (Local): code-ready; requires local runs to populate data.
- Cache + Freshness: code-ready (freshness cutoff + cache fixes).
- Pulse Dashboard: code-ready (live data only; no defaults).
- Provider Parsing: code-ready (numeric normalization + capability gating).
- Content and UX: code-ready (ad slots + logos + route fixes).

1) Auth + Entitlements
- Sign up + sign in works without dev mock auth leaks.
- Plus entitlements gated correctly (alerts, history, export, ads).
- Stripe mock only in local; real Stripe disabled in prod.
- Admin gating works with local dev admin and blocks others.

2) B2C Compare Flow
- Home form validates from/to/amount/currencies.
- /send-money/[from]-to-[to] loads quotes or gives explicit corridor error.
- Unsupported corridors return "Unavailable corridor" not empty UI.
- Provider list displays real numbers (no string rates or null).
- Currency dropdown uses provider capability data for available currencies.
- Mid-market chart uses gold.fx_rates (OANDA); fallback only if explicitly allowed.

3) Provider Outbound Flow (New)
- Every provider CTA uses /go/:provider (no direct external links).
- Telemetry click events land in silver.telemetry_outbound_click.
- Provider visit prompts appear for signed-in users after click.

4) Watchlists + Alerts
- User can save corridor watchlist items.
- Alerts can target corridor or watchlist with correct currency pair.
- Smart alerts default only when user enters from alerts tab.
- Alert evaluation jobs run locally via scripts if needed.

5) Ops + Analytics
- Ops health endpoints work (plane-a /ops/*).
- Admin analytics pages load (no 429 or 500).
- Telemetry analytics job is scheduled locally or run on-demand.
- Ops partner hub shows affiliate status + click counts.

6) Data Pipelines (Local)
- Plane B ingestion writes silver.quote_record and silver.latest_quote_by_provider.
- Capability probe populates silver.provider_corridor_capability.
- Gold jobs populate gold.fx_rates, gold.pulse_cache, gold.popular_corridors.
- OANDA sync runs and produces 30d history for corridors in tiers.

7) Cache + Freshness
- Freshness cutoff applied to latest quotes (no stale rows returned).
- Redis optional; memory fallback works without crashes.
- Cache serialization consistent for Maps and JSON.

8) Pulse Dashboard
- Pulse defaults removed; live data only.
- Operational coverage charts use real series (no placeholders).
- Pulse chart exports and embed routes load without 500s.

9) Provider Parsing
- Parse functions normalize numeric fields (rate/fees).
- Parse errors are non-fatal, mark unsupported corridor when needed.
- No provider shows in unsupported corridors (capability gating).

10) Content and UX Gaps
- Ad placeholders removed or replaced by real ad slots.
- Provider logos exist for all visible providers.
- Broken routes removed or redirected (e.g., /institutions to /partnerships).

Known Local-Only Mocks (Keep Local, Remove for Prod)
- Stripe mock enabled by STRIPE_MOCK.
- Supabase mock enabled by SUPABASE_MOCK.

Issues Log (Fill As We Go)
- [x] AUTH-01: Dev auth bypass guarded for staging/prod; passwordless requires `PUBLIC_DEV_AUTH`.
- [x] B2C-01: Local pipeline refresh interval lowered; verify with a new corridor that refresh completes within 30s.
- [x] PIPE-01: Local pipeline depends on manual `dev:pipeline` for continuous jobs; added `scripts/dev/start-local.sh`.
- [x] DATA-01: Pulse defaults/synthetic charts removed; RateAlertForm now pulls real history.
- [x] OPS-01: Dev bypass for rate limiting added to prevent local 429s.
- [x] PULSE-01: Pulse tiles now rely on live gold cache; placeholders removed.
- [x] UI-01: Provider list now uses backend metadata (score-merged), reducing static-only routing.

Diagnostic Steps (Use for Each Issue)
1) Reproduce with corridor + amount + method + currency pair.
2) Capture API request + response (plane-a).
3) Check silver.latest_quote_by_provider for corridor freshness.
4) Check gold.fx_rates for currency pair history.
5) Verify provider capability table for corridor + currencies.
6) Inspect plane-b logs for parse or HTTP errors.
7) Update issue log with root cause + fix plan.

Local-Only Targets We Must Hit Before AWS
- Quote refresh runs within 30s for a new corridor.
- OANDA rates cover 30-day history for tiers.
- Alerts and ops analytics populate without manual intervention.
- Provider outbounds are tracked and visible in analytics.
- Dashboard is usable without mock data.

New Observations (Code Scan)
- Dev auth bypass now guarded by `PUBLIC_DEV_AUTH` and disabled in staging/prod.
- Entitlements default to free on any /me failure; Plus gating can silently drop (frontend/composables/useEntitlements.ts).
- Stripe client can run in mock mode; must be off outside local (backend/plane-a/src/services/stripe-client.ts, backend/shared/config.ts).
- Analytics require the telemetry aggregation job; otherwise admin dashboards look empty (backend/scripts/telemetry-analytics-job.ts).
- Local rate limiting bypass applied to avoid 429s during ops/audit testing.
- Cache fallback is memory-only; no cross-process invalidation in local (backend/shared/cache.ts).

Email + Notifications + Transfer Feedback (Current State)
- Alert emails use SES and only send when env is configured (backend/plane-a/src/services/alert-notifications.ts). SMS is stubbed (no phone numbers).
- Alert evaluation depends on the alert evaluation worker + queue/scheduler; local needs manual runs or a local scheduler (backend/scripts/alert-evaluation-worker.ts).
- Newsletter emails (confirmation/welcome) are SES-driven and gated by NEWSLETTER_EMAIL_* envs (backend/plane-a/src/services/newsletter-email.ts, backend/plane-a/src/routes/newsletter.ts).
- Contact form emails are SES-driven and non-blocking; status stored in silver.contact_submissions (backend/plane-a/src/routes/contact.ts).
- B2B notifications: only webhook delivery is implemented; email/SMS/push are TODO (backend/plane-b/src/notifications/dispatcher.ts).
- Dashboard notification settings UI is not wired to backend prefs yet (frontend/pages/dashboard.vue vs silver.notification_pref).
- Provider visit feedback exists (track + prompt + submit) and writes to silver.telemetry_provider_visit, but there is no email follow-up or analytics surfacing yet (backend/plane-a/src/routes/provider-visits.ts, frontend/components/provider/ProviderVisitPrompt.vue).

Additional Gaps to Wire
- ~~Privacy toggles (analytics/personalization) are UI-only; telemetry still records everything with no opt-out enforcement (frontend/pages/dashboard.vue, backend/plane-a/src/routes/telemetry.ts).~~
- ~~Plus success page claims a confirmation email was sent, but there is no explicit app-side confirmation email flow; relies on Stripe receipts only (frontend/pages/plus/success.vue, backend/plane-a/src/routes/billing/*).~~
- ~~Admin access is still static allow-list only; no admin role management UI or backend role assignment (backend/shared/config.ts, backend/plane-a/src/plugins/auth-plugin.ts).~~
- ~~Remove CAPTCHA step from local flows; avoid client-only checkbox UX with no server verification (frontend/pages/forgot-password.vue).~~
- ~~Push notifications are not implemented: need Web Push (service worker + subscription storage + delivery) and a mobile-ready path (store APNs/FCM device tokens + delivery channel), with unified notification preferences and opt-in tracking.~~
- ~~Ad inventory is static and local-only; OK to keep empty for now, but there is no server-driven placements, impressions tracking, or admin management (frontend/lib/ads.ts, frontend/components/ads/AdSlot.vue).~~
- ~~Amount validation uses fixed USD exchange rates for min/max; not tied to provider or corridor limits and can reject valid amounts (frontend/utils/currency-limits.ts, frontend/components/home/HeroDualTab.vue).~~
- ~~Export/GDPR flows depend on the export worker + S3 storage; local dev needs a fallback or explicit disable to avoid silent failures (backend/scripts/export-worker.ts, backend/plane-a/src/routes/data-export.ts).~~
- ~~Notification preferences are not persisted; dashboard toggles do not write to silver.notification_pref and there is no update endpoint (frontend/pages/dashboard.vue, backend/plane-a/src/services/alert-notifications.ts).~~
- ~~Affiliate conversion attribution is not implemented; only clicks/visits are tracked and useAffiliate is a stub (frontend/composables/useAffiliate.ts, backend/plane-a/src/routes/telemetry.ts).~~
- ~~Watchlist/alert sync mismatch: frontend creates local IDs for logged-in users, then POSTs without reconciling server IDs; alerts created from local watchlist IDs can 404 and local + server items can duplicate. Needs merge/sync on login and server IDs returned/used (frontend/composables/useWatchlist.ts, frontend/composables/useAlerts.ts, backend/plane-a/src/routes/watchlist.ts, backend/plane-a/src/routes/alerts.ts).~~ Implemented local→server merge on login with alert ID remapping.
- ~~Plan usage counters are never incremented; /me returns empty usage and limit-reached UI cannot be accurate without write paths (backend/plane-a/src/services/plan-usage.ts, backend/plane-a/src/repositories/implementations/plan-usage-repository.ts).~~
- ~~Corridor currency lists are force-adding USD/EUR/GBP regardless of capability data; this can surface unsupported currencies and wrong corridors (frontend/composables/useCorridorCurrencies.ts).~~
- ~~Stripe mock checkout/portal URLs point to missing pages; UI also claims a 14-day trial, but checkout session does not set a trial period (frontend/pages/plus/checkout.vue, backend/plane-a/src/services/stripe-mock.ts, backend/plane-a/src/routes/billing/checkout-session.ts).~~
- ~~Stripe mock checkout does not update user plan (no mock webhook or local plan update), so local checkout completes but Plus does not activate without SUPABASE_MOCK_PLAN (backend/plane-a/src/routes/billing/webhook.ts, backend/plane-a/src/routes/billing/verify-session.ts).~~
- ~~Checkout UI collects card data but never sends it (Stripe Checkout redirect only); replace with Stripe Elements or remove faux card fields to avoid compliance/UX mismatch (frontend/pages/plus/checkout.vue).~~
- ~~Avatar upload requires S3; no local fallback means profile avatar update fails when bucket is unset (backend/plane-a/src/services/avatar-upload.ts, backend/plane-a/src/routes/me.ts).~~ Removed feature; no local support needed.
- ~~Smart alerts need `silver.corridor_signals` populated; `smart-alerts-job` is not scheduled by default, so sendScore alerts never trigger (backend/scripts/smart-alerts-job.ts, backend/plane-a/src/services/alert-evaluator.ts).~~
- ~~Telemetry search tracking is only wired on `/send-money`; hero/header/sticky compare forms do not record searches, so analytics undercount (frontend/components/home/HeroDualTab.vue, frontend/components/nav/HeaderCompareForm.vue, frontend/components/home/StickyCompareBar.vue, frontend/pages/send-money/index.vue).~~
- ~~Provider scores are static constants (remitScore/scoreBreakdown) with no data-driven scoring pipeline (backend/plane-a/src/services/provider-metadata.ts).~~ Static by design.
- SEO + Growth fundamentals are now in place: GA4/Meta Pixel/CAPI, retargeting events, attribution capture, consent gating, backlink monitoring, and the SEO checklist.

Growth: SEO, Backlinks, Analytics, Retargeting (Fundamentals)
- ~~Technical SEO checklist enforced in CI or release runbook (canonical tags, hreflang, robots, sitemap, 404/redirects, noindex rules).~~
- ~~Sitemap coverage verified for all dynamic routes (corridors, providers, guides, pulse) and submitted to GSC.~~
- ~~Canonical + UTM stripping: ensure query params don’t create duplicate content on /send-money and /learn pages.~~
- ~~Core Web Vitals / perf budget (image preloading, JS split, LCP/CLS targets).~~
- ~~Backlink monitoring plan (GSC + external tool) + disavow workflow and monthly report.~~
- ~~GA4 event map aligned with telemetry (search, compare, quote refresh, outbound clicks, signup, plus conversion, alert creation).~~
- ~~Meta Pixel + Conversion API (server-side) with event dedupe and fbclid capture.~~
- ~~Retargeting audiences: visited /send-money, clicked /go/:provider, started checkout, plus conversion.~~
- ~~Attribution capture: store gclid/fbclid/msclkid + UTM on session/telemetry.~~
- ~~Consent & privacy gates tied to telemetry (cookie banner + opt-out enforcement).~~
