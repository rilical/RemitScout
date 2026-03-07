# Agent Spend Alerting — Monitoring & Containment

The tool gateway tracks per-agent LLM inference spend and alerts at 80% of a $50 per-agent budget cap.

## How It Works

**Implementation:** `backend/plane-b/src/agents/tool-gateway.ts`

| Parameter | Value |
|-----------|-------|
| Budget cap | `MAX_SPEND_PER_AGENT_USD = $50` per agent |
| Warning threshold | 80% ($40) — fires once on first crossing |
| Cost estimate | `$0.01` per `llm_inference` call (conservative fixed estimate) |
| Tracking scope | Per-agent, in-memory (resets on process restart) |
| Cost-bearing tools | `llm_inference`, `http_fetch` (checked against cap) |

**Alert flow:**
1. Each `llm_inference` call adds $0.01 to the agent's cumulative spend
2. At $40 (80%): CloudWatch metric `agent_spend_warning` + Slack warning (fires once)
3. At $50 (100%): All cost-bearing tool requests for that agent are **blocked** with denial

## Symptoms

- Slack warning: "Agent 'patch-proposer' reached 80% spend ($40.00/$50.00)"
- Agent repairs fail with denial reason: "spend limit exceeded"
- CloudWatch metric: `agent_spend_warning` in `RemitScout/Agents` namespace

## Diagnosis

1. **Check which agent hit the cap:**
   ```sql
   SELECT agent_id, action_type, COUNT(*), MAX(created_at)
   FROM silver.agent_action
   WHERE action_type = 'tool_request'
   AND details->>'toolType' = 'llm_inference'
   AND created_at > NOW() - INTERVAL '24 hours'
   GROUP BY agent_id, action_type;
   ```

2. **Identify runaway repair cycles** — an agent repeatedly failing and retrying:
   ```sql
   SELECT agent_id, details->>'moduleId' as module, COUNT(*) as attempts
   FROM silver.agent_action
   WHERE action_type = 'patch_proposal'
   AND created_at > NOW() - INTERVAL '24 hours'
   GROUP BY agent_id, details->>'moduleId'
   ORDER BY attempts DESC;
   ```

3. **Check CloudWatch:**
   ```
   Namespace: RemitScout/Agents
   MetricName: agent_spend_warning
   ```

## Containment

1. **Pause the orchestrator** to stop new repair cycles:
   ```bash
   aws ecs update-service --cluster remit-scout-<env> --service agent-orchestrator --desired-count 0
   ```

2. **Quarantine noisy modules** that are burning budget without successful repairs:
   ```sql
   UPDATE silver.module_registry
   SET quarantine_type = 'schema_drift', quarantined_at = NOW()
   WHERE module_id = '<problem-module>';
   ```

3. **Restart to reset spend counter** — spend tracking is in-memory:
   ```bash
   aws ecs update-service --cluster remit-scout-<env> --service agent-orchestrator --force-new-deployment
   ```

4. **Reduce blast radius** — lower `MAX_BUNDLES_PER_CYCLE` (currently 6) via env var if available, or patch and redeploy.

## Important Notes

- Spend tracking is **in-memory** — resets on ECS task restart or redeployment
- The $0.01/call estimate is conservative; actual Anthropic/Bedrock costs vary by model and token count
- The cap is per-agent (e.g., `patch-proposer` has its own $50 budget separate from `orchestrator`)

## Related

- `backend/plane-b/src/agents/tool-gateway.ts` — spend tracking and enforcement
- `docs/runbooks/llm-circuit-breaker.md` — circuit breaker (protects against provider outages)
- `docs/runbooks/cost-spike.md` — broader AWS cost spike response
- `docs/runbooks/agent-operations.md` — general agent operations
