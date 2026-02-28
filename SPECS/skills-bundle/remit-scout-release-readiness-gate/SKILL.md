---
name: remit-scout-release-readiness-gate
description: Automated pre-deploy gate that blocks releases if any system is unhealthy — DLQ > 0, alarms firing, providers dead, Gold stale, tests failing, migrations pending, or env drift detected. Replaces the manual launch-readiness-issues.md checklist.
---

# Remit-Scout Release Readiness Gate

## Overview

Hard automated gate that must pass before any deploy to staging or prod. Replaces the manual `launch-readiness-issues.md` checklist with deterministic checks. If any check fails, the deploy is blocked with a clear reason and remediation.

## Preconditions
- AWS CLI with target environment profile
- Database read access
- Git access for test execution
- All other skills installed (this skill reads their verdicts)

## Gate checks (all must pass)

### Gate 1: Tests pass

```bash
pnpm -C backend test --run
```

Fail if exit code != 0.

### Gate 2: Lint and typecheck clean

```bash
pnpm -C backend lint && pnpm -C backend typecheck
```

### Gate 3: DLQ depth = 0 (all queues)

```bash
FAIL=0
for queue in quote-refresh-dlq fx-rate-refresh-dlq export-job-dlq alert-evaluation-dlq ingest-fanout-dlq ingest-fanout-tier2-dlq gold-live-dlq notifications-dlq ops-alerts-dlq; do
  DEPTH=$(aws sqs get-queue-attributes \
    --queue-url "$(aws sqs get-queue-url --queue-name "${STACK_PREFIX}-${queue}" --query QueueUrl --output text 2>/dev/null)" \
    --attribute-names ApproximateNumberOfMessages \
    --query 'Attributes.ApproximateNumberOfMessages' --output text 2>/dev/null)
  if [ "$DEPTH" != "0" ] && [ -n "$DEPTH" ]; then
    echo "BLOCKED: ${queue} depth=${DEPTH}"
    FAIL=1
  fi
done
```

### Gate 4: No CloudWatch alarms in ALARM state

```bash
ALARM_COUNT=$(aws cloudwatch describe-alarms --state-value ALARM \
  --query "length(MetricAlarms[?contains(AlarmName,'remit-scout-${ENV}')])" --output text)
if [ "$ALARM_COUNT" != "0" ]; then
  echo "BLOCKED: ${ALARM_COUNT} alarms in ALARM state"
fi
```

### Gate 5: No dead providers (all production providers have quotes in last 12h)

```sql
SELECT p.slug
FROM silver.provider p
JOIN silver.rights_matrix rm ON rm.provider_id = p.id
WHERE rm.status = 'production' AND rm.stoplist_status = 'active' AND rm.allowed_b2b = true
  AND NOT EXISTS (
    SELECT 1 FROM silver.quote_record qr
    WHERE qr.provider_id = p.id AND qr.created_at > NOW() - INTERVAL '12 hours'
  )
GROUP BY p.slug;
```

Any result = BLOCKED.

### Gate 6: Gold indices not stale

```sql
SELECT index_type, MAX(computed_at) AS latest, EXTRACT(EPOCH FROM (NOW() - MAX(computed_at))) / 3600 AS age_hours
FROM gold.indices_latest
GROUP BY index_type
HAVING EXTRACT(EPOCH FROM (NOW() - MAX(computed_at))) / 3600 > 8;
```

Any result = BLOCKED (indices older than 8 hours).

### Gate 7: FX rates fresh

```sql
SELECT COUNT(*) AS stale_pairs
FROM gold.fx_rates
WHERE updated_at < NOW() - INTERVAL '6 hours';
```

If stale_pairs > 0, BLOCKED.

### Gate 8: DB migrations in sync

```bash
LATEST_FILE=$(ls -1 backend/db/migrations/ | sort | tail -1 | sed 's/_.*//')
# Compare against applied migration version in target env
APPLIED=$(psql "$DB_URL" -t -c "SELECT MAX(version) FROM schema_migrations;" 2>/dev/null | tr -d ' ')
if [ "$LATEST_FILE" != "$APPLIED" ]; then
  echo "BLOCKED: Migration drift — file=${LATEST_FILE} applied=${APPLIED}"
fi
```

### Gate 9: No rate anomalies (last hour)

Run Rule 5 from `remit-scout-rate-anomaly-detector`:

```sql
SELECT COUNT(*) AS anomalous_providers
FROM (
  SELECT p.slug, COUNT(*) AS anomalous
  FROM silver.quote_record qr
  JOIN silver.provider p ON p.id = qr.provider_id
  JOIN (SELECT corridor_id, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY implied_fx_rate) AS med, STDDEV(implied_fx_rate) AS std
        FROM silver.quote_record WHERE created_at > NOW() - INTERVAL '7 days' AND status='ok' AND implied_fx_rate > 0 GROUP BY corridor_id HAVING COUNT(*) >= 10) b ON b.corridor_id = qr.corridor_id
  WHERE qr.created_at > NOW() - INTERVAL '1 hour' AND qr.status = 'ok' AND b.std > 0
    AND ABS(qr.implied_fx_rate - b.med) / b.std > 5.0
  GROUP BY p.slug HAVING 100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM silver.quote_record WHERE created_at > NOW() - INTERVAL '1 hour' AND provider_id = p.id), 0) > 20
) compromised;
```

If > 0, BLOCKED.

### Gate 10: Sweep run completing

```sql
SELECT COUNT(*) AS stuck_runs
FROM silver.b2b_sweep_run
WHERE status = 'running' AND enqueued_at < NOW() - INTERVAL '60 minutes';
```

### Gate 11: Environment drift (staging→prod only)

Run `remit-scout-env-drift-detector` quick checks. Block if MAJOR_DRIFT.

### Gate 12: Smoke test passes

```bash
SMOKE_BASE_URL="https://api-${ENV}.remit-scout.com" pnpm -C backend ci:integration-smoke
```

## Output template

```
## Release Readiness Gate — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Target: ${ENV} deploy

| # | Gate | Status | Details |
|---|------|--------|---------|
| 1 | Tests | PASS/FAIL | <exit code> |
| 2 | Lint + Typecheck | PASS/FAIL | <error count> |
| 3 | DLQ Depth | PASS/FAIL | <queue: depth> |
| 4 | CloudWatch Alarms | PASS/FAIL | <alarm count> |
| 5 | Provider Health | PASS/FAIL | <dead providers> |
| 6 | Gold Freshness | PASS/FAIL | <stale index types> |
| 7 | FX Rates | PASS/FAIL | <stale pairs> |
| 8 | Migrations | PASS/FAIL | <file vs applied> |
| 9 | Rate Anomalies | PASS/FAIL | <compromised providers> |
| 10 | Sweep Runs | PASS/FAIL | <stuck runs> |
| 11 | Env Drift | PASS/FAIL | <drift level> |
| 12 | Smoke Test | PASS/FAIL | <failed checks> |

### Verdict: DEPLOY_APPROVED | DEPLOY_BLOCKED
### Blockers: (list of failed gates with remediation steps)
```

## Central report integration

Write output to **Section 17: Release Gate** in `ops/reports/daily-ops-report.md` (only when triggered).

## When to run
- **Before every staging deploy:** Hard gate
- **Before every prod deploy:** Hard gate
- **On-demand:** Pre-release validation
- **CI/CD integration:** Add as a GitHub Actions job
