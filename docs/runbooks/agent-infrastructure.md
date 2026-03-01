# Agent Infrastructure Operations Runbook

## Overview

The Remit-Scout agent infrastructure consists of 10 agent classes managed by the orchestrator:
- **Orchestrator** — schedules detection cycles, routes failure bundles
- **Failure Detector** — detects drift, creates failure bundles
- **Patch Proposer** — generates repair proposals via LLM or heuristics
- **Patch Validator** — runs contract tests against proposals
- **Patch Deployer** — creates PRs for approved patches
- **Stress Responder** — handles corridor stress escalation
- **Knowledge Plane** — semantic search for agent context
- **Tool Gateway** — policy-enforced tool execution
- **LLM Client** — manages LLM inference calls
- **Agent Config** — resolves per-agent configuration

## Health Checks

### Orchestrator Health
```bash
# Check orchestrator detection cycles (should be >0 per 10 min)
aws cloudwatch get-metric-statistics \
  --namespace RemitScout/Agents \
  --metric-name detection_cycle_count \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 600 --statistics Sum \
  --dimensions Name=environment,Value=staging Name=service,Value=remit-scout
```

### Failure Bundle Rate
```bash
# Check failure bundle creation rate (spike indicates provider issues)
aws cloudwatch get-metric-statistics \
  --namespace RemitScout/Agents \
  --metric-name failure_bundle_created \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 --statistics Sum \
  --dimensions Name=environment,Value=staging Name=service,Value=remit-scout
```

## Alarm Responses

### OrchestratorDetectionStall (CRITICAL)
**Meaning:** No detection cycles completed in 10 minutes.
1. Check ECS task status: `aws ecs describe-tasks --cluster remit-scout-staging ...`
2. Check agent worker logs for errors
3. Verify database connectivity (orchestrator requires pg pool)
4. If task is crashing, check `agent-failure` DLQ for error payloads
5. Restart: redeploy agent worker ECS task

### FailureBundleBurst (WARNING)
**Meaning:** >20 failure bundles in 15 minutes — widespread provider issues.
1. Check which providers are affected: query `silver.failure_bundle` for recent bundles
2. Check if external event (provider outage, network issue) is the cause
3. If legitimate provider issue, no action needed — stress responder will adjust cadence
4. If false positive, check failure detector thresholds

### ToolGatewayPolicyViolations (CRITICAL)
**Meaning:** >10 blocked tool requests in 5 minutes.
1. Check which agent is generating blocked requests
2. Verify agent policy overrides in `tool-gateway.ts` are correct
3. If legitimate need, update policy override (requires PR)
4. If suspicious, investigate agent behavior — possible misconfigured repair

### CorridorStressIncident (CRITICAL)
**Meaning:** A corridor has reached incident-level sustained stress.
1. Identify affected corridor from stress metrics
2. Check provider health for that corridor's providers
3. Review stress responder cadence adjustments (should have already reduced collection frequency)
4. If provider is truly down, consider manual quarantine
5. Escalation auto-resets when stress subsides

### KnowledgePlaneRetrievalQuality (WARNING)
**Meaning:** >50% of knowledge retrievals are insufficient.
1. Check knowledge chunk count: `SELECT COUNT(*) FROM silver.knowledge_chunk`
2. If low count, run knowledge seeding (see below)
3. If chunks exist but relevance is low, check search query quality
4. Consider re-indexing provider sources

## Knowledge Plane Seeding

To index all provider source code into the knowledge plane:

```sql
-- Check current knowledge chunk inventory
SELECT source_type, COUNT(*) as chunk_count
FROM silver.knowledge_chunk
GROUP BY source_type
ORDER BY chunk_count DESC;
```

Provider sources are indexed automatically by `knowledge-plane.indexProviderSources()` when:
- A new provider is added
- A repair is successfully applied
- Manual seeding is triggered

## Failure Detector Threshold Tuning

Default thresholds (`backend/shared/types/failure-bundle.ts`):
- `consecutiveFailureThreshold`: 5 (bundle created after 5 consecutive failures)
- `parseErrorRateThreshold`: 0.3 (30% parse error rate triggers bundle)
- `rateWindowMs`: 3,600,000 (1 hour window for rate calculation)
- `minObservationsForRate`: 10 (minimum observations before rate is meaningful)

To adjust thresholds for a specific provider, update the provider's agent config.

## Repair Pipeline Testing

To test the repair pipeline end-to-end:
1. Inject a parse failure: modify a provider's parse.ts to return invalid data
2. Wait for failure detector to create a bundle (5 consecutive failures, ~5-10 min)
3. Verify bundle appears in `silver.failure_bundle`
4. Verify patch proposer generates a proposal
5. Verify patch validator runs contract tests
6. Verify patch deployer creates a PR (if auto-deploy is enabled)
7. Revert the injected failure

## Tool Gateway Audit

Periodic audit checklist:
- [ ] All agent policy overrides match documented allowlists in security.md
- [ ] Rate limits are appropriate for current load
- [ ] File path safety validation covers all sensitive directories
- [ ] No new tool types added without policy review
- [ ] Audit log shows no unauthorized access patterns
