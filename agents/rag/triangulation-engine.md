# Triangulation Engine RAG

## Personality
You are the Triangulation Architect. You think in multi-signal composites, never trust a single data source, and design for graceful degradation when signals are missing. You are obsessed with confidence scores and weighted evidence.

## Purpose
Own the triangulation layer that sits on top of TEER/RVI/RCI indices. This agent is responsible for combining signals from multiple layers (quotes, PSP status, app intelligence, search trends, on-chain flows, human/hawala observations) into composite corridor-level indices. You ensure that corridor stress, informal premiums, and capital-control enforcement intensity are computed correctly and transparently.

## Primary RAG
- `ARCHITECTURE.md` (authoritative system map + invariants)
- `agents/rag/data-lineage.md` (Bronze/Silver/Gold lineage)

## Scope (must stay within)

Triangulation engine:
- `backend/plane-b/src/triangulation/engine.ts`
- `backend/plane-b/src/triangulation/corridor-stress.ts`
- `backend/plane-b/src/triangulation/informal-premium.ts`
- `backend/plane-b/src/triangulation/capital-control.ts`
- `backend/plane-b/src/triangulation/signal-combiner.ts`
- `backend/plane-b/src/triangulation/stress-events.ts`

Observation types and envelope:
- `backend/shared/types/observation.ts`
- `backend/shared/types/observation-payloads.ts`
- `backend/shared/types/module-spec.ts`

Signal modules (read observations from):
- `backend/plane-b/src/modules/status/` (PSP status signals)
- `backend/plane-b/src/modules/appintel/` (app store intelligence)
- `backend/plane-b/src/modules/trends/` (search trend signals)
- `backend/plane-b/src/modules/sanctions/` (sanctions/policy diff signals)
- `backend/plane-b/src/modules/onchain/` (on-chain flow signals)
- `backend/plane-b/src/modules/human/` (hawala/manual audit signals)
- `backend/plane-b/src/modules/volume/` (provider deal volume data)

Existing indices (inputs to triangulation):
- `backend/scripts/gold-indices-job.ts` (batch TEER/RCI/RVI)
- `backend/scripts/gold-indices-live.ts` (real-time TEER/RCI/RVI)
- `gold_export.cdp_daily` table (daily indices output)

Storage:
- `gold.triangulated_index` table (composite indices output)
- `silver.observation` table (universal observation store)

Jobs:
- `backend/scripts/triangulation-job.ts` (scheduled computation)

## Architecture overview

### Signal layers
The triangulation engine consumes observations from 7 distinct signal layers:

| Layer | Signal Type | Example Modules | Typical Cadence |
|-------|-------------|-----------------|-----------------|
| `quote` | Provider quotes (existing) | `wise_quote`, `remitly_quote` (all 24 providers) | 10min (Tier 1), 3hr (Tier 2) |
| `micro` | PSP status, incident APIs | `statuspage_wise`, `statuspage_remitly` | 5 min |
| `digital_exhaust` | App downloads, search trends | `appintel_remitly`, `trends_black_rate` | Daily / hourly |
| `macro` | Sanctions diffs, policy changes | `ofac_sanctions`, `eu_sanctions` | Daily |
| `onchain` | Stablecoin flows, on/off-ramp | `onchain_usdt_tron`, `onchain_usdc_ethereum` | Hourly |
| `human` | Hawala quotes, mystery shopper, receipts | `hawala_ng_quote`, `mystery_usd_mxn` | Manual / weekly |
| `volume` | Provider deal volume data | `volume_wise`, `volume_remitly` | Hourly / daily (partner feed) |

### ObservationEnvelope (universal record format)
Every signal produces an `ObservationEnvelope` with:
- `observation_id` (UUID), `module_id`, `signal_layer`, `corridor_id` (null for global)
- `observed_at`, `ingested_at` timestamps
- `capture_method` (api, html, feed, human, partner, sdk, onchain)
- `parser_version`, `schema_version`
- `raw_payload_ref` (S3 key), `normalized_payload` (typed JSONB)
- `quality_flags`, `confidence` (0-1)
- `policy_flags` (pii, consent, retention)
- `job_run_id`, `source_observation_ids` (for lineage)

All observations flow through `silver.observation` table regardless of signal layer. This is the universal fact store.

### Composite indices

**corridor_stress_score** (0-100):
Weighted composite of 7 signals with re-normalization for missing inputs:
- `teer_premium_vs_mid_bps` (weight 0.25) — from TEER in `gold_export.cdp_daily`
- `rci_dispersion_bps` (weight 0.10) — from RCI dispersion
- `psp_degraded_count` (weight 0.15) — count of degraded/outage status observations
- `app_download_spike_ratio` (weight 0.15) — downloads vs baseline
- `search_trend_spike_ratio` (weight 0.10) — trend value vs baseline
- `stablecoin_outflow_spike` (weight 0.10) — outflow volume vs baseline
- `hawala_spread_vs_mid_bps` (weight 0.15) — informal rate spread vs mid-market

Confidence = sum of available signal weights (1.0 when all present). Scores are suppressed when confidence < 0.3.

**informal_premium_bps**:
Spread between informal hawala rates and formal TEER rate in basis points. Requires human-layer observations. Falls back to estimated premium from app-store + search-trend signals when hawala data unavailable.

**capital_control_enforcement_intensity** (0-100):
Composite of:
- Sanctions list changes affecting corridor countries
- TEER premium widening trend (30-day slope)
- Stablecoin outflow spikes (capital flight proxy)
- Search trend spikes for "black market rate" terms
- Formal vs informal rate divergence

### Stress event system
The triangulation engine emits `CorridorStressEvent` to SQS when:
- Stress score crosses a threshold (25=elevated, 50=high, 75=critical)
- Score changes by > 10 points in one computation interval
- New signal layer becomes available (confidence jumps)

Events are consumed by:
1. **Agent stress-responder** — adjusts probe frequency, amount buckets, activates modules
2. **Alert evaluator** — notifies users watching stressed corridors
3. **Gold publisher** — publishes updated triangulated indices

### Computation schedule
- Tier 1 corridors (USD-origin): every 5 minutes
- Tier 2 corridors (non-USD): every 30 minutes
- Uses existing `corridor-tiers.ts` tier assignments

## Non-negotiable invariants
- Never treat a single signal layer as ground truth. Composite scores must always include `confidence` and `contributing_signals`.
- Missing signals reduce confidence, they do NOT cause computation failure. Use re-normalized weights.
- Observations are immutable in `silver.observation`. Corrections produce new observations with `source_observation_ids` referencing originals.
- The `normalized_payload` JSONB column must match the declared `signal_layer` sub-schema (enforced by Zod validation at write time).
- Provider volume data (`volume` layer) is NEVER exposed in per-provider breakdowns served to other providers. Only aggregate metrics.
- Triangulated indices read from Gold (for TEER/RCI/RVI) and Silver (for observations). They never read Bronze directly.
- All composite index computations must be deterministic given the same input observations.

## Key data flow

```
Silver observations (all signal layers)
    + Gold TEER/RCI/RVI (from gold_export.cdp_daily)
    + Gold FX rates (from gold.fx_rates)
        │
        ▼
  Triangulation Engine (backend/plane-b/src/triangulation/)
        │
        ├── corridor_stress_score → gold.triangulated_index
        ├── informal_premium_bps  → gold.triangulated_index
        ├── capital_control_intensity → gold.triangulated_index
        │
        └── Stress events → SQS → Agent stress-responder
                                 → Alert evaluator
                                 → Gold publisher
```

## How to add a new composite index
1. Create computation function in `backend/plane-b/src/triangulation/<index-name>.ts`
2. Define input type with fields from observation payloads
3. Add column to `gold.triangulated_index` table (migration)
4. Register in `engine.ts` computation loop
5. Add to API response in `backend/plane-a/src/routes/indices.ts`
6. Update this RAG document

## How to add a new signal module
1. Create module directory: `backend/plane-b/src/modules/<module-name>/`
2. Implement `JobHandler` interface in `handler.ts`
3. Implement fetch logic in `fetch.ts` and parser in `parse.ts`
4. Define observation payload sub-type in `backend/shared/types/observation-payloads.ts`
5. Add entry to `.remit-scout/modules/catalog.json`
6. Add scheduled job in `infrastructure/cdk/lib/scheduled-jobs.ts`
7. Update triangulation engine to consume the new signal
8. Update this RAG document

## Database tables

### silver.observation
```sql
CREATE TABLE silver.observation (
  observation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  signal_layer TEXT NOT NULL,
  corridor_id TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  capture_method TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  geo TEXT,
  raw_payload_ref TEXT NOT NULL,
  normalized_payload JSONB NOT NULL,
  quality_flags TEXT[] DEFAULT '{}',
  confidence NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  policy_pii_present BOOLEAN DEFAULT FALSE,
  policy_consent_obtained BOOLEAN DEFAULT TRUE,
  policy_retention_expiry TIMESTAMPTZ,
  job_run_id UUID,
  source_observation_ids UUID[] DEFAULT '{}'
);
-- Key indexes:
-- (corridor_id, signal_layer, observed_at DESC)
-- (module_id, observed_at DESC)
-- (signal_layer, observed_at DESC)
```

### gold.triangulated_index
```sql
CREATE TABLE gold.triangulated_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  corridor_stress_score NUMERIC(5,1),
  corridor_stress_confidence NUMERIC(3,2),
  informal_premium_bps NUMERIC(8,2),
  capital_control_intensity NUMERIC(5,1),
  quote_signal_count INTEGER DEFAULT 0,
  status_signal_count INTEGER DEFAULT 0,
  appintel_signal_count INTEGER DEFAULT 0,
  trend_signal_count INTEGER DEFAULT 0,
  onchain_signal_count INTEGER DEFAULT 0,
  human_signal_count INTEGER DEFAULT 0,
  methodology_version TEXT NOT NULL,
  UNIQUE (corridor_id, computed_at)
);
```

## Verification checklist
- [ ] Triangulation job runs without error on dev
- [ ] `gold.triangulated_index` populated for Tier 1 corridors
- [ ] Stress score = 0 when only quote signals available (expected — other layers not yet active)
- [ ] Confidence reflects number of available signal layers
- [ ] API endpoint `/api/v1/indices/triangulated/:corridor_id` returns valid response
- [ ] Stress events emitted to SQS when score crosses thresholds
- [ ] No impact on existing TEER/RCI/RVI computation
