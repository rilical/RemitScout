# Agent Operations Runbook

Operational procedures for the Remit-Scout self-healing agent pipeline.

## Architecture Overview

```
Collectors → silver.observation → FailureDetector → FailureBundle
  → Orchestrator dispatch_queue → PatchProposer → PatchValidator → PatchDeployer → GitHub PR
  → StressResponder → cadence overrides
```

**Key services:**
- `agent-orchestrator` — ECS Fargate task, singleton, polls `silver.dispatch_queue`
- `stress-responder` — ECS Fargate task, polls `agent-stress` SQS queue
- `normalization-worker` — ECS Fargate task, polls normalization SQS queue

## Health Checks

### E2E Pipeline Health

```bash
pnpm tsx backend/scripts/e2e-agent-health-check.ts
pnpm tsx backend/scripts/e2e-agent-health-check.ts --lookback-hours=2
```

Checks: observations, failure bundles, dispatch queue activity, agent actions, detection cycles, knowledge chunks, normalization factors.

### Orchestrator Health Snapshot

The orchestrator ECS task exposes health at port 8080:

```bash
# Liveness
curl http://<orchestrator-host>:8080/health

# Orchestrator-specific metrics (JSON)
curl http://<orchestrator-host>:8080/metrics
```

Response includes: `running`, `activeJobs`, `registeredHandlers`, `lastDetectionCycleAt`, `detectionCycleCount`, `totalBundlesRouted`, `uptimeMs`.

### CloudWatch Metrics

Namespace: `RemitScout/Agents`

| Metric | Source | Expected |
|--------|--------|----------|
| `detection_cycle_count` | Orchestrator | > 0 every minute |
| `failure_bundle_created` | Orchestrator | Variable (0 if healthy) |
| `repair_proposal_generated` | PatchProposer | Matches bundle count |
| `tool_request_total` | ToolGateway | > 0 when agents active |
| `tool_request_blocked` | ToolGateway | Should be low |
| `knowledge_retrieval_total` | KnowledgePlane | > 0 during repairs |
| `knowledge_retrieval_insufficient` | KnowledgePlane | Should be low |
| `stress_escalation_incident` | StressResponder | 0 unless corridor stress |

## Common Operations

### Manually Trigger Failure Detection

Insert a dispatch item to force a detection cycle:

```sql
INSERT INTO silver.dispatch_queue (dispatch_id, queue_name, module_id, priority, payload, status, scheduled_at)
VALUES (gen_random_uuid(), 'agent-detect', NULL, 5, '{}', 'pending', NOW());
```

### Quarantine a Module

Prevent the failure detector from processing a specific module:

```sql
UPDATE silver.module_registry
SET status = 'quarantined', updated_at = NOW()
WHERE module_id = '<module_id>';
```

### Unquarantine a Module

```sql
UPDATE silver.module_registry
SET status = 'active', updated_at = NOW()
WHERE module_id = '<module_id>';
```

### Check Active Quarantines

```sql
SELECT module_id, provider_id, quarantined_at, quarantine_reason
FROM silver.module_registry
WHERE status = 'quarantined'
ORDER BY quarantined_at DESC;
```

### Review Pending Repairs

```sql
SELECT aa.action_id, aa.agent_id, aa.action_type, aa.status, aa.created_at,
       fb.module_id, fb.provider_id, fb.category, fb.severity
FROM silver.agent_action aa
JOIN silver.failure_bundle fb ON fb.bundle_id = (aa.context->>'bundleId')::text
WHERE aa.status IN ('proposed', 'validating')
ORDER BY aa.created_at DESC
LIMIT 20;
```

### Approve a Repair

```sql
UPDATE silver.agent_action
SET status = 'approved', updated_at = NOW()
WHERE action_id = '<action_id>';
```

### Reject a Repair

```sql
UPDATE silver.agent_action
SET status = 'rejected', rejection_reason = '<reason>', updated_at = NOW()
WHERE action_id = '<action_id>';
```

### View Tool Gateway Audit Log

```sql
SELECT request_id, agent_id, tool_type, decision, created_at, error_message
FROM silver.tool_gateway_audit
ORDER BY created_at DESC
LIMIT 50;
```

### Check Cadence Overrides

```sql
SELECT dispatch_id, module_id, payload->>'corridorId' AS corridor,
       payload->>'intervalMs' AS interval_ms, payload->>'expiresAt' AS expires_at
FROM silver.dispatch_queue
WHERE queue_name = 'cadence-override' AND status = 'pending'
ORDER BY created_at DESC;
```

### Clear Cadence Overrides

```sql
UPDATE silver.dispatch_queue
SET status = 'completed', completed_at = NOW(), updated_at = NOW()
WHERE queue_name = 'cadence-override' AND status = 'pending';
```

## Incident Response

### Agent Orchestrator Not Cycling

**Symptoms:** `detection_cycle_count` metric flat, no recent dispatch queue activity.

1. Check ECS task status: `aws ecs describe-services --cluster remit-scout --services agent-orchestrator`
2. Check CloudWatch logs for `orchestrator_poll_error` or `orchestrator_disabled`
3. Verify `AGENT_ORCHESTRATOR_ENABLED=true` in task definition
4. Check database connectivity via health endpoint

### Tool Gateway Blocking All Requests

**Symptoms:** `tool_request_blocked` spike, Slack `#agent-ops` flooded with violation alerts.

1. Check `silver.tool_gateway_audit` for the blocked requests
2. Verify agent config: `SELECT * FROM silver.agent_config WHERE agent_id = '<agent>'`
3. Check rate limits have not been exhausted
4. Temporarily disable the agent if needed via `AGENT_ORCHESTRATOR_ENABLED=false`

### Stress Responder Backlog

**Symptoms:** SQS `agent-stress` queue depth growing, cadence overrides not being applied.

1. Check ECS task status for `stress-responder`
2. Check CloudWatch logs for `stress_responder_process_error`
3. Verify queue URL config: `AGENT_STRESS_QUEUE_URL`
4. Check SQS dead-letter queue for failed messages

### Knowledge Plane Empty

**Symptoms:** `knowledge_retrieval_insufficient` metric high, patch proposals lack context.

1. Run the seeding script: `pnpm tsx backend/scripts/seed-knowledge-plane.ts`
2. Verify: `SELECT source_type, COUNT(*) FROM silver.knowledge_chunk GROUP BY source_type`
3. Expected: ~48 rows (24 providers x 2 files each)

## Slack Notifications

Channel: `#agent-ops`

| Event | Type | Action Required |
|-------|------|----------------|
| Repair proposed | `repair_proposed` | Review PR if confidence < high |
| Repair deployed | `repair_deployed` | Verify in staging |
| Stress escalation | `stress_escalation` | Check corridor health |
| Tool gateway violation | `tool_gateway_violation` | Review blocked request |
| Orchestrator health | `orchestrator_health` | Check if cycling resumed |
| Knowledge gap | `knowledge_gap` | Re-run seed script |

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `AGENT_ORCHESTRATOR_ENABLED` | orchestrator | Enable/disable the orchestrator |
| `AGENT_FAILURE_QUEUE_URL` | orchestrator | SQS queue for failure bundles |
| `AGENT_STRESS_QUEUE_URL` | stress-responder | SQS queue for stress signals |
| `NORMALIZATION_QUEUE_URL` | normalization-worker | SQS queue for factor extraction |
| `NORMALIZATION_QUEUE_MODE` | normalization-worker | `queue` or `off` |
| `AGENT_SLACK_WEBHOOK_URL` | all agents | Slack incoming webhook for #agent-ops |
| `ANTHROPIC_API_KEY` | patch-proposer | LLM API key for proposal generation |
| `AGENT_LLM_MODEL` | patch-proposer | Default: `claude-sonnet-4-20250514` |
| `AGENT_GITHUB_TOKEN` | patch-deployer | GitHub token for PR creation |
| `GITHUB_REPO_OWNER` | patch-deployer | Repository owner |
| `GITHUB_REPO_NAME` | patch-deployer | Repository name |
