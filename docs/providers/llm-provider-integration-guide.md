# LLM Provider Integration Guide (Plane B + Plane A)

This guide is a concise, end-to-end checklist for integrating a new provider into the Remit-Scout pipeline. Follow it in order. It assumes the existing Plane B architecture (fetch -> block detect -> bronze -> parse -> normalize -> persist) and Plane A B2C access.

## 0) Non-negotiable guardrails
- No evasion. No proxy rotation. Stop on block.
- Respect per-provider RPM + per-corridor caps.
- Rights matrix controls collection; do not bypass.
- Canonical payin/payout enums only. Unknowns => other + quality flag.
- All quotes must have source+dest country + source+dest currency.
- Promo fields are optional. For B2C only, a promotional fee can be stored.

Reference docs:
- `docs/providers/global-defaults.md`
- `docs/providers/source-map.md`
- `docs/providers/provider-intake.md`
- `docs/providers/bucket-policy.md`
- `docs/providers/rate-limit-tuning.md`

## 1) Intake decisions (docs + seeds)
1. Update intake docs (provider name, source type, limits, auth notes).
2. Update rights matrix seed for the provider (allowed_collect=true, allowed_b2c=true, allowed_b2b=false, stoplist active).
3. Add provider row seed (silver.provider).

## 2) Provider folder skeleton
Create the provider folder in `backend/plane-b/src/providers/<provider>/` with:
- `catalog.ts` (amount buckets, default payin/payout)
- `limits.ts` (rpm, per-corridor rpm, concurrency)
- `supported-corridors.ts` (seed corridors or discovery list)
- `code-map.ts` (provider -> canonical method mapping)
- `fetch.ts` (HTTP request builder)
- `parse.ts` (payload -> normalized fields)
- `collector.ts` (orchestrates fetch -> block -> bronze -> normalize -> persist)
- `fixtures/` (raw payload fixtures)

## 3) Fixtures first
Capture 2-5 fixture payloads that cover:
- At least one corridor with each payout method.
- At least one promo rate (if provider supports it).
- A corridor with a different payin method.
- A failure or blocked response if possible.

Store fixtures under:
- `backend/plane-b/src/providers/<provider>/fixtures/corridors/<CORRIDOR_ID>.json`

## 4) Fetch implementation
- Use `httpRequest` from `plane-b/src/collectors/http-client`.
- Include provider headers, correlation IDs, and locale.
- Do not retry on block. Surface status+payload.
- Add optional jitter per request (use config).

## 5) Parse implementation
- Extract:
  - send_amount, receive_amount, fee_amount, total_debit_amount
  - payin_method, payout_method
  - base_rate, promotional_rate, promotional_cap_amount
  - delivery_time_min_minutes, delivery_time_max_minutes
- Promo fee support (B2C only): if provider exposes net vs gross fees, map net fee to promotional_fee_amount, and keep gross fee in fee_amount.
- Use canonical mapping from `code-map.ts`.
- Unknowns => other + quality flag.

## 6) Normalize + persist
- Call `normalizeQuote` in collector.
- Persist via `persistNormalizedQuote` in `plane-b/src/collectors/base.ts`.
- Ensure new fields are added to SQL inserts (quote_record + latest_quote_by_provider) when new columns exist.

## 7) Collector orchestration
Collector should:
- Check rights matrix + circuit breaker.
- Create ingestion_run.
- Fetch -> detect block -> write bronze -> parse -> normalize -> persist.
- Update `provider_corridor_capability` from parsed method pairs.
- Log attempts and ops alerts.
- Honor scheduler RPM + per-corridor caps.

## 8) Health probe + ops endpoint
- Add a health corridor list under `backend/shared/<provider>-corridors.ts`.
- Add a Plane A ops endpoint: `backend/plane-a/src/routes/ops/<provider>-health.ts`.
- Add optional scripts:
  - `backend/scripts/<provider>-probe.ts` (single corridor)
  - `backend/scripts/<provider>-observe.ts` (method discovery)

## 9) Sweeping from A-Z (full pipeline pass)
Goal: verify every step of the pipeline produces the expected data.

Runbook:
1. Use a small corridor set (10) first.
2. Sweep all buckets (per `catalog.ts`).
3. Sweep all payin/payout pairs returned by the provider.
4. Confirm in DB:
   - `silver.quote_attempt`
   - `silver.quote_record`
   - `silver.latest_quote_by_provider`
   - `silver.provider_corridor_capability`
5. Confirm promo fields populated when available:
   - `promotional_rate`, `base_rate`, `promotional_cap_amount`, `promotional_fee_amount`.

## 10) Tests to add
Minimum tests per provider:
- `tests/<provider>-fetch.test.ts` (mock httpRequest; verify URL + headers)
- `tests/<provider>-parse.test.ts` (fixture-based parse checks)
- `tests/<provider>-corridors.test.ts` (extract method pairs; promo detection if present)

## 11) Run tests
Targeted runs:
- `pnpm -C backend test -- <provider>-parse <provider>-fetch quote-normalizer`

Full integration suite (optional):
- `pnpm -C backend test -- <provider>`

## 12) Common failure modes
- Mismatched corridor_id format: must be SRC-DST-SRC_CCY-DST_CCY.
- Inconsistent fee math: keep gross fee in fee_amount; optional net fee in promotional_fee_amount.
- Not updating SQL inserts when adding columns.
- Using observed corridors without fallback to catalog (or vice versa).

