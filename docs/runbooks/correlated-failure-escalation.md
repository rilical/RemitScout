# Correlated Failure Escalation — Response Runbook

When the agent orchestrator detects >= 10 simultaneous failure bundles in a single detection cycle, it treats this as a platform-wide incident and escalates instead of attempting autonomous repair.

## How It Works

**Threshold:** `CORRELATED_FAILURE_THRESHOLD = 10` (in `backend/plane-b/src/agents/orchestrator.ts`)

**Detection flow:**
1. Orchestrator acquires `pg_try_advisory_xact_lock(999001)` to prevent duplicate scans
2. Queries for pending failure bundles
3. If bundle count >= 10 → **escalation path** (no repair)
4. If bundle count < 10 → normal repair path (top 6 by severity via `MAX_BUNDLES_PER_CYCLE`)

**On escalation:**
- CloudWatch metric: `correlated_failure_escalation` (value = bundle count, namespace `RemitScout/Agents`)
- Slack notification: severity `critical`, type `correlated_failure_escalation`
- Log entry: `correlated_failure_detected` with `action: escalating_not_repairing`
- Autonomous repair is **skipped entirely** for this cycle

## Symptoms

- Slack critical alert: "Correlated failure: N bundles detected (threshold: 10)"
- No repair PRs generated despite multiple providers failing
- CloudWatch alarm fires on `correlated_failure_escalation` (sum >= 1 in a 5-minute period, routed to critical action)

## Diagnosis

1. **Identify scope** — how many providers are affected?
   ```sql
   SELECT module_id, failure_layer, severity, created_at
   FROM silver.failure_bundle
   WHERE status = 'pending'
   ORDER BY created_at DESC;
   ```

2. **Classify the event:**

   | Pattern | Likely Cause | Response |
   |---------|-------------|----------|
   | All providers failing | Platform issue (DB, network, proxy) | Fix infrastructure first |
   | Many providers, same failure layer | Shared dependency (e.g., Playwright, Redis) | Check shared services |
   | Providers in same region/type | Regional provider outage | Wait for provider recovery |
   | Mix of failure types | Coincidental — may be safe to repair | Lower threshold temporarily |

3. **Check infrastructure health:**
   ```bash
   # ECS service health
   aws ecs describe-services --cluster remit-scout-<env> --services plane-b-ingest

   # Database connectivity
   psql $DATABASE_URL -c "SELECT 1;"

   # Redis connectivity
   redis-cli -u $REDIS_URL ping
   ```

## Resolution

1. **Fix root cause** if it's a platform issue (DB, network, shared service)

2. **Wait for next cycle** — once the root cause is resolved, the next orchestrator detection cycle will find fewer bundles and proceed with normal repair

3. **Manual bundle cleanup** (if bundles are stale/invalid):
   ```sql
   UPDATE silver.failure_bundle
   SET status = 'rejected', rejection_reason = 'manual_cleanup_correlated_event'
   WHERE status = 'pending'
   AND created_at < NOW() - INTERVAL '2 hours';
   ```

4. **Verify recovery** — confirm the next detection cycle runs normally:
   ```sql
   SELECT * FROM silver.agent_action
   WHERE action_type = 'detection_cycle'
   ORDER BY created_at DESC LIMIT 5;
   ```

## Related

- `backend/plane-b/src/agents/orchestrator.ts` — orchestrator with threshold logic
- `docs/runbooks/agent-operations.md` — general agent operations
- `docs/runbooks/provider-outage.md` — provider-specific outage handling
