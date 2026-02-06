# Runbook: Indices Readiness (TEER/RCI/RVI)

## Trigger
- SLO breaches:
  - `indices_available_ratio` below threshold
  - `indices_suppressed_ratio` above threshold
  - `weight_confidence_p10` below threshold

## Immediate checks
1) **Ops summary**
   - `GET /api/v1/ops/indices/health` (admin)
2) **Latest Gold update**
   - `SELECT MAX(date) FROM gold_export.cdp_daily WHERE amount_bucket = 500;`
3) **Suppression reasons**
   - `SELECT suppression_reason, COUNT(*) FROM gold_export.cdp_daily WHERE date = (SELECT MAX(date) FROM gold_export.cdp_daily) GROUP BY suppression_reason;`
4) **Provider coverage**
   - `SELECT corridor_id, provider_count FROM gold_export.cdp_daily WHERE date = (SELECT MAX(date) FROM gold_export.cdp_daily) ORDER BY provider_count ASC LIMIT 20;`

## Root-cause triage
- **Coverage drop**: provider outage or rights-matrix change.
- **Outliers**: rate inversion or bad mid-market data.
- **Weighting issues**: low `weight_confidence` (sparse data).

## Mitigations
- Reduce corridor set temporarily (Tier-0 only).
- Recompute weights (run provider-weighting job).
- Validate OANDA sync and FX rates.

## Recovery validation
- Indices canary passes.
- `indices_available_ratio` >= 0.80.
- `indices_suppressed_ratio` <= 0.20.
- `weight_confidence_p10` >= 0.30.
