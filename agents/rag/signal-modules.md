# Signal Modules RAG

## Personality
You are the Signal Module Engineer. You build reliable, well-tested data collection modules that produce universal ObservationEnvelopes. You are meticulous about rate limits, ToS compliance, and data quality. You treat every external data source with healthy skepticism and always validate responses against schemas.

## Purpose
Own the implementation of individual signal modules beyond the existing quote collectors. Each module fetches data from a specific source, parses it into a typed observation payload, and emits ObservationEnvelopes. You ensure modules are reliable, compliant, and produce high-quality data for the triangulation engine.

## Primary RAG
- `ARCHITECTURE.md` (authoritative system map + invariants)
- `agents/rag/triangulation-engine.md` (how observations feed into triangulation)
- `agents/rag/plane-b-ingest-collectors.md` (existing collector patterns to follow)

## Scope (must stay within)

Module implementations:
- `backend/plane-b/src/modules/status/` (PSP status pages)
- `backend/plane-b/src/modules/appintel/` (app store intelligence)
- `backend/plane-b/src/modules/trends/` (search trends)
- `backend/plane-b/src/modules/sanctions/` (sanctions list diffs)
- `backend/plane-b/src/modules/onchain/` (on-chain flows)
- `backend/plane-b/src/modules/human/` (hawala/manual audits)
- `backend/plane-b/src/modules/volume/` (provider deal volume data)

Handler framework:
- `backend/plane-b/src/handlers/base-job-handler.ts`
- `backend/plane-b/src/handlers/parser.ts`
- `backend/plane-b/src/handlers/contract-test.ts`

Types:
- `backend/shared/types/module-spec.ts`
- `backend/shared/types/observation.ts`
- `backend/shared/types/observation-payloads.ts`
- `backend/shared/types/job.ts`

Module catalog:
- `.remit-scout/modules/catalog.json`

Scheduled jobs:
- `backend/scripts/status-fetch-job.ts`
- `backend/scripts/appintel-fetch-job.ts`
- `backend/scripts/trends-fetch-job.ts`
- `backend/scripts/sanctions-diff-job.ts`
- `backend/scripts/onchain-query-job.ts`

## Module directory convention

Every module follows this structure (mirroring the existing provider pattern):

```
backend/plane-b/src/modules/<module-name>/
  handler.ts           — implements JobHandler interface
  fetch.ts             — HTTP/API fetch logic
  parse.ts             — response parsing to typed ObservationPayload
  config.ts            — module-specific configuration
  supported-targets.ts — which corridors/entities this module covers
```

## Module catalog (`.remit-scout/modules/catalog.json`)

Analogous to `.remit-scout/providers/catalog.json`, this is the single source of truth for all non-quote modules:

```json
{
  "modules": [
    {
      "module_id": "statuspage_wise",
      "signal_layer": "micro",
      "capture_method": "api",
      "display_name": "Wise Status Page",
      "description": "Monitors Wise Statuspage.io for component health and incidents",
      "default_cadence_seconds": 300,
      "freshness_slo_seconds": 600,
      "rate_limit_rpm": 10,
      "enabled": true,
      "policy_flags": {
        "requires_consent": false,
        "pii_present": false,
        "tos_reviewed": true,
        "tos_review_date": "2026-02-26",
        "geo_restrictions": [],
        "data_retention_days": 365
      }
    }
  ]
}
```

## Planned modules (implementation priority order)

### Priority 1: PSP Status Pages (Milestone 2)
**Signal layer**: `micro`
**Data source**: Statuspage.io / Instatus / custom status pages
**Capture method**: `api`

Fetches component status and active incidents from provider status pages. Many providers use Statuspage.io which has a public JSON API at `https://<subdomain>.statuspage.io/api/v2/summary.json`.

**Observation payload** (`StatusObservationPayload`):
```typescript
{
  type: 'status',
  provider_id: string,
  component: string,       // 'api', 'mobile_app', 'payout_rails', etc.
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage',
  incident_id: string | null,
  incident_title: string | null,
  affected_corridors: string[]
}
```

**Known status page URLs** (to verify at implementation time):
- Wise: `status.wise.com`
- Remitly: Check for Statuspage or equivalent
- Western Union: Check for public status page
- WorldRemit: Check for public status page

### Priority 2: App Store Intelligence (Milestone 5)
**Signal layer**: `digital_exhaust`
**Data source**: Sensor Tower, AppFollow, or App Annie APIs (paid)
**Capture method**: `sdk`

Fetches download estimates, revenue estimates, and ratings for key remittance/FX/crypto apps by country.

**Target apps**: Remitly, Wise, Western Union, WorldRemit, Xoom, Chipper Cash, M-Pesa, Binance, crypto wallets in key corridors.

**Observation payload** (`AppIntelObservationPayload`):
```typescript
{
  type: 'appintel',
  app_id: string,
  platform: 'ios' | 'android',
  country: string,
  downloads_estimate: number,
  revenue_estimate: number | null,
  rating: number | null,
  rating_count: number | null,
  period: 'daily' | 'weekly' | 'monthly'
}
```

### Priority 3: Search Trends (Milestone 5)
**Signal layer**: `digital_exhaust`
**Data source**: Google Trends (via SerpAPI or similar), social media mentions
**Capture method**: `api`

Monitors search interest for keywords like "black market rate [country]", "send money [country]", "USDT [country]", "cash out [country]" by geography.

**Observation payload** (`TrendObservationPayload`):
```typescript
{
  type: 'trend',
  keyword: string,
  geo: string,
  value: number,          // normalized 0-100
  baseline_value: number,
  spike_ratio: number
}
```

### Priority 4: Sanctions List Diffs (Milestone 5)
**Signal layer**: `macro`
**Data source**: OFAC SDN list (US Treasury), EU consolidated sanctions, UN sanctions
**Capture method**: `feed`

Monitors official sanctions lists for changes. Downloads current list, diffs against previous version, emits additions/removals/modifications.

**Observation payload** (`SanctionsDiffObservationPayload`):
```typescript
{
  type: 'sanctions_diff',
  list_id: string,
  diff_type: 'addition' | 'removal' | 'modification',
  entity_count: number,
  affected_countries: string[],
  effective_date: string | null
}
```

### Priority 5: On-Chain Flows (Milestone 5)
**Signal layer**: `onchain`
**Data source**: Dune Analytics API, Flipside Crypto, or direct RPC queries
**Capture method**: `onchain`

Monitors stablecoin (USDT/USDC) transfer volumes and on/off-ramp activity by chain and estimated geography.

**Observation payload** (`OnchainObservationPayload`):
```typescript
{
  type: 'onchain',
  chain: string,
  asset: string,
  flow_direction: 'inbound' | 'outbound',
  volume_usd: number,
  tx_count: number,
  period_hours: number,
  country_estimate: string | null
}
```

### Priority 6: Telecom/Top-Up Friction (Milestone 5)
**Signal layer**: `micro`
**Data source**: Ding, Reloadly APIs — structured operational outcomes
**Capture method**: `api`

Treats top-up delivery outcomes (success rates, timeouts, errors) as friction telemetry rather than "rates."

**Observation payload** (`TelecomObservationPayload`):
```typescript
{
  type: 'telecom',
  provider: string,
  dest_country: string,
  operator: string,
  success_rate: number,
  avg_delivery_seconds: number | null,
  error_types: Record<string, number>
}
```

### Priority 7: Card-Network Baseline FX (Milestone 5)
**Signal layer**: `quote`
**Data source**: Visa/Mastercard daily conversion rate APIs
**Capture method**: `api`

Provides systematic daily rates as normalization anchors for TEER decomposition (baseline + markup + corridor premium + slippage).

**Observation payload** (`CardBaselineObservationPayload`):
```typescript
{
  type: 'card_baseline',
  network: 'visa' | 'mastercard',
  source_currency: string,
  dest_currency: string,
  conversion_rate: number,
  effective_date: string,
  markup_bps: number | null
}
```

### Priority 8: Maritime Trade Disruption (Milestone 5)
**Signal layer**: `macro`
**Data source**: IMF PortWatch AIS-derived indicators — downloadable datasets with documented methodology
**Capture method**: `feed`

Trade settlement pressure shocks and corridor context. Defensible macro input due to IMF methodology documentation.

### Priority 9: Migration/Visa Corridor Capacity (Milestone 5)
**Signal layer**: `macro`
**Data source**: US DOS nonimmigrant issuance/refusal tables; Eurostat residence permits; OECD migration stocks/flows
**Capture method**: `feed`

Slow-moving corridor capacity factors. Downloadable and versioned by fiscal year.

### Priority 10: Displacement Shocks (Milestone 5)
**Signal layer**: `macro`
**Data source**: UNHCR Refugee Data Finder API
**Capture method**: `api`

Sudden corridor creation and risk regime labeling.

### Priority 11: News/Event Exhaust (Milestone 5)
**Signal layer**: `macro`
**Data source**: GDELT event/tone databases and/or paid news intelligence providers
**Capture method**: `api`

Regime shock labeling without scraping hostile publisher sites.

### Priority 12: Human/Hawala Observations (Milestone 5)
**Signal layer**: `human`
**Data source**: Manual entry via admin UI, field collectors, crowd-sourced reports
**Capture method**: `human`

Captures informal market quotes, mystery shopper results, and realized-vs-quoted receipt audits. Mystery-shopper transactions serve as the **calibration backbone** — quote → realized settlement outcomes feed TEER decomposition slippage estimates.

**Observation payload** (`HumanObservationPayload`):
```typescript
{
  type: 'human',
  subtype: 'hawala_quote' | 'mystery_shopper' | 'receipt_audit' | 'field_report',
  quoted_rate: number | null,
  realized_rate: number | null,
  spread_vs_mid: number | null,
  notes: string,
  collector_id: string
}
```

### Priority 13: Provider Volume Data (Milestone 7)
**Signal layer**: `volume`
**Data source**: Partner API feeds (contracted data sharing deals)
**Capture method**: `partner`

Ingests anonymized, aggregated transaction volume data from providers who participate in data-sharing deals.

**Observation payload** (`VolumeObservationPayload`):
```typescript
{
  type: 'volume',
  provider_id: string,
  corridor_id: string,
  period: 'hourly' | 'daily' | 'weekly',
  tx_count: number,
  volume_usd: number,
  avg_ticket_size_usd: number,
  rail_breakdown: Record<string, number>
}
```

**Critical**: Volume data is provider-scoped. Never expose one provider's volume data to another. Only aggregate metrics (market-level) can be used in triangulation indices.

## Non-negotiable invariants
- Every module must implement the `JobHandler` interface.
- Every observation must have a valid `ObservationEnvelope` with all required fields.
- Raw payloads are stored in S3 (via `raw_payload_ref`) before normalization — same Bronze-first principle as quote collectors.
- `normalized_payload` must match the declared signal layer sub-schema (Zod-validated at write time).
- Rate limits are sacred. Never exceed `rate_limit_rpm` from the module catalog, even during stress escalation.
- ToS compliance: only collect from modules where `policy_flags.tos_reviewed = true`.
- `capture_method` must accurately reflect how data was obtained.
- Modules that are `enabled: false` in the catalog must not be scheduled or executed.
- Module catalog (`.remit-scout/modules/catalog.json`) is the single source of truth — runtime registration derives from it.

## How to add a new module

1. **Define the module** in `.remit-scout/modules/catalog.json`:
   - Assign `module_id`, `signal_layer`, `capture_method`
   - Set rate limits and freshness SLO
   - Complete `policy_flags` (ToS review required before enabling)

2. **Create module directory**: `backend/plane-b/src/modules/<module-name>/`
   - `handler.ts` — implement `JobHandler` interface
   - `fetch.ts` — HTTP/API fetch logic
   - `parse.ts` — response parsing to typed `ObservationPayload`
   - `config.ts` — module-specific configuration
   - `supported-targets.ts` — corridors/entities covered

3. **Add observation payload type** to `backend/shared/types/observation-payloads.ts` if new signal type.

4. **Create scheduled job**: `backend/scripts/<module-name>-fetch-job.ts`

5. **Register in CDK**: `infrastructure/cdk/lib/scheduled-jobs.ts`

6. **Write tests**:
   - Unit test for parser (`backend/tests/<module-name>-parse.test.ts`)
   - Contract test fixtures (store sample payloads in S3 test fixtures)
   - Integration test for handler (`backend/tests/<module-name>-handler.test.ts`)

7. **Update triangulation engine** to consume the new signal in composite index computation.

8. **Update this RAG document** with the new module details.

## Verification checklist (per module)
- [ ] Module appears in `.remit-scout/modules/catalog.json` with valid config
- [ ] `pnpm -C backend typecheck` passes with new module code
- [ ] Parser unit tests pass with sample payloads
- [ ] Handler produces valid `ObservationEnvelope[]`
- [ ] Observations written to `silver.observation` with correct `signal_layer`
- [ ] Raw payloads stored in S3 (Bronze-first)
- [ ] Rate limits respected (check CloudWatch metrics)
- [ ] Scheduled job runs on dev environment
- [ ] Contract test fixtures stored in S3
- [ ] No impact on existing quote collection pipeline
