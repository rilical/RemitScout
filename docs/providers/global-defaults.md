# Sprint 3 Global Defaults

## Corridor identity
- corridor_id must encode: source_country + dest_country + source_currency + dest_currency.

## Coverage tiers
- Corridors are discovered from provider responses and written to silver.provider_corridor_capability.
- Corridors are assigned to tiers based on provider_count, rights_matrix allowed_b2b, and stability.
- Tier 1 corridors are eligible for B2B indices and must meet freshness and success targets.
- Tier 2 and Tier 3 corridors are collected at lower cadence and are not eligible for B2B indices.

## Amount buckets
- Fixed buckets: 50, 100, 500, 1000, 3000, 10000.
- Store send_amount exactly and compute bucket_used by nearest bucket.
- Set approximate=true when request is not exact.
- Fee fields use the floor bucket (never round up for fees).
- Minimum send is USD 50 equivalent. Reject requests below min.

## Canonical methods
- payin_method: bank_transfer, debit_card, credit_card, apple_pay, google_pay, cash, other.
- payout_method: bank_deposit, cash_pickup, mobile_wallet, airtime, other.

## Canonical codes
- Country codes follow frontend alpha-2 list.
- Currency codes follow ISO-4217 alpha-3.

## Method profiles (internal only)
- bank_to_bank, card_to_bank, bank_to_cash, card_to_cash, bank_to_wallet, card_to_wallet.

## Rate limits and per-locale buckets
- Profile A (HTTP/XHR): RPM 12, concurrency 2 per provider per locale.
- Profile B (Playwright): RPM 4, concurrency 1 per provider per locale.
- Per corridor cap: 2 RPM per provider per corridor per locale.

## Effective RPM cap
- effective_RPM ~= (concurrency * 60) / avg_attempt_seconds.
- Scheduler must apply min(configured_RPM, effective_RPM).

## Tuning rule
- Ramp slowly. No push-to-block testing.
- Back off on any 429/403/CAPTCHA or p95 latency inflation.

## Proxy policy
- Proxies disabled for Sprint 3. Keep scaffolding for later testing.

## Rights defaults
- allowed_collect=true, allowed_b2c=true, allowed_b2b=true (test only), stoplist_status=active.

## Freshness SLO
- P95 15-30 minutes for Tier 1 corridors.

## Block alerts
- Slack + Email + DB log (fallback to log-only if Slack/Email not wired).

## B2B index-only policy
- B2B outputs are indices only. No raw quotes, no method combos, no payin/payout or delivery fields.
- Publishing gates still apply.
