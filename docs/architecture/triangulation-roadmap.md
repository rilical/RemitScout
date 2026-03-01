# Agent-Native Liquidity Observability — Architecture Roadmap

## Vision
Build an agent-native operating system for continuously collecting, normalizing, auditing, and self-healing heterogeneous macro + microstructure signals — with benchmark-grade methodology discipline, production-grade observability, and tool-gated agentic DataOps. The compounding moat: coverage under stress, self-healing connectors (measurable MTTD/MTTR), and versioned benchmark indices.

## Core Design Decisions
- **Orchestration**: Lane-based fabric — Lane A (tick dispatch, built), Lane B (durable workflows, buy: Step Functions or Temporal), Lane C (batch, buy: Dagster)
- **Index semantics**: TEER = price-level only; RVI = volatility only; RCI = constraints/friction only (strict separation)
- **Versioning**: Three-axis (parser_version, schema_version, methodology_version) for point-in-time truth
- **Agent system**: 5 scoped agents behind Tool Gateway, not one omniscient bot
- **LLM provider**: Pluggable `LlmClient` interface, default: Anthropic Claude
- **Agent autonomy**: Propose-only (v1). Human approval via GitHub PR. Auto-deploy (v2) behind feature flag.
- **Migration**: Dual-write — existing `silver.quote_record` unchanged, new `silver.observation` additive behind `EMIT_OBSERVATIONS` flag
- **First modules**: PSP Status + Sanctions Diffs (low-risk, high-leverage)
- **Product packaging**: 3-SKU ladder (Benchmark API → Trading-grade → Enterprise Risk) + provider intelligence

## Milestones

### Milestone 0: Foundation Types + DB Schema
**Goal**: Ship the universal type system without changing any runtime behavior.

New files:
- `backend/shared/types/module-spec.ts` — ModuleSpec, SignalLayer, CaptureMethod, PolicyFlags types
- `backend/shared/types/observation.ts` — ObservationEnvelope type
- `backend/shared/types/observation-payloads.ts` — Per-signal payload types (quote, status, appintel, trend, sanctions, onchain, human, volume)
- `backend/shared/types/job.ts` — JobRun type
- `backend/shared/types/failure-bundle.ts` — FailureBundle type

Migrations:
- 089: Create `silver.observation`, `silver.job_run`, `silver.failure_bundle`, `gold.triangulated_index` tables
- 090: Create `silver.module_registry`, `silver.agent_action` tables

Modified:
- `backend/shared/config.ts` — add `agent`, `triangulation`, `modules` config sections

**Verification**: `pnpm -C backend typecheck` passes; migration applies; existing pipelines unaffected.

### Milestone 1: JobHandler Abstraction + Quote Adapter
**Goal**: Introduce generic handler interface, wrap existing collectors.

New files:
- `backend/plane-b/src/handlers/base-job-handler.ts` — JobHandler interface
- `backend/plane-b/src/handlers/parser.ts` — ObservationParser interface
- `backend/plane-b/src/handlers/contract-test.ts` — ContractTest harness
- `backend/plane-b/src/handlers/quote-job-handler-adapter.ts` — wraps BaseCollector as JobHandler
- `.remit-scout/modules/catalog.json` — initial module catalog

Modified:
- `backend/plane-b/src/collectors/base-collector.ts` — add observation emission hook (behind `EMIT_OBSERVATIONS=false`)
- `backend/plane-b/src/providers/registry-builder.ts` — extend to carry optional JobHandler

**Verification**: Existing tests pass; adapter test confirms ObservationEnvelope production; `EMIT_OBSERVATIONS=false` = zero behavior change.

### Milestone 2: PSP Status Module
**Goal**: First non-quote signal module proves the JobHandler pattern.

New files:
- `backend/plane-b/src/modules/status/handler.ts` — StatusJobHandler
- `backend/plane-b/src/modules/status/fetch.ts` — Statuspage.io API client
- `backend/plane-b/src/modules/status/parse.ts` — status response parser
- `backend/plane-b/src/modules/status/config.ts` — provider → status URL mapping
- `backend/scripts/status-fetch-job.ts` — scheduled job

Modified:
- `.remit-scout/modules/catalog.json` — add status module entries
- `backend/shared/config.ts` — add status module config
- `infrastructure/cdk/lib/scheduled-jobs.ts` — add status-fetch task

**Verification**: `pnpm -C backend status:fetch` runs locally; observations in `silver.observation` with `signal_layer='micro'`.

### Milestone 3: Triangulation Engine v1
**Goal**: Compute corridor_stress_score from quotes + status signals.

New files:
- `backend/plane-b/src/triangulation/engine.ts`
- `backend/plane-b/src/triangulation/corridor-stress.ts`
- `backend/plane-b/src/triangulation/signal-combiner.ts`
- `backend/plane-b/src/triangulation/stress-events.ts`
- `backend/scripts/triangulation-job.ts`

Modified:
- `backend/plane-a/src/routes/indices.ts` — add `/indices/triangulated/:corridor_id`
- `infrastructure/cdk/lib/scheduled-jobs.ts` — add triangulation job

**Verification**: Job writes to `gold.triangulated_index`; API returns stress scores; scores low with only 2 signal layers (expected).

### Milestone 4: Agent Self-Healing Pipeline
**Goal**: LLM proposes parser fixes with human approval.

New files:
- `backend/plane-b/src/agents/orchestrator.ts`
- `backend/plane-b/src/agents/failure-detector.ts`
- `backend/plane-b/src/agents/llm-client.ts` (pluggable interface + Claude default)
- `backend/plane-b/src/agents/patch-proposer.ts`
- `backend/plane-b/src/agents/patch-validator.ts`
- `backend/plane-b/src/agents/patch-deployer.ts`
- `backend/plane-b/src/agents/agent-config.ts`

Modified:
- `backend/plane-b/src/collectors/base-collector.ts` — emit FailureBundle on persistent failures
- `backend/shared/config.ts` — agent config section
- `infrastructure/cdk/lib/queues.ts` — `agent-failure` SQS queue
- `infrastructure/cdk/lib/ecs-tasks.ts` — agentOrchestratorTask
- `infrastructure/cdk/lib/scheduled-jobs.ts` — agent as SQS consumer

**Verification**: Integration test: inject broken parse.ts, verify detection → LLM proposal → contract tests → GitHub PR → Slack notification.

### Milestone 5: Additional Signal Modules (parallel)
Ship independently:
- App Intelligence (`backend/plane-b/src/modules/appintel/`)
- Search Trends (`backend/plane-b/src/modules/trends/`)
- Sanctions Diffs (`backend/plane-b/src/modules/sanctions/`)
- On-Chain Flows (`backend/plane-b/src/modules/onchain/`)
- Human/Hawala (`backend/plane-b/src/modules/human/`)

Each enriches triangulation engine — more signals = higher confidence scores.

### Milestone 6: Adaptive Probing
**Goal**: Agent adjusts probes when corridor stress rises.

New files:
- `backend/plane-b/src/agents/stress-responder.ts`

Modified:
- `backend/plane-b/src/triangulation/stress-events.ts` — emit to `agent-stress` queue
- `backend/plane-b/src/collectors/base-collector.ts` — support Redis cadence overrides
- `infrastructure/cdk/lib/queues.ts` — `agent-stress` SQS queue

### Milestone 7: Provider Deals Surface
**Goal**: Ingest partner volume data, expose corridor intelligence.

New files:
- `backend/plane-a/src/routes/partner.ts`
- `backend/plane-a/src/services/partner-entitlements.ts`
- `backend/plane-b/src/modules/volume/handler.ts`

Migration: `silver.partner_entitlement`, `silver.partner_api_key`

## Key RAG Documents
- `agents/rag/triangulation-engine.md` — triangulation architecture, composite indices, stress events
- `agents/rag/agent-orchestration.md` — self-healing, adaptive probing, LLM integration
- `agents/rag/signal-modules.md` — module implementation patterns, planned modules, catalog spec

## Risk Mitigation
1. **Dual-write**: Existing `silver.quote_record` untouched. New `silver.observation` is additive.
2. **Feature flags**: Every capability independently toggleable via `backend/shared/config.ts`.
3. **Agent safety**: Propose-only mode, contract tests, parse.ts-only scope, audit logging.
4. **Legal compliance**: All modules require `policy_flags.tos_reviewed = true` before enabling.
5. **IssueOps acceptance proof**: PRD/Plan artifacts must use sharded `acceptance_proof.*_note` fields so bounded evidence and rollback evidence remain explicit and reviewable.
6. **IssueOps PRD risk and ownership model**: PRD artifacts must include canonical `risk_level` (aligned with `risk_tier`) and `owner_assignment` metadata so escalation paths remain deterministic.
7. **IssueOps spec traceability**: PRD/Plan `traceability.spec_refs` must contain repo-relative existing links so audits can deterministically replay source context.
8. **IssueOps task lifecycle contract**: PRD/Plan `traceability.task_lifecycle_version` must be set to the documented lifecycle contract version (`v1`) so task status transitions remain deterministic across retries and rollbacks.
9. **IssueOps future-runner safety**: PRD/Plan `traceability.parallelizable_tag` should use versioned values (`parallel.serial_only@v1` default) to annotate concurrency intent without weakening current one-task-per-iteration safety.
10. **IssueOps runtime stage-gate segmentation**: PRD/Plan `traceability.runtime_stage_gates` must partition gate expectations by versioned task cluster and include explicit bounded/rollback evidence gates for execution clusters.
11. **IssueOps historical audit snapshots**: Plan artifacts should keep `plan_snapshots` bounded (maximum 25 entries) and include sharded bounded/rollback evidence notes per snapshot so audit replay remains deterministic without unbounded artifact growth.
