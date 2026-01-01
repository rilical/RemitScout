# Sprint 3 Prompt Pack - Provider Integration and Quote Normalization

## Execution protocol (must follow)
1. Do tasks in order, one at a time.
2. After finishing a task, edit this file and wrap the entire task line in ~~ ~~ to cross it out. Do not delete tasks.
3. Make the smallest diff that satisfies each task's AC.
4. Do not rename files unless a task explicitly says so.
5. Do not introduce new dependencies unless a task explicitly requires it.
6. Do not change database grants in ways that allow Plane A to read bronze.*.
7. Do not add non-ASCII characters to docs.
8. If a file path is ambiguous, search the repo and choose the Plane-specific file by context.
9. Do not add code that bypasses blocks (no CAPTCHA solving, no proxy rotation loops).

## RSE anchors (use when unsure)
- RSE-271225-022936.txt: three-plane separation, Bronze/Silver/Gold, stop-on-block, rights matrix, no evasion, derived-only publishing.
- RSE-271225-022936.txt: ingestion_run logging, data provenance, and N>=3 publishing gates.
- RSE-271225-022936.txt: entitlements and compliance are enforced server-side.

## Sprint 3 global defaults (applies to all 5 providers)
- Corridor identity uses source_country + dest_country + source_currency + dest_currency.
- Amount buckets are fixed: 50, 100, 500, 1000, 3000, 10000.
- Store send_amount exactly; compute bucket_used by nearest bucket and set approximate=true when request is not exact.
- Minimum send is USD 50 equivalent. If request < min, return 400 (do not bucket up).
- Fee handling: use the floor bucket for fee fields; FX rate may use nearest bucket.
- Canonical country codes follow frontend `frontend/utils/countries-currencies.ts` (alpha-2). Currency codes remain ISO-4217 alpha-3.
- Canonical payin_method values: bank_transfer, debit_card, credit_card, apple_pay, google_pay, cash, other.
- Canonical payout_method values: bank_deposit, cash_pickup, mobile_wallet, airtime, other.
- Method profiles are internal only (bank_to_bank, card_to_bank, bank_to_cash, card_to_cash, bank_to_wallet, card_to_wallet) and are not exposed in B2B outputs.
- Rate limits are per provider per locale. Profile A (HTTP/XHR): RPM 12, concurrency 2. Profile B (Playwright): RPM 4, concurrency 1. Per corridor cap = 2 RPM/provider/corridor/locale.
- Effective RPM is capped by runtime: effective_RPM ~= (concurrency * 60) / avg_attempt_seconds. Scheduler must apply min(configured_RPM, effective_RPM).
- Tuning rule: ramp slowly (no push-to-block), back off on any 429/403/CAPTCHA or p95 latency inflation.
- Proxies are disabled for Sprint 3. Keep proxy scaffolding for later and log block behavior from AWS egress.
- Rights matrix defaults: allowed_collect=true, allowed_b2c=true, allowed_b2b=true (test only), stoplist_status=active.
- Freshness SLO: P95 15-30 minutes for Tier 1 corridors.
- Block alerts: Slack + Email + DB log (if Slack/Email wired, else log-only).
- B2B outputs are indices only. No raw quotes, no method combos, no delivery or payin/payout fields. Publishing gates still apply.

## Coverage tiers (Sprint 3)
- Corridors are discovered from provider responses and written to silver.provider_corridor_capability.
- Corridors are assigned to Tier 1/2/3 based on provider_count, allowed_b2b, success_rate, freshness, and block_rate (<= 3 percent for Tier 1).
- Scheduler uses corridor tiers, not a static list.

## Provider intake matrix (Sprint 3)
Provider | Source type | Endpoint/Flow | Auth required | API key/creds | Allowed corridors | Amount buckets | Payin methods | Payout methods | Method profile mapping (internal) | HTTP RPM (per locale) | HTTP Concurrency | Playwright RPM (per locale) | Playwright Concurrency | Proxy allowed | Allowed_Collect | Allowed_B2C | Allowed_B2B (test) | stoplist_status | Freshness SLO | Block alert destination
Wise | Public API | POST /v3/quotes unauth quote for display; token optional for partner fee accuracy | No | None for Sprint 3 | Tiered corridors (coverage policy) | 50/100/500/1000/3000/10000 | bank_transfer, debit_card, credit_card (discover) | bank_deposit (discover) | derive from (payin,payout) | 12 | 2 | 4 | 1 | No (disabled) | true | true | true | active | 15-30 min | Slack + Email + DB log
Remitly | Hybrid (XHR first, web fallback) | Observe quote flow XHR; replay via HTTP; fallback Playwright | No | None | Tiered corridors (coverage policy) | 50/100/500/1000/3000/10000 | debit_card, credit_card, bank_transfer (discover) | bank_deposit, mobile_wallet, cash_pickup, cash_delivery (discover) | bank_to_bank, card_to_bank, card_to_cash, card_to_wallet, bank_to_wallet | 12 | 2 | 4 | 1 | No (disabled) | true | true | true | active | 15-30 min | Slack + Email + DB log
Western Union | Hybrid (XHR first, web fallback) | Observe quote flow XHR; replay via HTTP; fallback Playwright | No | None | Tiered corridors (coverage policy) | 50/100/500/1000/3000/10000 | bank_transfer, debit_card, credit_card, apple_pay (discover) | bank_deposit, cash_pickup, mobile_wallet (discover) | bank_to_bank, bank_to_cash, card_to_bank, card_to_cash, card_to_wallet | 12 | 2 | 4 | 1 | No (disabled) | true | true | true | active | 15-30 min | Slack + Email + DB log
WorldRemit | Hybrid (XHR first, web fallback) | Observe quote flow XHR; replay via HTTP; fallback Playwright | No | None | Tiered corridors (coverage policy) | 50/100/500/1000/3000/10000 | bank_transfer, debit_card, credit_card (discover) | bank_deposit, cash_pickup, mobile_wallet, airtime (discover) | bank_to_bank, card_to_bank, card_to_cash, card_to_wallet, card_to_airtime | 12 | 2 | 4 | 1 | No (disabled) | true | true | true | active | 15-30 min | Slack + Email + DB log
Xe | Hybrid (XHR first, web fallback) | Observe quote flow XHR; replay via HTTP; fallback Playwright | No | None | Tiered corridors (coverage policy) | 50/100/500/1000/3000/10000 | bank_transfer (discover card if offered) | bank_deposit (discover) | bank_to_bank (others discovered) | 12 | 2 | 4 | 1 | No (disabled) | true | true | true | active | 15-30 min | Slack + Email + DB log

---

## S3.0 Governance and intake
~~- [ ] S3.0.1 Create docs/providers/global-defaults.md~~
  Prompt: "Create docs/providers/global-defaults.md with corridor identity, amount buckets, canonical payin/payout, method profiles, rate limits (HTTP vs Playwright), per-locale buckets, effective_RPM formula, proxy policy, rights defaults, freshness SLO, block alerts, and B2B index-only policy."
  Files: docs/providers/global-defaults.md
  AC: doc exists and matches global defaults above.
  Command: cat docs/providers/global-defaults.md

~~- [ ] S3.0.2 Create docs/providers/provider-intake.md~~
  Prompt: "Create docs/providers/provider-intake.md and include the intake matrix above. Use ASCII only."
  Files: docs/providers/provider-intake.md
  AC: matrix present with all five providers.
  Command: cat docs/providers/provider-intake.md

~~- [ ] S3.0.3 Create docs/providers/source-map.md~~
  Prompt: "Create docs/providers/source-map.md with table: Provider | Source Type | Endpoint/Flow | Auth Required | Notes. Use the intake decisions above."
  Files: docs/providers/source-map.md
  AC: all five providers listed with source decision.
  Command: cat docs/providers/source-map.md

~~- [ ] S3.0.4 Create docs/providers/alert-routing.md~~
  Prompt: "Create docs/providers/alert-routing.md with Slack+Email+DB log routing and fallback to log-only if Slack/Email not wired."
  Files: docs/providers/alert-routing.md
  AC: doc exists with routing policy.
  Command: cat docs/providers/alert-routing.md

~~- [ ] S3.0.5 Create docs/providers/rate-limit-tuning.md~~
  Prompt: "Create docs/providers/rate-limit-tuning.md documenting effective_RPM formula, per-locale buckets, ramp schedule, and backoff triggers (429/403/CAPTCHA/p95 latency)."
  Files: docs/providers/rate-limit-tuning.md
  AC: doc exists with tuning rules and metrics to monitor.
  Command: cat docs/providers/rate-limit-tuning.md

~~- [ ] S3.0.6 Update docs/providers/global-defaults.md for new buckets and min send~~
  Prompt: "Update docs/providers/global-defaults.md with buckets 50/100/500/1000/3000/10000, min send USD 50 equivalent, nearest bucket + approximate flag, fee floor bucket rule, proxies disabled for Sprint 3, and freshness 15-30 minutes."
  Files: docs/providers/global-defaults.md
  AC: doc matches updated global defaults above.
  Command: cat docs/providers/global-defaults.md

~~- [ ] S3.0.7 Update docs/providers/provider-intake.md for new buckets and proxy status~~
  Prompt: "Update docs/providers/provider-intake.md to use the new buckets, freshness 15-30 min, and Proxy allowed = No (disabled)."
  Files: docs/providers/provider-intake.md
  AC: matrix matches updated intake table above.
  Command: cat docs/providers/provider-intake.md

~~- [ ] S3.0.8 Add docs/providers/code-map-policy.md~~
  Prompt: "Create docs/providers/code-map-policy.md explaining canonical country codes follow frontend alpha-2 and currency codes follow ISO-4217 alpha-3. Document how provider codes map into canonical codes."
  Files: docs/providers/code-map-policy.md
  AC: doc exists and explains mapping policy.
  Command: cat docs/providers/code-map-policy.md

~~- [ ] S3.0.9 Add docs/providers/bucket-policy.md~~
  Prompt: "Create docs/providers/bucket-policy.md describing nearest bucket + approximate flag, fee floor bucket rule, and min send rejection."
  Files: docs/providers/bucket-policy.md
  AC: doc exists with bucket policy and min send rule.
  Command: cat docs/providers/bucket-policy.md

---

## S3.1 Schema and translation tables (Sprint 3)
~~- [ ] S3.1.1 Create migration 004_provider_integration.sql~~
  Prompt: "Create a new migration adding: silver.provider_code_map, silver.provider_endpoint_registry, silver.provider_corridor_capability, silver.quote_attempt, silver.ops_alert_event. Use IF NOT EXISTS patterns and add indexes for provider_id and corridor_id."
  Files: backend/db/migrations/004_provider_integration.sql
  AC: migration defines all five tables and indexes, no DROP.
  Command: rg -n "provider_code_map|provider_endpoint_registry|provider_corridor_capability|quote_attempt|ops_alert_event" backend/db/migrations/004_provider_integration.sql

~~- [ ] S3.1.2 Add grants for Plane B and Plane C~~
  Prompt: "Add GRANT statements so plane_b can read/write these new tables and plane_c can read provider_corridor_capability and quote_attempt if needed. Do not grant plane_a bronze access."
  Files: backend/db/migrations/004_provider_integration.sql
  AC: grants exist and respect plane boundaries.
  Command: rg -n "GRANT" backend/db/migrations/004_provider_integration.sql

---

## S3.2 Canonical normalization contract
~~- [ ] S3.2.1 Add canonical enums and mappings~~
  Prompt: "Create backend/plane-b/src/normalize/canonical.ts exporting canonical payin and payout enums, canonical country/currency codes, and a safe fallback to other."
  Files: backend/plane-b/src/normalize/canonical.ts
  AC: canonical enums exist and used by normalizer.
  Command: cat backend/plane-b/src/normalize/canonical.ts

~~- [ ] S3.2.2 Add amount bucket mapping~~
  Prompt: "Create backend/plane-b/src/normalize/amount-bucket.ts with computeAmountBucket for [100,300,1000,5000], returning nearest bucket and out_of_bucket flag when delta > 20%."
  Files: backend/plane-b/src/normalize/amount-bucket.ts
  AC: bucket mapping exists and is unit tested.
  Command: cat backend/plane-b/src/normalize/amount-bucket.ts

~~- [ ] S3.2.3 Add method profile mapping~~
  Prompt: "Create backend/plane-b/src/normalize/method-profile.ts to map payin/payout to internal method profiles."
  Files: backend/plane-b/src/normalize/method-profile.ts
  AC: mapping returns profile or null.
  Command: cat backend/plane-b/src/normalize/method-profile.ts

~~- [ ] S3.2.4 Add quality flags registry~~
  Prompt: "Create backend/plane-b/src/normalize/quality-flags.ts defining partial_data, blocked, stale, parse_error."
  Files: backend/plane-b/src/normalize/quality-flags.ts
  AC: flags shared across collectors.
  Command: cat backend/plane-b/src/normalize/quality-flags.ts

~~- [ ] S3.2.5 Add quote normalizer~~
  Prompt: "Create backend/plane-b/src/normalize/quote-normalizer.ts that validates required fields, maps canonical enums, computes implied_fx_rate and amount_bucket, and returns quality_flags."
  Files: backend/plane-b/src/normalize/quote-normalizer.ts
  AC: required fields present; missing fields flagged.
  Command: cat backend/plane-b/src/normalize/quote-normalizer.ts

~~- [ ] S3.2.6 Add canonical code map from frontend~~
  Prompt: "Create backend/shared/countries-currencies.ts by copying name/code/currency from frontend/utils/countries-currencies.ts. Remove flags to keep ASCII. Export helpers to validate alpha-2 country codes and alpha-3 currency codes."
  Files: backend/shared/countries-currencies.ts
  AC: backend map matches frontend codes and is ASCII only.
  Command: cat backend/shared/countries-currencies.ts

~~- [ ] S3.2.7 Update amount bucket mapping to smart buckets~~
  Prompt: "Update amount-bucket.ts to use [50,100,500,1000,3000,10000]. Add helpers for nearest bucket (FX) and floor bucket (fees). Return bucket_used and approximate flag."
  Files: backend/plane-b/src/normalize/amount-bucket.ts
  AC: bucket logic matches smart buckets and exposes nearest + floor selection.
  Command: cat backend/plane-b/src/normalize/amount-bucket.ts

~~- [ ] S3.2.8 Improve quality flags~~
  Prompt: "Update quality-flags.ts to add: min_send_violation, bucket_approx, unknown_method, unsupported_corridor."
  Files: backend/plane-b/src/normalize/quality-flags.ts
  AC: new flags exist and are used by normalization or API logic.
  Command: cat backend/plane-b/src/normalize/quality-flags.ts

~~- [ ] S3.2.9 Update quote normalizer for new bucket policy~~
  Prompt: "Update quote-normalizer.ts to include bucket_used, fee_bucket_used, approximate flag, and use new smart buckets. Keep method_profile internal only."
  Files: backend/plane-b/src/normalize/quote-normalizer.ts
  AC: normalized output includes bucket metadata and approximate flag.
  Command: cat backend/plane-b/src/normalize/quote-normalizer.ts

---

## S3.3 Collector framework primitives
~~- [ ] S3.3.1 Base collector types~~
  Prompt: "Create backend/plane-b/src/collectors/types.ts with CollectorRequest and CollectorResult. Include raw_payload, normalized_quote, status, error_code, block_detected, and locale (proxy country or source_country)."
  Files: backend/plane-b/src/collectors/types.ts
  AC: types compile.
  Command: cat backend/plane-b/src/collectors/types.ts

~~- [ ] S3.3.2 Block detection utility~~
  Prompt: "Create backend/plane-b/src/collectors/block-detection.ts to flag blocked responses on 403/429/CAPTCHA/Access Denied."
  Files: backend/plane-b/src/collectors/block-detection.ts
  AC: returns blocked flag and reason.
  Command: cat backend/plane-b/src/collectors/block-detection.ts

~~- [ ] S3.3.3 HTTP client wrapper~~
  Prompt: "Create backend/plane-b/src/collectors/http-client.ts with timeout, jitter, and proxy support."
  Files: backend/plane-b/src/collectors/http-client.ts
  AC: uses per-provider limits and stop-on-block.
  Command: cat backend/plane-b/src/collectors/http-client.ts

~~- [ ] S3.3.4 Bronze writer~~
  Prompt: "Create backend/plane-b/src/collectors/bronze-writer.ts to write raw payloads into bronze.provider_raw and return bronze id."
  Files: backend/plane-b/src/collectors/bronze-writer.ts
  AC: bronze id returned for provenance.
  Command: cat backend/plane-b/src/collectors/bronze-writer.ts

~~- [ ] S3.3.5 Collector base~~
  Prompt: "Create backend/plane-b/src/collectors/base.ts to orchestrate fetch -> block detect -> bronze write -> normalize -> upsert."
  Files: backend/plane-b/src/collectors/base.ts
  AC: used by provider collectors.
  Command: cat backend/plane-b/src/collectors/base.ts

---

## S3.4 Provider catalogs and limits
~~- [ ] S3.4.1 Create provider folders~~
  Prompt: "Create folders backend/plane-b/src/providers/{wise,remitly,westernunion,worldremit,xe}."
  Files: provider folders
  AC: folders exist.

~~- [ ] S3.4.2 Create catalog.ts for each provider~~
  Prompt: "Create catalog.ts files listing seed corridors, amount buckets, and payin/payout combos from the intake matrix."
  Files: backend/plane-b/src/providers/*/catalog.ts
  AC: catalog files exist and export typed lists.

~~- [ ] S3.4.3 Create limits.ts for each provider~~
  Prompt: "Create limits.ts for each provider using HTTP and Playwright RPM/concurrency from the intake matrix, keyed per locale."
  Files: backend/plane-b/src/providers/*/limits.ts
  AC: limits exist and used by scheduler.

~~- [ ] S3.4.4 Create global seed corridors file~~
  Prompt: "Removed. Replaced by corridor coverage tiers."
  Files: backend/plane-b/src/providers/seed-corridors.ts
  AC: Not used.
  Command: n/a

~~- [ ] S3.4.5 Add provider code-map files~~
  Prompt: "Create backend/plane-b/src/providers/<provider>/code-map.ts to map provider-specific country/currency/method codes to canonical codes. Use TODO where unknown."
  Files: backend/plane-b/src/providers/*/code-map.ts
  AC: mapping files exist for all five providers.
  Command: rg -n \"code-map\" backend/plane-b/src/providers

~~- [ ] S3.4.6 Replace placeholder catalogs with provider-specific maps~~
  Prompt: "Update each provider catalog.ts to remove seed corridors and reference provider-specific code-map files only. Corridors are selected by coverage tiers."
  Files: backend/plane-b/src/providers/*/catalog.ts
  AC: catalogs reference code-map files and do not depend on seed corridors.
  Command: rg -n \"code-map\" backend/plane-b/src/providers/*/catalog.ts

~~- [ ] S3.4.7 Add coverage tier policy doc~~
  Prompt: "Create docs/providers/corridor-coverage-policy.md with Tier 1/2/3 criteria, promotion/demotion rules, and B2B eligibility requirements."
  Files: docs/providers/corridor-coverage-policy.md
  AC: doc exists with tier criteria and cadence rules.
  Command: cat docs/providers/corridor-coverage-policy.md

~~- [ ] S3.4.8 Add corridor tier table/view task~~
  Prompt: "Add a migration or view to compute corridor_tier from provider_count, allowed_b2b, and stability. Scheduler uses corridor_tier, not a static list."
  Files: backend/db/migrations/004_provider_integration.sql or new migration
  AC: corridor_tier definition exists and is referenced by scheduler tasks.
  Command: rg -n \"corridor_tier\" backend/db/migrations

---

## S3.5 Provider collectors (repeat per provider)
~~- [ ] S3.5.<P>.1 Fixture capture~~
  Prompt: "Capture a sample payload for <provider> into backend/plane-b/src/providers/<provider>/fixtures/quote.json using public API or public web flow."
  AC: fixture exists and is used by parser tests.

~~- [ ] S3.5.<P>.2 Fetcher~~
  Prompt: "Create fetch.ts for <provider> using public API or public web flow only. Stop on block, no retries, no evasion."
  AC: fetcher returns payload or blocked status.

~~- [ ] S3.5.<P>.3 Parser~~
  Prompt: "Create parse.ts to map payload to normalized fields (send, receive, fee, payin, payout, delivery). Map to canonical enums and return quality flags."
  AC: parser handles fixture.

~~- [ ] S3.5.<P>.4 Collector entry~~
  Prompt: "Create collector.ts to orchestrate fetch -> block detect -> bronze write -> normalize -> silver upsert. Enforce rights matrix and stoplist before fetch."
  AC: collector returns normalized quote + bronze_object_key or blocked.

~~- [ ] S3.5.<P>.5 Tests~~
  Prompt: "Create parse.test.ts to validate required fields using fixture payload."
  AC: tests pass.

---

## S3.6 Ingestion integration
~~- [ ] S3.6.1 Provider registry~~
  Prompt: "Create backend/plane-b/src/providers/index.ts exporting all collectors and metadata."
  AC: registry drives ingestion.

~~- [ ] S3.6.2 Ingestion runner update~~
  Prompt: "Update ingest.ts to iterate the registry and enforce rights matrix and stoplist. Log skip reason."
  AC: paused providers skipped.

~~- [ ] S3.6.3 latest_quote_by_provider upsert~~
  Prompt: "Ensure upsert key uses corridor_id + amount_bucket + payin + payout + provider_id."
  AC: latest table updated after each run.

---

## S3.7 Scheduler and throttling
~~- [ ] S3.7.1 Scheduler~~
  Prompt: "Add scheduler.ts to enforce per-provider per-locale RPM, concurrency, and jitter. Cap by effective_RPM based on avg_attempt_seconds."
  AC: no provider exceeds limits.

~~- [ ] S3.7.2 Per-corridor cap~~
  Prompt: "Enforce 2 RPM per provider/corridor/locale."
  AC: cap enforced.

~~- [ ] S3.7.3 Attempt duration metrics~~
  Prompt: "Track avg_attempt_seconds per provider+locale and store it with ingestion_run or a lightweight metrics table for effective_RPM."
  AC: scheduler has a stable input for effective_RPM.

---

## S3.8 Compliance and stop-on-block
~~- [ ] S3.8.1 Circuit breaker updates~~
  Prompt: "On block detection, set circuit_breaker state=open and rights_matrix.stoplist_status=paused; log error_code=blocked."
  AC: provider pauses after block.

~~- [ ] S3.8.2 Block alerts~~
  Prompt: "Send block alert to Slack + Email + DB log (fallback log-only if not wired)."
  AC: alert route triggered and stored.

---

## S3.8B B2C query bucketing and min send (Plane A)
~~- [ ] S3.8B.1 Add bucket selection helper~~
  Prompt: "Add a helper that chooses bucket_used (nearest) and fee_bucket_used (floor) for a requested amount. Return approximate=true when request is not exact."
  Files: backend/plane-a/src/services/amount-buckets.ts (or similar)
  AC: helper returns bucket_used, fee_bucket_used, approximate.
  Command: cat backend/plane-a/src/services/amount-buckets.ts

~~- [ ] S3.8B.2 Enforce min send USD 50 equivalent~~
  Prompt: "In /api/quotes/current, reject requests below USD 50 equivalent using gold.fx_rates for USD -> send currency. Return 400 with min_send and currency."
  Files: backend/plane-a/src/routes/quotes.ts
  AC: requests below min return 400; no bucket up.
  Command: rg -n \"min_send\" backend/plane-a/src/routes/quotes.ts

~~- [ ] S3.8B.3 Include bucket metadata in response~~
  Prompt: "Add bucket_used, fee_bucket_used, and approximate to /api/quotes/current response. Keep requested_amount in response."
  Files: backend/plane-a/src/routes/quotes.ts
  AC: response includes bucket metadata and requested_amount.
  Command: rg -n \"bucket_used|approximate\" backend/plane-a/src/routes/quotes.ts

~~- [ ] S3.8B.4 Improve B2C payin/payout/delivery output~~
  Prompt: "Ensure /api/quotes/current returns payin_method, payout_method, delivery_time_min_minutes, delivery_time_max_minutes. Add concise labels if available."
  Files: backend/plane-a/src/routes/quotes.ts
  AC: response includes payin, payout, and delivery time fields.
  Command: rg -n \"payin|payout|delivery_time\" backend/plane-a/src/routes/quotes.ts

---

## S3.9 QA and validation
~~- [ ] S3.9.1 Manual QA checklist~~
  Prompt: "Create docs/providers/qa-checklist.md with one corridor and one amount bucket per provider."
  AC: checklist covers all five.

~~- [ ] S3.9.2 Schema conformance test~~
  Prompt: "Add a test that fails if required fields in quote_record are null."
  AC: test runs in CI.

---

## S3.10 Docs updates
~~- [ ] S3.10.1 Update service catalog for provider collectors~~
~~- [ ] S3.10.2 Update data rights matrix doc with provider rights~~
~~- [ ] S3.10.3 Update ingestion runbook with provider notes, rate limits, and proxy policy~~
~~- [ ] S3.10.4 Update docs/INDEX.md~~
