# LLM Circuit Breaker — Diagnosis & Recovery

The agent system uses a 3-state circuit breaker (`backend/plane-b/src/agents/llm-circuit-breaker.ts`) to protect against sustained LLM provider outages. When tripped, all agent repair proposals stop.

## How It Works

| State | Behavior |
|-------|----------|
| **CLOSED** | Normal operation — LLM calls proceed |
| **OPEN** | All LLM calls return `[LLM circuit open]` sentinel — no real calls made |
| **HALF_OPEN** | One probe call allowed; success → CLOSED, failure → OPEN again |

**Thresholds** (from `CircuitBreaker` config):
- Opens after **5 consecutive failures** (`openAfterFailures: 5`)
- Stays open for **120 seconds** (`openForMs: 120_000`)
- Auto-transitions to HALF_OPEN after cooldown elapses
- All agents share a **single global instance** (`llmCircuitBreaker` singleton)

## Symptoms

- Agent repair proposals stop producing patches
- `patch-proposer` returns `[LLM circuit open]` as the proposal content
- CloudWatch metric: `circuit_breaker_state_change` (dimension `provider=llm_agent`)
- Log entries: `llm_circuit_breaker_opened`, `llm_circuit_breaker_half_open`

## Diagnosis

1. Check CloudWatch for `circuit_breaker_state_change` events:
   ```
   Namespace: RemitScout/Agents
   MetricName: circuit_breaker_state_change
   Dimension: provider=llm_agent
   ```

2. Check agent action logs for sentinel responses:
   ```sql
   SELECT * FROM silver.agent_action
   WHERE action_type = 'patch_proposal'
   AND details->>'content' = '[LLM circuit open]'
   ORDER BY created_at DESC LIMIT 10;
   ```

3. Verify LLM provider status:
   - Anthropic: https://status.anthropic.com
   - AWS Bedrock: Check AWS Health Dashboard

## Recovery

1. **Wait for auto-recovery** (most common) — after 120s cooldown, circuit moves to HALF_OPEN. If the next LLM call succeeds, it closes automatically.

2. **Check LLM provider** — if Anthropic/Bedrock is down, the circuit is protecting you. Wait for provider recovery.

3. **Force reset** — restart the agent orchestrator ECS task. The circuit breaker is in-memory and resets on process restart.
   ```bash
   aws ecs update-service --cluster remit-scout-<env> --service agent-orchestrator --force-new-deployment
   ```

4. **Verify recovery** — after reset, check that new `agent_action` entries show real LLM content (not `[LLM circuit open]`).

## Related

- `backend/plane-b/src/agents/llm-circuit-breaker.ts` — circuit breaker singleton
- `backend/plane-b/src/agents/llm-client.ts` — wraps all LLM calls with the breaker
- `backend/shared/circuit-breaker.ts` — generic CircuitBreaker class
- `docs/runbooks/agent-operations.md` — general agent operations
