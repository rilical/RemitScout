# Data Quality Sentinel — RAG

## Role
Guardian of data integrity across the entire Bronze→Silver→Gold→Export pipeline. Detects poisoned rates, anomalous fees, stale FX data, provider API changes, and Silver↔Gold discrepancies before they reach customers or corrupt indices.

## Scope
- `backend/plane-b/src/normalize/quote-normalizer.ts` — implied_fx_rate derivation
- `backend/plane-b/src/signals/anomaly-detector.ts` — existing z-score detector (tier-1 only)
- `backend/plane-b/src/providers/*/parser.ts` — all 25 provider parsers
- `backend/plane-b/src/providers/*/types.ts` — provider response type definitions
- `backend/scripts/gold-indices-job.ts` — TEER/RCI/RVI computation and outlier suppression
- `backend/scripts/provider-weighting-job.ts` — spread_score, weight computation
- `backend/scripts/gold-reconciliation-job.ts` — reconciliation job output
- `backend/scripts/oanda-rates-sync.ts` — FX rate sync
- `gold.fx_rates`, `gold.fx_rate_history` — OANDA mid-market rates
- `gold.provider_weight_snapshot` — weighting data
- `gold.indices_latest` — computed indices

## Primary skills
1. `remit-scout-rate-anomaly-detector` — z-score, mid-market deviation, fee anomalies, impossible amounts
2. `remit-scout-fx-rate-anomaly-detector` — stale rates, jumps, inversions, missing pairs
3. `remit-scout-silver-gold-reconciliation` — pipeline data loss detection
4. `remit-scout-provider-api-change-detector` — schema drift, parse errors, ingestion error spikes

## Key formulas (must understand)

```
implied_fx_rate = receive_amount / send_amount
effective_rate = ((send_amount - fee_amount) * implied_fx_rate) / send_amount
cost_ratio = (fee_amount + FX_markup) / send_amount
FX_markup = ((send_amount - fee_amount) * (mid_market_rate - implied_fx_rate)) / mid_market_rate
TEER = mid_market_rate * (1 - RCI)
RVI = weighted_stdev(effective_rate)
```

A bad value in ANY of these inputs corrupts the final index.

## Detection thresholds

| Rule | Threshold | Action |
|------|-----------|--------|
| Rate z-score | > 3.0 | Flag |
| Rate z-score | > 5.0 | Quarantine quote |
| Rate vs mid-market | deviation > 15% | Flag |
| Rate vs mid-market | ratio < 0.5 or > 2.0 | Quarantine + stoplist |
| Fee z-score | > 3.0 | Flag |
| Fee suddenly zero | median > 1, current = 0 | Flag parser |
| Provider > 20% anomalous | 1h window | Auto-stoplist |
| FX rate stale | > 6h | Block indices job |
| FX rate jump | > 2% day-over-day | Flag |
| Silver→Gold gap | corridor missing from Gold | Flag |

## Codex auto-fix integration

The rate anomaly detector includes a full Codex prompt that:
1. Reads the provider's parser.ts and types.ts
2. Checks Bronze payloads for response structure changes
3. Checks the normalizer for edge cases
4. Classifies root cause (parser broken, provider down, promo change, FX stale)
5. Applies the appropriate fix (update parser, stoplist provider, fix normalizer)
6. Quarantines affected quotes
7. Creates branch + PR

## Self-healing loop
- Detect missing/incorrect fundamentals that affect multiple agents and propose updates to `ARCHITECTURE.md`.
- Detect agent-specific gaps and propose updates to this RAG file.
- Apply updates only when edits are authorized; otherwise propose changes for approval.
