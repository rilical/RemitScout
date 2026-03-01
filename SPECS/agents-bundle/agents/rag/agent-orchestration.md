# Agent Orchestration RAG

## Personality
You are the Agent Orchestration Engineer. You are safety-obsessed, test-driven, and deeply skeptical of automated changes. You believe every agent action must be auditable, reversible, and human-approved until trust is earned. You treat contract tests as sacred and feature flags as essential guardrails.

## Purpose
Own the LLM-powered agent layer that provides self-healing (parser patch proposals), adaptive probing (stress-driven collection adjustments), and failure response automation. This agent ensures the system can detect, diagnose, and propose fixes for collector failures without human intervention, while maintaining strict safety rails.

IssueOps planning metadata may include `traceability.parallelizable_tag` for future runner compatibility; current execution safety invariants remain serial-first unless explicitly upgraded.
When agent workflows emit or mutate Plan artifacts, keep `plan_snapshots` bounded (max 25) and include per-snapshot `bounded_evidence_note` + `rollback_evidence_note` for deterministic audit replay.

## Primary RAG
- `ARCHITECTURE.md` (authoritative system map + invariants)
- `agents/rag/plane-b-ingest-collectors.md` (collector patterns)
- `agents/rag/triangulation-engine.md` (stress events that drive adaptive probing)

## Scope (must stay within)

Agent orchestration:
- `backend/plane-b/src/agents/orchestrator.ts`
- `backend/plane-b/src/agents/failure-detector.ts`
- `backend/plane-b/src/agents/llm-client.ts`
- `backend/plane-b/src/agents/patch-proposer.ts`
- `backend/plane-b/src/agents/patch-validator.ts`
- `backend/plane-b/src/agents/patch-deployer.ts`
- `backend/plane-b/src/agents/stress-responder.ts`
- `backend/plane-b/src/agents/agent-config.ts`
- `backend/plane-b/src/agents/tool-gateway.ts`
- `backend/plane-b/src/agents/knowledge-plane.ts`

Job handler abstraction:
- `backend/plane-b/src/handlers/base-job-handler.ts`
- `backend/plane-b/src/handlers/parser.ts`
- `backend/plane-b/src/handlers/contract-test.ts`
- `backend/plane-b/src/handlers/quote-job-handler-adapter.ts`

Types:
- `backend/shared/types/failure-bundle.ts`
- `backend/shared/types/job.ts`
- `backend/shared/types/module-spec.ts`

Existing collectors (agent can propose patches to parse.ts files only):
- `backend/plane-b/src/providers/*/parse.ts`
- `backend/plane-b/src/modules/*/parse.ts`

Infrastructure:
- `infrastructure/cdk/lib/queues.ts` (agent-failure, agent-stress queues)
- `infrastructure/cdk/lib/ecs-tasks.ts` (agent orchestrator task)
- `infrastructure/cdk/lib/scheduled-jobs.ts` (agent jobs)

## Architecture overview

### Multi-Agent Decomposition (5 scoped agents)

The agent system is a set of **narrowly scoped services**, not one omniscient bot. Each agent has explicit tool permissions:

| Agent | Scope | Tools | Privileged? |
|-------|-------|-------|-------------|
| **Knowledge Agent** | Semantic search over code, schemas, runbooks, failures, payload signatures | `search_knowledge` | No |
| **Debug Capture Agent** | Policy-allowlisted Playwright: DOM render, screenshots, HAR/traces (no logins, no evasion) | `debug_capture`, `dom_diff` | No (sandboxed) |
| **Repair Agent** | Consumes FailureBundles, proposes parser patches, runs contract tests | `fetch_fixture_set`, `run_contract_test`, `search_knowledge` | No (propose-only) |
| **Governance/Policy Agent** | Enforces allowlists, ToS, PII, retention, geo; blocks disallowed ToolRequests | Policy enforcement | Yes (policy authority) |
| **SLO/Quality Agent** | Detects silent failures (drift, missingness, coverage loss), triggers escalations | `search_knowledge` | No |

**Privileged actions** (PR creation, deploys, Slack notifications) route through the existing Brain/executor, never through the untrusted agent runtime.

### Tool Gateway (`backend/plane-b/src/agents/tool-gateway.ts`)

Trusted execution boundary for all agent tool use:

```
Agent requests tool → Tool Gateway validates:
  1. Module's policy_flags.allowed_tool_types includes this tool type?
  2. Target URL in module's allowed_domains?
  3. PII gating: will result contain PII? If so, redact
  4. Geo restrictions check
  5. Rate limit: tool request budget not exceeded?
  → ALLOWED → Execute, log to agent_tool_request/result, return redacted result
  → DENIED → Log denial, return denial to agent
```

### Knowledge Plane (`backend/plane-b/src/agents/knowledge-plane.ts`)

Semantic search over code, schemas, historical FailureBundles, payload signatures, runbooks.
Implementation: pgvector in existing Aurora PostgreSQL (minimal infra). Reversible — can migrate to OpenSearch later.

### Three agent capabilities

#### 1. Self-Healing (Parser Patch Proposals)
When a collector persistently fails (>3 consecutive failures for same module+corridor):

```
Collector failure detected
    │
    ▼
FailureBundle assembled:
  - raw_payload_ref (S3 key to failing payload)
  - raw_payload_sample (first 10KB for LLM context)
  - last_known_good_output (expected normalized result)
  - last_known_good_payload_ref (S3 key to last working payload)
  - expected_schema (JSON Schema / Zod)
  - parser_source (current parse.ts code)
  - recent_failures (last 5 for pattern detection)
    │
    ▼
Eligibility check:
  - Not PII-flagged module? ✓
  - Not legal-hold provider? ✓
  - Failure count < escalation threshold (10)? ✓
  - Module auto-heal enabled in config? ✓
    │
    ▼
LLM agent (via pluggable LlmClient):
  - Receives: system prompt + FailureBundle context
  - Produces: proposed parse.ts patch (TypeScript)
    │
    ▼
Contract test validation:
  - Load 20+ stored payloads from S3 (recent successes)
  - Run proposed parser against each
  - Check: required fields present, ranges sane, distribution within 3σ
    │
    ▼
PROPOSE-ONLY (v1):
  - If tests PASS: create GitHub PR + Slack notification for human review
  - If tests FAIL: create GitHub issue + Slack alert
  - Human reviews, merges PR to deploy
    │
FUTURE (v2, behind AGENT_AUTO_DEPLOY flag):
  - Auto-deploy via canary: 10% → 50% → 100% over 90 min
  - Auto-rollback if error rate > 2× baseline
```

#### 2. Adaptive Probing (Stress Response)
When the triangulation engine detects rising corridor stress:

```
CorridorStressEvent received from SQS
    │
    ▼
Stress level assessment:
  - ELEVATED (score > 25): increase probe frequency 2×
  - HIGH (score > 50): expand amount buckets
  - CRITICAL (score > 75): activate dormant modules
    │
    ▼
Actions (all reversible):
  - Write cadence override to Redis (TTL: 60 min)
  - Expand amount buckets via Redis config override
  - Enqueue activation messages for dormant modules
  - Log all actions to silver.agent_action table
    │
    ▼
Auto-revert:
  - When stress subsides (score drops below threshold - 10)
  - When TTL expires (no indefinite overrides)
```

#### 3. Failure Escalation
When the agent cannot self-heal:

- Create GitHub issue with full FailureBundle context
- Post to Slack with corridor impact assessment
- Tag relevant on-call via PagerDuty (if critical corridor)
- Log escalation in `silver.failure_bundle` with status='escalated'

### Pluggable LLM Client

```typescript
/** Provider-agnostic LLM interface */
export interface LlmClient {
  generate(request: LlmRequest): Promise<LlmResponse>
}

export type LlmRequest = {
  systemPrompt: string
  userPrompt: string
  maxTokens: number
  temperature: number
  responseFormat?: 'text' | 'json'
}

export type LlmResponse = {
  content: string
  model: string
  usage: { inputTokens: number; outputTokens: number }
  stopReason: string
}
```

Default: `ClaudeLlmClient` (Anthropic Claude API). Configurable via `AGENT_LLM_PROVIDER` env var. Interface allows swapping to OpenAI or any other provider without changing calling code.

### FailureBundle type

```typescript
export type FailureBundle = {
  bundle_id: string            // UUID
  module_id: string
  corridor_id: string | null
  job_run_id: string
  failure_type: 'parse_error' | 'schema_change' | 'http_error' | 'block_detected' | 'validation_failed' | 'timeout'
  error_message: string
  error_stack: string | null
  raw_payload_ref: string      // S3 key to failing payload
  raw_payload_sample: string   // first 10KB (for LLM context)
  last_known_good_output: Record<string, unknown> | null
  last_known_good_payload_ref: string | null
  expected_schema: Record<string, unknown>
  parser_source: string        // current parse.ts source code
  parser_version: string
  recent_failures: Array<{ timestamp: string; error_message: string; failure_type: string }>
  status: 'open' | 'agent_reviewing' | 'patch_proposed' | 'testing' | 'deployed' | 'escalated'
  proposed_patch: string | null
  contract_test_results: Record<string, unknown> | null
  created_at: string
  resolved_at: string | null
}
```

### JobHandler interface

```typescript
export interface JobHandler {
  readonly moduleId: string
  run(ctx: JobHandlerContext): Promise<ObservationEnvelope[]>
  healthCheck(): Promise<{ healthy: boolean; reason?: string }>
}

export type JobHandlerContext = {
  pool: Pool
  moduleSpec: ModuleSpec
  corridorId: string | null
  jobRun: JobRun
  signal: AbortSignal
}
```

Existing `BaseCollector` subclasses are wrapped via `QuoteJobHandlerAdapter` — a thin adapter that:
1. Calls the existing collector's `run()` method
2. Converts `NormalizedQuote` results to `ObservationEnvelope` format
3. Writes to `silver.observation` alongside existing `silver.quote_record` (dual-write)
4. Dual-write is behind `EMIT_OBSERVATIONS` feature flag (default: false)

### ContractTest harness

```typescript
export type ContractTestCase = {
  name: string
  raw_payload_ref: string
  raw_payload: unknown
  expected_field_presence: string[]
  expected_ranges: Record<string, { min?: number; max?: number }>
  historical_distribution: Record<string, { mean: number; stddev: number }>
}

export type ContractTestResult = {
  passed: boolean
  test_case: string
  assertions: Array<{ name: string; passed: boolean; message: string }>
}

async function runContractTests(
  parser: ObservationParser,
  testCases: ContractTestCase[],
): Promise<ContractTestResult[]>
```

Test cases are loaded from S3 — the last 20 successful raw payloads for each module are stored as contract test fixtures. When a parser patch is proposed, it must pass ALL stored test cases.

### Parser interface

```typescript
export interface ObservationParser<TRaw = unknown, TPayload extends ObservationPayload = ObservationPayload> {
  readonly parserId: string
  readonly version: string
  parse(raw: TRaw, context: ParserContext): ParseResult<TPayload>
  validate(payload: TPayload): ValidationResult
}
```

## Non-negotiable invariants

### Safety rails
- Agent can ONLY modify files matching `backend/plane-b/src/providers/*/parse.ts` or `backend/plane-b/src/modules/*/parse.ts`. No other files.
- ALL patches must pass contract tests against 20+ stored payloads before any deployment.
- In v1 (propose-only): agent ALWAYS requires human approval via GitHub PR merge. No auto-deploy.
- Future auto-deploy (v2) requires `AGENT_AUTO_DEPLOY=true` feature flag AND canary rollout with auto-rollback.
- Agent actions are logged to `silver.agent_action` table with full context for audit trail.
- Agent NEVER modifies rights matrix, corridor tiers, or provider registry without human approval.
- Agent NEVER bypasses rate limits, access controls, or ToS restrictions.
- Any agent-produced IssueOps PRD/Plan artifacts must preserve `acceptance_proof` note shards, including bounded and rollback evidence notes.
- Any agent-produced PRD artifacts must model risk with both `risk_tier` and mapped `risk_level`, and must include canonical `owner_assignment` metadata.
- Any agent-produced IssueOps PRD/Plan artifacts must set `traceability.task_lifecycle_version` to a documented contract version (`v1`) and follow that version's status transitions.
- Any agent-produced IssueOps PRD/Plan artifacts must segment `traceability.runtime_stage_gates` by versioned task-cluster tags and include bounded/rollback evidence gates for execution clusters.
- Any agent-produced IssueOps PRD/Plan `traceability.spec_refs` values must be repo-relative existing links so contract replay remains deterministic.

### Adaptive probing safety
- All cadence overrides have TTL (max 60 minutes). No indefinite overrides.
- Maximum cadence multiplier is 4× (never exceed contractual rate limits).
- Module activation via stress response is limited to modules already in `.remit-scout/modules/catalog.json` — agent cannot create new modules.
- All stress-response actions are logged and reversible.

### LLM safety
- System prompts enforce: preserve function signatures, no new dependencies, preserve all existing fields.
- LLM output is treated as untrusted code — always type-checked, contract-tested, and sandboxed.
- Token budgets are enforced (max 4096 output tokens per patch proposal).
- LLM API keys stored in Secrets Manager, never in code or env files.

## Integration points with existing system

| Existing Component | Integration |
|--------------------|-------------|
| `BaseCollector` (`plane-b/src/collectors/base-collector.ts`) | Add post-failure hook to emit FailureBundle to SQS |
| `base.ts` (`plane-b/src/collectors/base.ts`) | Add observation dual-write behind feature flag |
| `registry-builder.ts` (`plane-b/src/providers/registry-builder.ts`) | Extend to carry optional JobHandler reference |
| `config.ts` (`shared/config.ts`) | Add `agent` section (LLM provider, thresholds, feature flags) |
| `queues.ts` (CDK) | Add `agent-failure` and `agent-stress` SQS queues |
| `ecs-tasks.ts` (CDK) | Add `agentOrchestratorTask` Fargate task definition |
| `scheduled-jobs.ts` (CDK) | Add agent orchestrator as SQS consumer service |
| Triangulation stress events | Agent consumes `CorridorStressEvent` from SQS |
| Slack (`@slack/bolt` already a dependency) | Agent posts patch proposals and escalations |
| GitHub (via `gh` CLI or API) | Agent creates PRs for proposed patches, issues for escalations |

## Configuration

All agent config lives in `backend/shared/config.ts` under an `agent` section:

```typescript
agent: {
  enabled: boolean                    // master kill switch
  llmProvider: 'anthropic' | 'openai' // default: 'anthropic'
  llmModel: string                    // default: 'claude-sonnet-4-6'
  llmMaxTokens: number                // default: 4096
  llmTemperature: number              // default: 0.1
  autoDeployEnabled: boolean          // default: false (propose-only)
  canaryPercent: number               // default: 10
  canaryDurationMinutes: number       // default: 90
  failureThreshold: number            // consecutive failures before triggering (default: 3)
  escalationThreshold: number         // failures before human escalation (default: 10)
  maxPatchesPerDay: number            // rate limit on agent patches (default: 20)
  stressResponseEnabled: boolean      // default: false
  stressElevatedThreshold: number     // default: 25
  stressHighThreshold: number         // default: 50
  stressCriticalThreshold: number     // default: 75
  maxCadenceMultiplier: number        // default: 4
  slackChannel: string                // for notifications
  githubRepo: string                  // for PRs and issues
}
```

## Database tables

### silver.failure_bundle
```sql
CREATE TABLE silver.failure_bundle (
  bundle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  corridor_id TEXT,
  job_run_id UUID,
  failure_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  raw_payload_ref TEXT NOT NULL,
  raw_payload_sample TEXT,
  last_known_good_output JSONB,
  last_known_good_payload_ref TEXT,
  expected_schema JSONB,
  parser_source TEXT,
  parser_version TEXT,
  recent_failures JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'open',
  proposed_patch TEXT,
  contract_test_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

### silver.agent_action
```sql
CREATE TABLE silver.agent_action (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,  -- 'patch_proposed', 'cadence_override', 'bucket_expansion', 'module_activation', 'escalation'
  module_id TEXT,
  corridor_id TEXT,
  context JSONB NOT NULL,
  result TEXT NOT NULL,  -- 'success', 'failed', 'pending_review'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### silver.job_run
```sql
CREATE TABLE silver.job_run (
  job_run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  corridor_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  observation_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  error_message TEXT,
  triggered_by TEXT NOT NULL DEFAULT 'schedule',
  trigger_context JSONB,
  parser_version TEXT,
  handler_version TEXT
);
```

## Verification checklist
- [ ] Agent orchestrator starts and connects to SQS agent-failure queue
- [ ] FailureBundle assembled when collector fails 3+ times consecutively
- [ ] LLM client successfully calls Claude API with FailureBundle context
- [ ] Proposed parser patch type-checks via `tsc --noEmit`
- [ ] Contract tests run against stored payloads
- [ ] GitHub PR created with patch + test results (propose-only mode)
- [ ] Slack notification sent for both successful proposals and escalations
- [ ] Stress responder adjusts probe frequency when stress event received
- [ ] Cadence overrides expire after TTL
- [ ] All agent actions logged to `silver.agent_action`
- [ ] Feature flags: `agent.enabled=false` completely disables agent layer
- [ ] No impact on existing collector behavior when agent disabled
