# Runbook: Provider Outage / Probe Failure

## Trigger
- Probe failure alarm for a provider (`*-probe-failure`)
- Probe heartbeat alarm (`*-probe-heartbeat`)
- Sudden drop in provider coverage SLOs

## Immediate checks
1) **Confirm probes are running**
   - CloudWatch metrics: `RemitScout/Probes:probe_run_total`
   - If missing for >15m, check EventBridge rule for the provider probe.
2) **Check ops provider health**
   - `GET /api/v1/ops/provider-health` (admin) — returns health for all providers
   - Look for stale corridors, last attempt errors, and quote ages.
3) **Check latest quotes**
   - `SELECT corridor_id, MAX(collected_at) FROM silver.quote_record WHERE provider_id = $1 GROUP BY corridor_id;`
4) **Check queue pressure**
   - SQS depth/age for ingest fanout queues.

## Root-cause triage
- **Auth/session failure**: provider login expired or blocked.
- **HTML/API changes**: scraper/probe error code spike.
- **Network egress**: proxy or NAT issue.

## Mitigations
- Temporarily stoplist provider in `silver.rights_matrix` or disable `allowed_collect`.
- Lower cadence or remove provider from tier-0 corridors while investigating.
- If widespread, pause ingest to avoid bad data flooding.

## Recovery validation
- Probe success for 2 consecutive runs.
- Provider coverage SLO back to >= 3.
- Freshness SLO within threshold.

## Post-incident
- Add provider-specific guardrails if recurrent.
- Update `HEALTH_CORRIDORS` if the corridor set is unrealistic.
