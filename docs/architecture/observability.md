# Observability Architecture

## One-screen quick map
Core monitoring wiring:
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/infrastructure/cdk/lib/monitoring.ts`
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/infrastructure/cdk/lib/scheduled-jobs.ts`
- Trace validation runbook: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/ops/tracing-validation.md`

Evidence packs (bounded JSON for agents):
- Schema: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.remit-scout/schema/evidence.schema.json`
- Library: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/scripts/lib/evidence.ts`
- Workflows: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.github/workflows/evidence-*.yml`

## SLO targets (default)
- API p95 latency:
  - dev <= 1500ms
  - staging <= 1000ms
  - prod <= 800ms
- Freshness p95:
  - tier-1 <= 900s (15m)
  - tier-2 <= 10,800s (3h)
  - dev override tier-2 = 21,600s (6h)
- Quote success rate:
  - tier-1 >= 0.98
  - tier-2 >= 0.95
- Provider coverage:
  - tier-1 >= 3
  - tier-2 >= 3
- DLQ depth must remain 0 across queues.
- Treat missing SLO metrics as SLO failures.

## Indices methodology (high level)
- RCI (cost ratio): weighted average of `(fee + FX markup) / send_amount`
- TEER: `mid_market_rate * (1 - RCI)`
- RVI: dispersion of effective rates; published as bps relative to TEER

See `backend/scripts/provider-weighting-job.ts` and `backend/scripts/data-health-slo-job.ts` for implementation details.
