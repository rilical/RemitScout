# Agent-Native Liquidity Observability Platform — Complete Implementation Specification

> **Purpose**: This is the single source of truth for building the agent-native data operating system on top of Remit-Scout. It is designed to be consumed by autonomous coding agents (ralph loop, Codex, Claude) running for extended periods. Every section contains enough detail to implement without asking questions.
>
> **Scope**: Build everything fully operational for the existing 24 providers. No new providers are onboarded. No new signal source modules are implemented. Every system component (Temporal, auto-patching, Tool Gateway, Knowledge Plane, triangulation, adaptive probing, index governance) ships working.
>
> **Existing providers** (24 total): alansari, bossmoney, dahabshiil, instarem, intermex, koronapay, mukuru, orbitremit, pangea, paysend, placid, remitbee, remitly, ria, sendwave, singx, transfergo, wellsfargo, westernunion, wirebarley, wise, worldremit, xe, xoom

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Type Definitions](#2-type-definitions)
3. [Database Migrations](#3-database-migrations)
4. [Lane A: Tick Dispatcher](#4-lane-a-tick-dispatcher)
5. [JobHandler Abstraction + Quote Adapter](#5-jobhandler-abstraction--quote-adapter)
6. [Observation Pipeline + Dual-Write](#6-observation-pipeline--dual-write)
6.5. [Factor Normalization Plane](#65-factor-normalization-plane)
7. [Self-Healing Pipeline](#7-self-healing-pipeline)
8. [Tool Gateway](#8-tool-gateway)
9. [Knowledge Plane](#9-knowledge-plane)
10. [Triangulation Engine](#10-triangulation-engine)
11. [Adaptive Probing](#11-adaptive-probing)
12. [Index Governance + Three-Axis Versioning](#12-index-governance--three-axis-versioning)
13. [Total Collection Error Framework](#13-total-collection-error-framework)
14. [Temporal Workflows (Lane B)](#14-temporal-workflows-lane-b)
15. [Module Onboarding Factory](#15-module-onboarding-factory)
16. [Quarantine System](#16-quarantine-system)
17. [Infrastructure Changes (CDK)](#17-infrastructure-changes-cdk)
18. [Configuration](#18-configuration)
19. [Existing File Modifications](#19-existing-file-modifications)
20. [Index Semantic Rules](#20-index-semantic-rules)
21. [Failure Recovery Flows](#21-failure-recovery-flows)
22. [Compounding Moat Metrics](#22-compounding-moat-metrics)
23. [RAG Documents](#23-rag-documents)
24. [Verification Checklists](#24-verification-checklists)

---

## 1. Architecture Overview

### Current State

Remit-Scout has 3 runtime planes (A=public API, B=ingestion, C=publisher), a medallion data architecture (Bronze/Silver/Gold), 24 provider collectors using `BaseCollector`, and TEER/RCI/RVI index computation. There is no LLM integration, no self-healing, no observation envelope, no triangulation, and no agent system. `brain.ts` is rule-based.

### Target State

Four conceptual planes + three orchestration lanes + existing runtime planes:

**Control Plane** (new):
- `ModuleSpec` registry (`.remit-scout/modules/catalog.json`) — all 24 providers registered
- `PolicyFlags` with legal basis, redistribution rights, domain allowlists, tool permissions
- `ModuleRuntimeState` (silver.module_registry) — health state, quarantine, cadence overrides
- Corridor registry with signal-layer SLOs

**Orchestration Plane** (new):
- **Lane A**: Tick dispatcher — Postgres `dispatch_queue` with SKIP LOCKED + SQS emission + Redis token buckets
- **Lane B**: Temporal durable workflows — module onboarding, repair pipelines, backfills
- **Lane C**: Batch/data orchestrator (Dagster) — replay, recompute, training

**Execution Plane** (extended Plane B):
- `JobHandler` interface with `QuoteJobHandlerAdapter` wrapping all 24 collectors
- `ObservationEnvelope` universal record — dual-write alongside `silver.quote_record`
- `ObservationParser` + `ContractTest` harness — validated against stored provider fixtures
- Factor library (`gold.factor`) — intermediate between facts and indices
- Triangulation engine — corridor stress from existing TEER/RCI/RVI
- Hot/cold observation storage — Postgres metadata + S3 Parquet for payloads

**Agent Tool Plane** (entirely new):
- 5 scoped agents: Knowledge, Debug Capture, Repair, Governance/Policy, SLO/Quality
- Tool Gateway — trusted execution boundary with allowlists, PII redaction, audit logging
- Knowledge Plane — pgvector semantic search + BM25 hybrid retrieval
- Pluggable LLM client — `LlmClient` interface, Claude default
- Self-healing pipeline — FailureBundle → Repair Agent → contract tests → GitHub PR
- Adaptive probing — stress events → cadence/bucket adjustments
- Quarantine system — auth_wall, tos_change, schema_drift, pii_risk detection

### Non-Negotiable Invariants

1. Existing TEER/RCI/RVI computation MUST NOT break. Dual-write is additive.
2. All 24 existing provider collectors continue to work unchanged when feature flags are OFF.
3. `ObservationEnvelope` is the universal record format. Every signal type produces one.
4. Agent self-healing is propose-only. Human approves every GitHub PR before merge.
5. Tool Gateway blocks all tool requests that violate policy. No exceptions.
6. Three-axis versioning (parser, schema, methodology) on all output records.
7. Point-in-time truth: given (corridor, timestamp, methodology_version) → deterministic output.
8. TEER = price-level only. RVI = volatility only. RCI = constraints/friction only.
9. Provider volume data never exposed per-provider to other providers.
10. Quarantined modules are NOT dispatched. Auth walls are NOT "healed."
11. All agent actions logged to `silver.agent_action` for audit trail.
12. Raw payloads are immutable in Bronze. Corrections produce new observations.
13. Schema pre-flight validation: Before any agent session starts, the orchestrator MUST validate that `catalog.json` and all referenced schemas are syntactically valid JSON/YAML. Agent execution is blocked if validation fails. This prevents the repair pipeline from operating on corrupted configuration.
14. Factor normalization methodology versioning: Changing the LLM prompt in `LlmSemanticExtractor` triggers a new `methodology_version`. Institutional clients track index behavior changes via the correction ledger (`gold.index_correction`).
15. Fetch.ts repair safety: Agent-proposed fetch.ts patches MUST NOT change base URL domains, inject credentials/secrets, modify TLS settings, or remove rate-limiting logic. Fetch patches that fail static safety analysis are rejected before contract testing. All fetch.ts PRs carry `requires-fetch-review` and are excluded from future auto-deploy (v2).

---

## 2. Type Definitions

### 2.1 ModuleSpec (`backend/shared/types/module-spec.ts`)

```typescript
export type SignalLayer =
  | 'quote'           // existing provider quotes (all 24 providers)
  | 'macro'           // policy, sanctions, migration, trade (future)
  | 'micro'           // PSP status, mobile-money, mystery-shopper (future)
  | 'digital_exhaust' // app-store, search trends (future)
  | 'onchain'         // stablecoin flows, on/off-ramp (future)
  | 'human'           // hawala, manual audits, receipts (future)
  | 'volume'          // provider deal volume/flow data (future)

export type CaptureMethod =
  | 'api'       // structured API call
  | 'html'      // HTML scraping
  | 'feed'      // RSS/Atom/webhook
  | 'human'     // manual entry / crowd-sourced
  | 'partner'   // contracted data feed
  | 'sdk'       // app-store SDK / third-party data provider
  | 'onchain'   // blockchain RPC / indexer

export type DataClassification = 'public' | 'restricted' | 'confidential'

export type LegalBasis =
  | 'public_endpoint'
  | 'licensed_api'
  | 'partner_feed'
  | 'consented_telemetry'
  | 'human_audit'

export type PolicyFlags = {
  // Legal basis
  legal_basis: LegalBasis
  data_classification: DataClassification
  requires_consent: boolean
  pii_present: boolean
  tos_reviewed: boolean
  tos_review_date: string | null
  tos_snapshot_ref: string | null       // S3 key to immutable ToS snapshot
  legal_review_ref: string | null       // S3 key to legal review document
  geo_restrictions: string[]            // ISO country codes where collection is restricted
  rate_limit_contractual: number | null  // contractual max RPM (vs technical)
  data_retention_days: number

  // Licensing/redistribution (for DDQ/institutional buyers)
  redistribution_rights: 'none' | 'derived_only' | 'raw_ok'
  derivative_works_allowed: boolean
  attribution_required: boolean
  attribution_text_ref: string | null
  retention_contractual_days: number | null
  sublicensing_allowed: boolean
  data_processor_role: 'controller' | 'processor'  // GDPR posture

  // Tool gating
  allowed_domains: string[]             // explicit allowlist for fetch targets
  allowed_tool_types: string[]          // which agent tools can interact
}

export type ModuleSpec = {
  module_id: string
  signal_layer: SignalLayer
  capture_method: CaptureMethod
  display_name: string
  description: string

  // Scheduling
  corridors: string[] | 'all'
  default_cadence_seconds: number
  freshness_slo_seconds: number

  // Rate limits
  rate_limit_rpm: number
  rate_limit_per_corridor_rpm: number
  rate_limit_burst: number

  // Policy
  policy_flags: PolicyFlags

  // Parser versioning
  parser_version: string
  schema_version: string

  // Feature flags
  enabled: boolean
  canary_percent: number

  // Module budget
  monthly_budget_usd: number | null
  max_daily_job_runs: number | null

  // Operational
  owner: string
  oncall_rotation: string | null
  severity_tier: 1 | 2 | 3
  fallback_module_ids: string[]
  rail_variants: string[]
  amount_buckets: number[]
  expected_observation_shape: string    // payload type discriminator

  // Factor normalization (see section 6.5)
  normalization_strategy: 'volume_price' | 'z_score' | 'step_function' | 'llm_semantic' | null

  // Repair strategy override (see section 2.6)
  repair_strategy_override: 'dom_scraper' | 'structured_api' | 'document_extractor' | null
}

export type ModuleQuarantineReason =
  | 'auth_wall'
  | 'tos_change'
  | 'pii_risk_detected'
  | 'schema_drift'
  | 'rate_limited'
  | 'vendor_outage'

export type ModuleRuntimeState = {
  module_id: string
  enabled: boolean
  canary_percent: number
  state: 'healthy' | 'degraded' | 'quarantined'
  quarantine_reason: ModuleQuarantineReason | null
  quarantine_until: string | null
  last_run_at: string | null
  last_success_at: string | null
  consecutive_failures: number
  error_rate_24h: number
  last_dom_signature_hash: string | null
  last_known_good_parser_version: string | null
  last_known_good_payload_ref: string | null
  cadence_override_multiplier: number | null
  cadence_override_expires_at: string | null
}
```

### 2.2 ObservationEnvelope (`backend/shared/types/observation.ts`)

```typescript
import type { SignalLayer, CaptureMethod } from './module-spec'

export type ObservationEnvelope = {
  observation_id: string          // UUID
  module_id: string
  signal_layer: SignalLayer
  corridor_id: string | null      // null for global signals

  // Timestamps
  observed_at: string             // ISO 8601
  ingested_at: string             // ISO 8601

  // Provenance
  capture_method: CaptureMethod
  parser_version: string
  schema_version: string
  geo: string | null

  // Fetch telemetry
  http_status: number | null
  content_type: string | null
  fetch_ms: number | null
  response_bytes: number | null

  // Payload (hot/cold split)
  raw_payload_ref: string         // S3 key — immutable raw payload
  normalized_payload_ref: string | null  // S3 Parquet — cold store for full payload
  normalized_payload: Record<string, unknown>  // JSONB — hot store (30-90d retention)
  payload_hash: string            // sha256 — dedup and audit

  // Quality
  quality_flags: string[]
  confidence: number              // 0.0-1.0
  confidence_reason_codes: string[]  // why confidence is what it is

  // Policy
  policy_flags: {
    pii_present: boolean
    consent_obtained: boolean
    retention_expiry: string | null
  }

  // Lineage
  job_run_id: string
  source_observation_ids: string[]
}
```

### 2.3 Observation Payload Sub-Schemas (`backend/shared/types/observation-payloads.ts`)

All payload types defined as TypeScript discriminated unions. For the current phase, only `QuoteObservationPayload` is actively used. All other types are defined for future use:

```typescript
export type QuoteObservationPayload = {
  type: 'quote'
  provider_id: string
  send_amount: number
  fee_amount: number
  receive_amount: number
  implied_fx_rate: number
  payin: string
  payout: string
  amount_bucket: number
  method_profile: string
}

// Future payload types (defined but not actively produced yet):
export type StatusObservationPayload = { type: 'status'; /* ... */ }
export type AppIntelObservationPayload = { type: 'appintel'; /* ... */ }
export type TrendObservationPayload = { type: 'trend'; /* ... */ }
export type SanctionsDiffObservationPayload = { type: 'sanctions_diff'; /* ... */ }
export type OnchainObservationPayload = { type: 'onchain'; /* ... */ }
export type HumanObservationPayload = {
  type: 'human'
  subtype: 'hawala_quote' | 'mystery_shopper' | 'receipt_audit' | 'field_report'
  quoted_rate: number | null
  realized_rate: number | null
  spread_vs_mid: number | null
  volume_capacity_usd: number | null
  kyc_enforcement_level: 'none' | 'basic' | 'strict' | null
  notes: string
  collector_id: string
  collector_tier: 1 | 2 | 3
  proof_artifact_ref: string | null
}
export type VolumeObservationPayload = { type: 'volume'; /* ... */ }
export type CardBaselineObservationPayload = { type: 'card_baseline'; /* ... */ }
export type MaritimeObservationPayload = { type: 'maritime'; /* ... */ }
export type MigrationObservationPayload = { type: 'migration'; /* ... */ }
export type DisplacementObservationPayload = { type: 'displacement'; /* ... */ }
export type TelecomObservationPayload = { type: 'telecom'; /* ... */ }
export type EventObservationPayload = { type: 'event'; /* ... */ }

export type ObservationPayload =
  | QuoteObservationPayload
  | StatusObservationPayload
  | AppIntelObservationPayload
  | TrendObservationPayload
  | SanctionsDiffObservationPayload
  | OnchainObservationPayload
  | HumanObservationPayload
  | VolumeObservationPayload
  | CardBaselineObservationPayload
  | MaritimeObservationPayload
  | MigrationObservationPayload
  | DisplacementObservationPayload
  | TelecomObservationPayload
  | EventObservationPayload
```

### 2.4 JobRun (`backend/shared/types/job.ts`)

```typescript
export type JobRun = {
  job_run_id: string
  module_id: string
  corridor_id: string | null
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  observation_count: number
  error_count: number
  error_message: string | null
  triggered_by: 'schedule' | 'agent' | 'manual' | 'stress_escalation'
  trigger_context: Record<string, unknown> | null
  parser_version: string
  handler_version: string
}
```

### 2.5 FailureBundle (`backend/shared/types/failure-bundle.ts`)

```typescript
export type FailureBundle = {
  bundle_id: string
  module_id: string
  corridor_id: string | null
  job_run_id: string
  failure_type: 'parse_error' | 'schema_change' | 'http_error' | 'block_detected' | 'validation_failed' | 'timeout' | 'fetch_contract_change' | 'session_flow_break'
  error_message: string
  error_stack: string | null
  raw_payload_ref: string
  raw_payload_sample: string        // first 10KB for LLM context
  last_known_good_output: Record<string, unknown> | null
  last_known_good_payload_ref: string | null
  expected_schema: Record<string, unknown>
  parser_source: string             // current parse.ts source code
  fetcher_source: string            // current fetch.ts source code
  parser_version: string
  recent_failures: Array<{
    timestamp: string
    error_message: string
    failure_type: string
  }>
  // Heterogeneous source support — enables repair strategies to tailor
  // diagnostics based on the raw payload format (HTML, JSON, PDF, CSV)
  payload_mime_type: 'application/json' | 'text/html' | 'application/pdf' | 'text/csv'
  diagnostic_artifacts: Record<string, string>  // e.g., { "pdf_text_ref": "s3://...", "headers": "{...}" }
  status: 'open' | 'agent_reviewing' | 'patch_proposed' | 'testing' | 'deployed' | 'escalated'
  proposed_patch: string | null
  contract_test_results: Record<string, unknown> | null
  created_at: string
  resolved_at: string | null
}
```

### 2.6 RepairStrategy (`backend/plane-b/src/agents/repair-strategies/types.ts`)

The self-healing pipeline uses pluggable repair strategies so the LLM agent receives different diagnostic context, system prompts, and tool permissions depending on the capture method. Each strategy knows how to assemble meaningful context for its payload type.

```typescript
export interface RepairStrategy {
  readonly profileName: string
  assembleDiagnosticContext(bundle: FailureBundle): Promise<AgentContext>
  buildSystemPrompt(): string
  getAllowedTools(): ToolType[]
}

export type AgentContext = {
  systemPrompt: string
  diagnosticSummary: string
  relevantArtifacts: Record<string, string>  // key → S3 ref or inline content
  allowedTools: ToolType[]
}
```

**Initial strategies** (`backend/plane-b/src/agents/repair-strategies/`):

| Strategy | Profile Name | Capture Methods | Diagnostic Context (parse layer) | Diagnostic Context (fetch layer) | Allowed Tools |
|----------|-------------|-----------------|----------------------------------|----------------------------------|---------------|
| `DomScraperRepairStrategy` | `dom_scraper` | `html` | HTML DOM diffs (current vs last-known-good), CSS selector testing results, Playwright debug capture (screenshot + HAR) | Session flow trace (redirects, cookies, CSRF tokens), header diffs, endpoint discovery (path changes, content-type negotiation) | `dom_diff`, `css_selector_tester`, `debug_capture`, `http_request_replay`, `session_flow_tracer`, `header_diff`, `endpoint_discovery` |
| `StructuredApiRepairStrategy` | `structured_api` | `api`, `feed`, `sdk` | JSON schema diffs (expected vs actual), response shape analysis | API endpoint probe (status, headers, response shape), header diffs, endpoint path/method discovery | `json_schema_diff`, `api_endpoint_prober`, `http_request_replay`, `header_diff`, `endpoint_discovery` |
| `DocumentExtractorRepairStrategy` | `document_extractor` | `human` (PDF receipts), future PDF/CSV sources | Extracted text from PDF (via AWS Textract or Poppler), regex/bounding-box test results, page structure analysis | URL construction validation, content-type negotiation | `extract_pdf_text`, `regex_tester`, `http_request_replay`, `endpoint_discovery` |

**Strategy routing**: The orchestrator reads `module.capture_method` from `catalog.json` and maps it to a `RepairStrategy` before invoking the LLM. Default mapping:

```typescript
const STRATEGY_MAP: Record<CaptureMethod, string> = {
  html:    'dom_scraper',
  api:     'structured_api',
  feed:    'structured_api',
  sdk:     'structured_api',
  human:   'document_extractor',
  partner: 'structured_api',
  onchain: 'structured_api',
}
```

Modules can override the default via an optional `repair_strategy_override` field in `catalog.json`.

### 2.7 Tool Gateway Types (`backend/shared/types/tool-gateway.ts`)

```typescript
export type ToolType =
  | 'debug_capture'        // Playwright screenshot + HAR (sandboxed)
  | 'dom_diff'             // Compare DOM signature to last-known-good
  | 'search_knowledge'     // Query Knowledge Plane
  | 'fetch_fixture_set'    // Load contract test fixtures from S3
  | 'run_contract_test'    // Execute contract tests on proposed parser
  | 'css_selector_tester'  // Test CSS selectors against stored DOM snapshots
  | 'json_schema_diff'     // Diff expected vs actual JSON schema
  | 'api_endpoint_prober'  // Probe API endpoint (status, headers, response shape)
  | 'extract_pdf_text'     // Extract text from PDF via Textract/Poppler
  | 'regex_tester'         // Test regex patterns against extracted text
  | 'http_request_replay'  // Replay fetch request with modified headers/params (sandboxed)
  | 'endpoint_discovery'   // Probe for endpoint changes (path, method, content-type negotiation)
  | 'session_flow_tracer'  // Trace multi-step session flows (cookie chains, redirects, CSRF tokens)
  | 'header_diff'          // Diff required headers between last-known-good and current response

export type ToolRequest = {
  request_id: string
  requester_agent: string
  tool_type: ToolType
  module_id: string
  capture_profile_id: string | null
  corridor_id: string | null
  failure_bundle_id: string | null
  job_run_id: string | null
  purpose: 'debug' | 'repair' | 'backfill' | 'audit'
  parameters: Record<string, unknown>
  policy_check_result: 'allowed' | 'denied' | 'pending_review'
  policy_version: string
  denial_reason: string | null
  created_at: string
}

export type ToolResult = {
  request_id: string
  tool_type: ToolType
  status: 'success' | 'failed' | 'denied'
  result_summary: string
  redaction_summary: string
  pii_detected: boolean
  artifact_refs: string[]
  policy_version: string
  duration_ms: number
  created_at: string
}
```

### 2.7 Factor (`backend/shared/types/factor.ts`)

Standardized factor produced by the Factor Normalization Plane (see section 6.5). All heterogeneous signals are normalized into this common shape before the Triangulation Engine consumes them.

```typescript
export type Factor = {
  factor_id: string
  module_id: string
  corridor_id: string | null
  signal_layer: SignalLayer
  score: number               // normalized 0-100
  score_unit: 'severity' | 'bps' | 'ratio' | 'index'
  confidence: number          // 0-1
  methodology_version: string
  source_observation_id: string
  computed_at: string
}
```

### 2.8 FactorExtractor (`backend/plane-b/src/normalization/types.ts`)

Pluggable extraction strategies that convert raw `ObservationEnvelope` payloads into standardized `Factor` records. Each module declares its `normalization_strategy` in catalog.json, and the `NormalizationRouter` dispatches to the correct extractor.

```typescript
export type NormalizationContext = {
  module: ModuleSpec
  corridor: { corridor_id: string; tier: 1 | 2 | 3 } | null
  baselines: {
    mean_90d: number | null
    stddev_90d: number | null
    last_value: number | null
  }
}

export interface FactorExtractor {
  readonly strategyName: string
  extract(envelope: ObservationEnvelope, context: NormalizationContext): Promise<Factor>
}
```

**Initial extraction strategies** (`backend/plane-b/src/normalization/extractors/`):

| Strategy | Class | Input Signal Types | Normalization Method | Output score_unit |
|----------|-------|-------------------|---------------------|-------------------|
| `volume_price` | `VolumePriceExtractor` | `quote` | Synthetic volume weights → bps spreads from existing TEER decomposition | `bps` |
| `z_score` | `ZScoreExtractor` | `digital_exhaust`, `onchain`, `volume` | 90-day rolling baseline comparison: `score = min(100, abs(z) * 20)` where `z = (value - mean_90d) / stddev_90d` | `severity` |
| `step_function` | `StepFunctionExtractor` | `macro`, `micro` (status) | Binary/categorical state mapping → hard severity bounds (e.g., `major_outage` = 90, `degraded` = 40, `operational` = 0) | `severity` |
| `llm_semantic` | `LlmSemanticExtractor` | `human` (field reports), `macro` (news/events) | Structured LLM output with scoring rubric → deterministic severity score. **The LLM prompt used for semantic scoring is part of `methodology_version`**. Changing the prompt triggers a new methodology version so institutional clients can track index behavior changes. | `severity` |

**NormalizationRouter** (`backend/plane-b/src/normalization/router.ts`):

- Reads `module.normalization_strategy` from catalog.json
- Dispatches `ObservationEnvelope` to the matching `FactorExtractor`
- Writes resulting `Factor` to `gold.factor`
- Async processing via `normalization-queue` (SQS) to prevent slow LLM calls from blocking Lane A

---

## 3. Database Migrations

### Migration 089: Core observation tables

```sql
-- Enable pgvector extension (for Knowledge Plane)
CREATE EXTENSION IF NOT EXISTS vector;

-- Universal observation store
CREATE TABLE silver.observation (
  observation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  signal_layer TEXT NOT NULL,
  corridor_id TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  capture_method TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  geo TEXT,

  -- Fetch telemetry
  http_status INTEGER,
  content_type TEXT,
  fetch_ms INTEGER,
  response_bytes INTEGER,

  -- Payload (hot/cold)
  raw_payload_ref TEXT NOT NULL,
  normalized_payload_ref TEXT,
  normalized_payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL,

  -- Hot columns for quote signal (most-queried)
  hot_effective_rate NUMERIC,
  hot_fee_bps NUMERIC,
  hot_provider_id TEXT,
  hot_component_status TEXT,
  hot_incident_active BOOLEAN,

  -- Quality
  quality_flags TEXT[] DEFAULT '{}',
  confidence NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  confidence_reason_codes TEXT[] DEFAULT '{}',

  -- Policy
  policy_pii_present BOOLEAN DEFAULT FALSE,
  policy_consent_obtained BOOLEAN DEFAULT TRUE,
  policy_retention_expiry TIMESTAMPTZ,

  -- Lineage
  job_run_id UUID,
  source_observation_ids UUID[] DEFAULT '{}'
);

CREATE INDEX idx_obs_corridor_layer_time ON silver.observation (corridor_id, signal_layer, observed_at DESC);
CREATE INDEX idx_obs_module_time ON silver.observation (module_id, observed_at DESC);
CREATE INDEX idx_obs_signal_layer_time ON silver.observation (signal_layer, observed_at DESC);
CREATE INDEX idx_obs_payload_hash ON silver.observation (payload_hash);
CREATE INDEX idx_obs_hot_provider ON silver.observation (hot_provider_id, observed_at DESC) WHERE hot_provider_id IS NOT NULL;

-- Job run tracking
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

CREATE INDEX idx_job_run_module_status ON silver.job_run (module_id, status, started_at DESC);

-- Failure bundles for agent self-healing
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
  fetcher_source TEXT,
  parser_version TEXT,
  recent_failures JSONB DEFAULT '[]',
  payload_mime_type TEXT NOT NULL DEFAULT 'text/html',
  diagnostic_artifacts JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open',
  proposed_patch TEXT,
  contract_test_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_failure_bundle_module_status ON silver.failure_bundle (module_id, status, created_at DESC);

-- Triangulated index output
CREATE TABLE gold.triangulated_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  corridor_stress_score NUMERIC(5,1),
  corridor_stress_confidence NUMERIC(3,2),
  informal_premium_bps NUMERIC(8,2),
  capital_control_intensity NUMERIC(5,1),
  quote_signal_count INTEGER DEFAULT 0,
  status_signal_count INTEGER DEFAULT 0,
  appintel_signal_count INTEGER DEFAULT 0,
  trend_signal_count INTEGER DEFAULT 0,
  onchain_signal_count INTEGER DEFAULT 0,
  human_signal_count INTEGER DEFAULT 0,
  methodology_version TEXT NOT NULL,
  UNIQUE (corridor_id, computed_at)
);

-- Factor library (standardized output from Factor Normalization Plane)
CREATE TABLE gold.factor (
  factor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  corridor_id TEXT,
  signal_layer TEXT NOT NULL,
  score NUMERIC(5,1) NOT NULL,             -- normalized 0-100
  score_unit TEXT NOT NULL,                 -- 'severity' | 'bps' | 'ratio' | 'index'
  confidence NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  methodology_version TEXT NOT NULL,
  source_observation_id UUID NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_factor_corridor_layer ON gold.factor (corridor_id, signal_layer, computed_at DESC);
CREATE INDEX idx_factor_module ON gold.factor (module_id, computed_at DESC);
CREATE INDEX idx_factor_source_obs ON gold.factor (source_observation_id);

-- Grant permissions
GRANT SELECT, INSERT ON silver.observation TO plane_b;
GRANT SELECT, INSERT ON silver.job_run TO plane_b;
GRANT SELECT, INSERT, UPDATE ON silver.failure_bundle TO plane_b;
GRANT SELECT, INSERT ON gold.triangulated_index TO plane_b;
GRANT SELECT, INSERT ON gold.factor TO plane_b;
GRANT SELECT ON silver.observation TO plane_a;
GRANT SELECT ON gold.triangulated_index TO plane_a;
GRANT SELECT ON gold.factor TO plane_a;
```

### Migration 090: Agent + control plane tables

```sql
-- Tick dispatcher queue (Lane A)
CREATE TABLE silver.dispatch_queue (
  dispatch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  corridor_id TEXT,
  amount_bucket INTEGER,
  rail_variant TEXT,
  next_due_at TIMESTAMPTZ NOT NULL,
  cadence_seconds INTEGER NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  lease_owner TEXT,
  lease_expires_at TIMESTAMPTZ,
  last_dispatched_at TIMESTAMPTZ,
  backoff_state JSONB DEFAULT '{}',
  consecutive_failures INTEGER DEFAULT 0,
  daily_dispatches INTEGER DEFAULT 0,
  daily_dispatches_reset_at DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_dispatch_due ON silver.dispatch_queue
  (next_due_at) WHERE lease_expires_at IS NULL OR lease_expires_at < NOW();
CREATE INDEX idx_dispatch_module ON silver.dispatch_queue (module_id);

-- Module runtime state (with quarantine)
CREATE TABLE silver.module_registry (
  module_id TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT TRUE,
  canary_percent INTEGER DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'healthy',
  quarantine_reason TEXT,
  quarantine_until TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  error_rate_24h NUMERIC(5,4) DEFAULT 0,
  last_dom_signature_hash TEXT,
  last_known_good_parser_version TEXT,
  last_known_good_payload_ref TEXT,
  cadence_override_multiplier NUMERIC(3,1),
  cadence_override_expires_at TIMESTAMPTZ
);

-- Agent action audit trail
CREATE TABLE silver.agent_action (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  requester_agent TEXT NOT NULL,
  module_id TEXT,
  corridor_id TEXT,
  context JSONB NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_action_module ON silver.agent_action (module_id, created_at DESC);

-- Tool Gateway audit
CREATE TABLE silver.agent_tool_request (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_agent TEXT NOT NULL,
  tool_type TEXT NOT NULL,
  module_id TEXT,
  capture_profile_id TEXT,
  corridor_id TEXT,
  failure_bundle_id UUID,
  job_run_id UUID,
  purpose TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  policy_check_result TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  denial_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE silver.agent_tool_result (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES silver.agent_tool_request(request_id),
  tool_type TEXT NOT NULL,
  status TEXT NOT NULL,
  result_summary TEXT NOT NULL,
  redaction_summary TEXT,
  pii_detected BOOLEAN DEFAULT FALSE,
  artifact_refs TEXT[] DEFAULT '{}',
  policy_version TEXT NOT NULL,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Knowledge Plane embeddings
CREATE TABLE silver.knowledge_chunk (
  chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,         -- 'code', 'schema', 'failure', 'runbook'
  source_ref TEXT NOT NULL,          -- file path or S3 key
  source_commit_sha TEXT,
  content_hash TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  embedding_model_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_chunk_source ON silver.knowledge_chunk (source_type, source_ref);
CREATE INDEX idx_knowledge_chunk_hash ON silver.knowledge_chunk (content_hash);
-- Vector index created separately: CREATE INDEX idx_knowledge_embedding ON silver.knowledge_chunk USING ivfflat (embedding vector_cosine_ops);

-- Index correction ledger (publication protocol)
CREATE TABLE gold.index_correction (
  correction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id TEXT NOT NULL,
  index_type TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  old_value NUMERIC,
  new_value NUMERIC,
  reason TEXT NOT NULL,
  methodology_version TEXT NOT NULL,
  evidence_refs TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant permissions
GRANT ALL ON silver.dispatch_queue TO plane_b;
GRANT ALL ON silver.module_registry TO plane_b;
GRANT SELECT, INSERT ON silver.agent_action TO plane_b;
GRANT SELECT, INSERT ON silver.agent_tool_request TO plane_b;
GRANT SELECT, INSERT ON silver.agent_tool_result TO plane_b;
GRANT ALL ON silver.knowledge_chunk TO plane_b;
GRANT SELECT, INSERT ON gold.index_correction TO plane_b;
GRANT SELECT ON gold.index_correction TO plane_a;
GRANT SELECT ON gold.index_correction TO plane_c;
```

### Migration 091: Partner infrastructure

```sql
CREATE TABLE silver.partner_entitlement (
  entitlement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  allowed_corridors TEXT[] DEFAULT '{}',
  allowed_signal_layers TEXT[] DEFAULT '{}',
  data_access_level TEXT NOT NULL DEFAULT 'aggregate_only',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE silver.partner_api_key (
  key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

GRANT SELECT ON silver.partner_entitlement TO plane_a;
GRANT SELECT ON silver.partner_api_key TO plane_a;
GRANT ALL ON silver.partner_entitlement TO plane_b;
GRANT ALL ON silver.partner_api_key TO plane_b;
```

### Migration 092: Human sensor network

```sql
-- Human sensor profiles (trusted field researchers)
CREATE TABLE silver.human_sensor_profile (
  collector_id TEXT PRIMARY KEY,
  cognito_user_id TEXT NOT NULL,
  tier INTEGER NOT NULL DEFAULT 1,              -- 1=new, 2=trusted, 3=senior
  assigned_corridors TEXT[] DEFAULT '{}',
  trust_score NUMERIC(3,2) DEFAULT 0.50,        -- 0-1, calibration-adjusted
  total_submissions INTEGER DEFAULT 0,
  accurate_submissions INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_human_sensor_active ON silver.human_sensor_profile (active, tier DESC);
CREATE INDEX idx_human_sensor_corridors ON silver.human_sensor_profile USING GIN (assigned_corridors);

GRANT SELECT ON silver.human_sensor_profile TO plane_a;
GRANT ALL ON silver.human_sensor_profile TO plane_b;
```

---

## 4. Lane A: Tick Dispatcher

### File: `backend/plane-b/src/control/tick-dispatcher.ts` (new)

The tick dispatcher replaces ad-hoc EventBridge schedules for provider collection with a unified, fairness-aware scheduling system.

> **Design rationale — Lane A vs Temporal**: Lane A uses Postgres SKIP LOCKED + SQS deliberately for high-frequency, lightweight tick dispatching (tens of thousands of short-lived cycles per day). Temporal (Lane B) handles durable multi-step workflows (module onboarding, repair pipelines, backfill reprocessing). This is intentional separation: the custom dispatcher is optimized for polling throughput where Temporal's per-workflow overhead would be counterproductive. Each cycle in Lane A is a single database row lease + SQS emit — creating a Temporal workflow for each would add ~50ms overhead per tick with no durability benefit, since ticks are idempotent and retryable.

**How it works**:
1. On startup, seed `dispatch_queue` from `module_registry` (all 24 providers × their corridors × amount buckets)
2. Dispatcher loop: `SELECT ... FOR UPDATE SKIP LOCKED WHERE next_due_at <= now() AND (lease_expires_at IS NULL OR lease_expires_at < now()) ORDER BY priority DESC, next_due_at ASC LIMIT N`
3. Lease the row (set `lease_owner`, `lease_expires_at`)
4. Emit SQS message to appropriate queue (ingest-fanout, b2c-refresh, etc.)
5. On job completion callback: update `last_dispatched_at`, compute `next_due_at`, release lease

**Fairness**:
- Per-module and per-corridor token buckets in Redis (extends existing `redis-token-bucket.ts`)
- Hot corridors (stress escalation) get priority boost but never starve long-tail corridors
- Max lateness ≤ 2× cadence for Tier-1 corridors in steady state

**Scaling acceptance**: At 10M jobs/day, dispatcher p95 scheduling latency < 2s.

**Integration**: The dispatcher reads `ModuleRuntimeState` from `silver.module_registry`. Quarantined modules are skipped. Cadence overrides from adaptive probing are respected.

---

## 5. JobHandler Abstraction + Quote Adapter

### File: `backend/plane-b/src/handlers/base-job-handler.ts` (new)

```typescript
import type { Pool } from 'pg'
import type { ObservationEnvelope } from '../../../shared/types/observation'
import type { ModuleSpec } from '../../../shared/types/module-spec'
import type { JobRun } from '../../../shared/types/job'

export type JobHandlerContext = {
  pool: Pool
  moduleSpec: ModuleSpec
  corridorId: string | null
  jobRun: JobRun
  signal: AbortSignal
}

export interface JobHandler {
  readonly moduleId: string
  run(ctx: JobHandlerContext): Promise<ObservationEnvelope[]>
  healthCheck(): Promise<{ healthy: boolean; reason?: string }>
}
```

### File: `backend/plane-b/src/handlers/quote-job-handler-adapter.ts` (new)

Wraps all 24 existing `BaseCollector` subclasses as `JobHandler` instances. This is the bridge between old and new:

1. Receives `JobHandlerContext`
2. Calls the existing collector's `run()` method (unchanged)
3. Converts each `NormalizedQuote` result to an `ObservationEnvelope` with `type: 'quote'`
4. Writes to `silver.observation` alongside existing `silver.quote_record` (dual-write)
5. Returns `ObservationEnvelope[]`

The adapter does NOT modify existing collector behavior. It wraps it.

### File: `backend/plane-b/src/handlers/parser.ts` (new)

```typescript
export interface ObservationParser<TRaw = unknown, TPayload extends ObservationPayload = ObservationPayload> {
  readonly parserId: string
  readonly version: string
  parse(raw: TRaw, context: ParserContext): ParseResult<TPayload>
  validate(payload: TPayload): ValidationResult
}
```

### File: `backend/plane-b/src/handlers/contract-test.ts` (new)

Loads 20+ stored payloads per provider from S3 (Bronze lake), composed of:
- **Last 15 recent successes** — latest working payloads for regression detection
- **5+ curated historical edge cases** — stored under `curated_edge_cases/` prefix in S3 per module, maintained by engineers during provider onboarding. Must include: weekend layouts, promotional banners, holiday variants, alternative locale renders, and any provider-specific quirks discovered during initial integration.

The `fetch_fixture_set` tool must include both recent and curated payloads. The curated edge case set is version-controlled and expanded whenever a new failure pattern is discovered and resolved.

Checks per payload:

1. Required fields present
2. Numeric values in sane ranges
3. Distribution within 3σ of historical baseline
4. No regression on other corridors

---

## 6. Observation Pipeline + Dual-Write

When `EMIT_OBSERVATIONS=true` (default: true for the new system):

```
Existing flow (unchanged — agent can repair both fetch.ts and parse.ts):
  fetch.ts → parse.ts → bronze-writer → quote-normalizer → silver.quote_record

New parallel flow (additive):
  quote-normalizer output → QuoteJobHandlerAdapter
    → ObservationEnvelope created
    → silver.observation (Postgres hot store, JSONB + hot columns)
    → S3 Parquet (cold store, full normalized_payload)
    → raw_payload_ref already exists in Bronze S3
```

Both writes happen in the same transaction where possible. If observation write fails, it does NOT block the existing quote_record write (observation write is best-effort during dual-write phase).

---

## 6.5. Factor Normalization Plane

### Problem

The Observation Pipeline (section 6) writes raw `ObservationEnvelope` records to `silver.observation`. The Triangulation Engine (section 10) computes weighted composite indices. Between these two layers, heterogeneous signal types require fundamentally different mathematical treatments before they become comparable. Quote observations produce bps spreads. Status pages produce binary outage states. Search trends produce Z-score deviations. News events require LLM semantic scoring. Without a normalization plane, the triangulation engine must contain all this extraction logic, creating a monolithic computation that is hard to test and extend.

### Architecture

```
silver.observation (raw ObservationEnvelopes from all signal layers)
    │
    ▼
NormalizationRouter (reads module.normalization_strategy from catalog.json)
    │
    ├── VolumePriceExtractor ──→ gold.factor (score_unit: 'bps')
    ├── ZScoreExtractor ───────→ gold.factor (score_unit: 'severity')
    ├── StepFunctionExtractor ─→ gold.factor (score_unit: 'severity')
    └── LlmSemanticExtractor ──→ gold.factor (score_unit: 'severity')
    │
    ▼
gold.factor (standardized 0-100 scores with confidence)
    │
    ▼
Triangulation Engine (reads gold.factor for non-quote signals)
```

### Files under `backend/plane-b/src/normalization/` (new)

**`types.ts`** — `FactorExtractor` interface + `NormalizationContext` type (see section 2.8)

**`router.ts`** — `NormalizationRouter`:
1. Receives `ObservationEnvelope` (from SQS `normalization-queue` or direct invocation)
2. Loads `ModuleSpec` for `envelope.module_id`
3. Reads `normalization_strategy` from module spec
4. Instantiates matching `FactorExtractor`
5. Loads `NormalizationContext` (corridor tier, 90-day baselines from Redis cache)
6. Calls `extractor.extract(envelope, context)`
7. Writes resulting `Factor` to `gold.factor`
8. Logs to `silver.agent_action` with `action_type: 'factor_extraction'`

**`extractors/volume-price.ts`** — `VolumePriceExtractor`:
- Input: `QuoteObservationPayload` with implied_fx_rate, fee_amount
- Computes bps spread vs mid-market rate (from `gold.fx_rates`)
- Applies synthetic volume weights from existing TEER decomposition
- Output: `Factor` with `score_unit: 'bps'`

**`extractors/z-score.ts`** — `ZScoreExtractor`:
- Input: Continuous behavioral signals (app downloads, search trends, stablecoin flows, volume data)
- Loads 90-day rolling baselines (mean, stddev) from Redis cache
- Computes: `z = (value - mean_90d) / stddev_90d`, `score = min(100, abs(z) * 20)`
- Output: `Factor` with `score_unit: 'severity'`
- Handles cold-start: when <30 days of data, confidence is proportionally reduced

**`extractors/step-function.ts`** — `StepFunctionExtractor`:
- Input: Binary/categorical signals (PSP status, sanctions additions/removals)
- Maps states to hard severity bounds:
  - `major_outage` → 90, `partial_outage` → 70, `degraded` → 40, `operational` → 0
  - Sanctions `addition` → 85, `modification` → 50, `removal` → -20 (improvement signal)
- Output: `Factor` with `score_unit: 'severity'`

**`extractors/llm-semantic.ts`** — `LlmSemanticExtractor`:
- Input: Unstructured text signals (field reports, news events, displacement data)
- Constructs structured LLM prompt with scoring rubric (0-100 severity scale)
- LLM returns JSON: `{ score: number, reasoning: string, confidence: number }`
- **Version discipline**: The LLM prompt text is hashed and included in `methodology_version`. Changing the prompt triggers a new methodology version so institutional clients can track index behavior changes via the correction ledger.
- Output: `Factor` with `score_unit: 'severity'`
- Rate-limited: max 100 LLM extractions/hour (configurable)

### ModuleSpec extension for normalization

Add `normalization_strategy` to `ModuleSpec` type (section 2.1):

```typescript
// Add to ModuleSpec:
normalization_strategy: 'volume_price' | 'z_score' | 'step_function' | 'llm_semantic' | null
```

Default mapping when `normalization_strategy` is null:

| Signal Layer | Default Strategy |
|-------------|-----------------|
| `quote` | `volume_price` |
| `micro` | `step_function` |
| `digital_exhaust` | `z_score` |
| `macro` | `step_function` |
| `onchain` | `z_score` |
| `human` | `llm_semantic` |
| `volume` | `z_score` |

### Async processing

Factor normalization runs asynchronously via the `normalization-queue` SQS queue. When an `ObservationEnvelope` is written to `silver.observation`, a message is emitted to the normalization queue. The `NormalizationWorkerTask` (ECS) consumes messages and runs the appropriate extractor. This prevents slow LLM calls (for `llm_semantic`) from backing up Lane A tick dispatching.

---

## 7. Self-Healing Pipeline

### File: `backend/plane-b/src/agents/orchestrator.ts` (new)

```
BaseCollector fails 3+ consecutive times for same module+corridor
    │
    ▼
assembleFailureBundle():
  - Read current parse.ts source code
  - Read current fetch.ts source code
  - Load raw payload from S3 (the one that failed)
  - Load last-known-good payload + output from S3
  - Load expected schema (Zod → JSON Schema)
  - Load last 5 failures for pattern detection
  - Classify failure layer: fetch-layer (http_error, fetch_contract_change,
    session_flow_break, timeout) vs parse-layer (parse_error, schema_change,
    validation_failed) vs access-layer (block_detected → quarantine)
    │
    ▼
Emit to SQS agent-failure queue
    │
    ▼
Agent orchestrator (SQS consumer) receives FailureBundle
    │
    ▼
Eligibility check:
  - Module not quarantined? ✓
  - Module not PII-flagged? ✓
  - Failure count < escalation threshold (10)? ✓
  - Module auto-heal enabled? ✓
    │
    ▼
Repair Strategy selection:
  - Read module.capture_method from catalog.json
  - Map to RepairStrategy via STRATEGY_MAP (or module's repair_strategy_override)
  - Strategy assembles diagnostic context for BOTH layers:
    • DomScraperRepair:
      - Parse layer: DOM diff, CSS selector tests, Playwright captures
      - Fetch layer: session flow trace, redirect chain, cookie/CSRF analysis
    • StructuredApiRepair:
      - Parse layer: JSON schema diff, response shape analysis
      - Fetch layer: endpoint probe, header diffs, path/method discovery
    • DocumentExtractorRepair:
      - Parse layer: PDF text extraction, regex/bounding-box tests
      - Fetch layer: URL construction validation, content-type negotiation
    │
    ▼
Failure layer routing:
  - fetch-layer failures → LLM context emphasizes fetch.ts + HTTP diagnostics
  - parse-layer failures → LLM context emphasizes parse.ts + payload diagnostics
  - mixed failures (fetch changed → parse broke) → LLM gets both in context,
    with instruction to fix fetch.ts first, then validate parse.ts still works
    │
    ▼
Knowledge Plane search:
  - Find similar past failures and their resolutions
  - Load relevant fetch.ts and parse.ts examples from similar providers
    │
    ▼
LLM prompt construction (via RepairStrategy.buildSystemPrompt()):
  1. Strategy-specific system prompt (preserves function signatures, no new deps)
  2. Current fetch.ts source (for fetch-layer or mixed failures)
  3. Current parse.ts source (for parse-layer or mixed failures)
  4. Diagnostic artifacts from strategy (DOM diffs, schema diffs, header diffs,
     session traces, or extracted text — depending on failure layer)
  5. Failing raw payload (truncated 10KB)
  6. Last-known-good payload + expected output
  7. Expected schema
  8. Similar past fixes from Knowledge Plane
  9. Fetch safety constraints (see "Fetch Repair Safety Rails" below)
    │
    ▼
Tool Gateway: strategy's getAllowedTools() gates which tools the LLM can invoke
    │
    ▼
LLM generates proposed patch (fetch.ts, parse.ts, or both)
    │
    ▼
Fetch safety validation (for patches touching fetch.ts):
  - Static analysis: no hardcoded credentials, no new secret imports
  - URL allowlist check: base URL must match catalog's registered endpoint
  - No TLS/cert validation changes
  - No rate-limit/throttle removal
  - No new external dependencies (same dep constraint as parse.ts)
    │
    ▼
Type-check: tsc --noEmit on proposed patch(es)
    │
    ▼
Contract tests: run against 20+ stored payloads (15 recent successes + 5+ curated edge cases)
  - For fetch.ts patches: integration tests replay stored HTTP fixtures (request + response pairs)
  - For parse.ts patches: unit tests run parser against stored payloads
  - For dual patches: both test suites must pass
    │
    ├── ALL PASS → Create GitHub PR:
    │     - Branch: agent/fix-<module_id>-<bundle_id>
    │     - PR body: FailureBundle summary + contract test results + diff
    │     - Label: `agent/parse-fix` or `agent/fetch-fix` or `agent/dual-fix`
    │     - fetch.ts patches get additional label: `requires-fetch-review`
    │     - Slack notification to channel
    │     - FailureBundle status → 'patch_proposed'
    │     - Log to silver.agent_action
    │
    └── ANY FAIL → Create GitHub Issue:
          - Issue body: FailureBundle + proposed patch + test failures
          - Slack alert
          - FailureBundle status → 'escalated'
          - Log to silver.agent_action
```

#### Fetch Repair Safety Rails

When the agent proposes changes to `fetch.ts`, additional constraints apply beyond the standard parse.ts guardrails:

1. **URL allowlist**: The agent MUST NOT change the base URL/domain of any HTTP request. The provider's registered endpoint in `catalog.json` is the only allowed origin. Path segments, query parameters, and content-type negotiation headers may change.
2. **No credential injection**: The agent MUST NOT add, modify, or reference any secrets, API keys, tokens, or authentication credentials. If a provider starts requiring auth, the failure is `block_detected` → quarantine, not a fetch.ts repair.
3. **No TLS/certificate changes**: The agent MUST NOT modify TLS settings, certificate validation, proxy configuration, or custom CA bundles.
4. **Rate limit preservation**: The agent MUST NOT remove or weaken rate limiting, retry backoff, or throttle logic. It MAY adjust retry counts (±1) or timeout durations.
5. **Session flow bounds**: For HTML scrapers with session flows (cookie chains, CSRF tokens), the agent MAY update cookie extraction selectors, CSRF token field names, and redirect-following logic. It MUST NOT add new authentication steps or login flows.
6. **Header safety**: The agent MAY add or update HTTP headers (Accept, Content-Type, User-Agent, custom API version headers). It MUST NOT add Authorization, Cookie (manual), or Proxy-* headers.
7. **Dependency lockdown**: Same as parse.ts — no new npm dependencies. All changes must use existing imports.
8. **PR labeling**: All PRs touching fetch.ts receive the `requires-fetch-review` label. In v1 (propose-only) this is informational. In future v2 (auto-deploy), fetch.ts PRs are excluded from auto-deploy and always require human merge.

### Notification Architecture

All agent notifications use structured, actionable message formats.

**Slack Block Kit Messages** (via `@slack/bolt`, channel from `config.agent.slackChannel`):

*Successful patch proposal*:
```json
{
  "blocks": [
    { "type": "header", "text": "Parser Patch Proposed" },
    { "type": "section", "fields": [
      { "type": "mrkdwn", "text": "*Module:* `wise_quote`" },
      { "type": "mrkdwn", "text": "*Corridor:* USD_INR" },
      { "type": "mrkdwn", "text": "*PR:* <https://github.com/.../pull/42|#42>" },
      { "type": "mrkdwn", "text": "*Contract Tests:* 22/22 passed" }
    ]},
    { "type": "section", "text": { "type": "mrkdwn", "text": "*Corridor Impact:* Low — 1 of 12 corridors affected" }},
    { "type": "actions", "elements": [
      { "type": "button", "text": { "type": "plain_text", "text": "View PR" }, "url": "..." },
      { "type": "button", "text": { "type": "plain_text", "text": "View Bundle" }, "url": "..." }
    ]}
  ]
}
```

*Escalation (agent cannot self-heal)*:
```json
{
  "blocks": [
    { "type": "header", "text": "Repair Escalation" },
    { "type": "section", "fields": [
      { "type": "mrkdwn", "text": "*Module:* `koronapay_quote`" },
      { "type": "mrkdwn", "text": "*Failure Type:* schema_change" },
      { "type": "mrkdwn", "text": "*Retry Count:* 7/10" },
      { "type": "mrkdwn", "text": "*On-Call:* @sre-team" }
    ]},
    { "type": "section", "text": { "type": "mrkdwn", "text": "*Bundle:* <link|FB-abc123>" }},
    { "type": "context", "elements": [
      { "type": "mrkdwn", "text": "Failure persisting for 2h 15m. Contract tests failing on field `receive_amount`." }
    ]}
  ]
}
```

*Corridor stress alert*:
```json
{
  "blocks": [
    { "type": "header", "text": "Corridor Stress: USD_NGN" },
    { "type": "section", "fields": [
      { "type": "mrkdwn", "text": "*Stress Score:* 72 (HIGH)" },
      { "type": "mrkdwn", "text": "*Confidence:* 0.85" },
      { "type": "mrkdwn", "text": "*Top Signal:* TEER premium +340bps" },
      { "type": "mrkdwn", "text": "*Contributing:* quote, status, human" }
    ]},
    { "type": "section", "text": { "type": "mrkdwn", "text": "*Suggested Actions:* Probe frequency increased 2x. 3 providers degraded." }}
  ]
}
```

**New Relic Custom Events** (fired via New Relic APM agent or Events API):

| Event Name | When Fired | Key Attributes |
|-----------|-----------|----------------|
| `AgentAction` | Every LLM invocation during repair | `module_id`, `model`, `input_tokens`, `output_tokens`, `compile_success`, `duration_ms`, `repair_strategy` |
| `CorridorStressSpike` | Stress score crosses threshold (25/50/75) | `corridor_id`, `score`, `previous_score`, `threshold`, `confidence`, `contributing_signals` |
| `NormalizationLatency` | Every factor extraction completes | `module_id`, `strategy`, `duration_ms`, `success`, `score`, `llm_tokens` (if applicable) |
| `CalibrationEvent` | Human observation diverges >5% from TEER | `corridor_id`, `collector_tier`, `discrepancy_pct`, `human_rate`, `teer_rate` |
| `ContractTestRun` | Contract tests executed for any reason | `module_id`, `test_count`, `pass_count`, `fail_count`, `trigger` (repair/deploy/manual) |

### Pluggable LLM Client (`backend/plane-b/src/agents/llm-client.ts`)

```typescript
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

export class ClaudeLlmClient implements LlmClient {
  // Uses Anthropic SDK (@anthropic-ai/sdk)
  // API key from Secrets Manager via config.agent.llmApiKeySecretArn
  // Model from config.agent.llmModel (default: 'claude-sonnet-4-6')
}
```

---

## 8. Tool Gateway

### File: `backend/plane-b/src/agents/tool-gateway.ts` (new)

Trusted execution boundary for all agent tool use:

```typescript
export class ToolGateway {
  async executeToolRequest(request: ToolRequest): Promise<ToolResult> {
    // 1. Load ModuleSpec for request.module_id
    // 2. Validate: tool_type in module's policy_flags.allowed_tool_types?
    // 3. Validate: capture_profile resolves to URL in module's allowed_domains?
    // 4. Validate: geo restrictions not violated?
    // 5. Validate: tool request budget not exceeded (daily limit)?
    // 6. If any check fails: log denial to agent_tool_request, return denied
    // 7. Execute tool:
    //    - debug_capture: Playwright screenshot + HAR (sandboxed, no logins)
    //    - dom_diff: compare current DOM signature to last_dom_signature_hash
    //    - search_knowledge: query Knowledge Plane
    //    - fetch_fixture_set: load contract test fixtures from S3
    //    - run_contract_test: execute contract tests on proposed parser
    // 8. Redact PII from result
    // 9. Log to agent_tool_request + agent_tool_result
    // 10. Return ToolResult
  }
}
```

**Critical**: The agent NEVER constructs URLs. The module defines URL templates via `capture_profile_id`, and the Tool Gateway resolves actual URLs internally.

---

## 9. Knowledge Plane

### File: `backend/plane-b/src/agents/knowledge-plane.ts` (new)

```typescript
export class KnowledgePlane {
  // pgvector in existing Aurora PostgreSQL

  async index(chunk: KnowledgeChunkInput): Promise<void> {
    // 1. Compute content_hash
    // 2. Check if chunk with same content_hash exists → skip if unchanged
    // 3. Generate embedding via Anthropic/OpenAI embedding API
    // 4. Store in silver.knowledge_chunk with embedding_model_id, source_commit_sha
  }

  async search(query: string, options: SearchOptions): Promise<KnowledgeResult[]> {
    // Hybrid retrieval:
    // 1. BM25 via PostgreSQL full-text search (ts_vector + ts_query)
    // 2. Vector similarity via pgvector (cosine distance)
    // 3. Rerank: combine scores, prefer recent chunks
    // Return top-K results with source_ref, content snippet, similarity score
  }
}
```

**What gets indexed**:
- All 24 provider `fetch.ts` files
- All 24 provider `parse.ts` files
- All observation payload schemas
- Historical FailureBundles (success and failure)
- RAG docs from `agents/rag/*.md`
- Runbooks from `docs/runbooks/*.md`

**Ingestion triggers**:
- CI job on merge → re-index changed code files
- Daily job → index recent FailureBundles
- On runbook file change → re-index

**Stale embedding prevention**:
- Store `content_hash` (sha256 of content) — re-embed when changed
- Store `source_commit_sha` — track which commit produced the chunk
- Store `embedding_model_id` — re-embed when model changes
- Prefer recent chunks in reranking

---

## 10. Triangulation Engine

### Files under `backend/plane-b/src/triangulation/` (new)

For the current phase, triangulation computes corridor stress from **existing TEER/RCI/RVI data only**. The signal combiner is pluggable — future signal layers plug into it without changing the engine.

**`corridor-stress.ts`**: Computes `corridor_stress_score` (0-100) from existing gold indices:
- TEER premium vs mid-market (weight 0.25)
- RCI dispersion (weight 0.10)
- Provider count drop (weight 0.15) — fewer providers quoting = potential stress
- Anomaly detector Z-scores (weight 0.20) — from existing `anomaly-detector.ts`
- Freshness SLO violations (weight 0.15) — corridors with stale data
- Circuit breaker state (weight 0.15) — providers in circuit-break = rail issues

**`signal-combiner.ts`**: Weighted signal combination with:
- Re-normalization for missing signals
- Confidence = sum of available signal weights
- Suppression when confidence < 0.3
- Pluggable: `addSignalSource(name, weight, extractor)` for future layers

**`stress-events.ts`**: Emits `CorridorStressEvent` to SQS when:
- Score crosses threshold (25=elevated, 50=high, 75=critical)
- Score changes by > 10 points in one interval

**`engine.ts`**: Main loop — runs every 5 min (Tier 1) / 30 min (Tier 2). Reads from `gold_export.cdp_daily` + `silver.observation` → writes to `gold.triangulated_index`.

---

## 11. Adaptive Probing

### File: `backend/plane-b/src/agents/stress-responder.ts` (new)

Consumes `CorridorStressEvent` from SQS `agent-stress` queue:

```typescript
async function handleStressEvent(event: CorridorStressEvent): Promise<void> {
  // ELEVATED (score > 25): increase cadence 2× for existing providers on this corridor
  //   → Write Redis cadence override (TTL 60 min, max 4× multiplier)
  //   → dispatch_queue reads override on next scheduling cycle

  // HIGH (score > 50): expand amount buckets
  //   → Add [50, 200, 5000] to standard [100, 500, 1000, 3000, 10000]

  // CRITICAL (score > 75): log alert, notify Slack, maximum probe frequency

  // Auto-revert: when score drops below (threshold - 10), remove overrides
  // TTL expiry: overrides auto-expire even if stress doesn't subside
  // All actions logged to silver.agent_action
}
```

**Integration with existing `BaseCollector`**: Add method `checkCadenceOverride(corridorId: string)` that reads Redis. If override exists and not expired, use overridden cadence. Otherwise use default from ModuleSpec.

---

## 12. Index Governance + Three-Axis Versioning

### Three axes stored on every output record:

| Axis | Column | Current Value | When It Changes |
|------|--------|---------------|-----------------|
| `parser_version` | On ObservationEnvelope, NormalizedQuote | Provider-specific, e.g., `1.0.0` | parse.ts logic changes |
| `schema_version` | On ObservationEnvelope | `1.0.0` (initial) | Payload fields added/removed |
| `methodology_version` | On gold_export.cdp_daily, gold.triangulated_index | `indices_v2` (existing) | Index computation rules change |

### Publication Protocol

- `publication_status`: `provisional` (first 24h after computation) → `final` (after validation window)
- `gold.index_correction` table records (old_value, new_value, reason, methodology_version, evidence_refs)
- API: `GET /indices/:corridor_id?as_of=<timestamp>&methodology=<version>` returns point-in-time data

### Reprocessing

When `parser_version` changes:
1. Load raw payloads from Bronze S3
2. Run new parser → produce new observations
3. Write versioned outputs alongside originals
4. Recompute indices under same methodology
5. **Never silently overwrite published `final` data**

---

## 13. Total Collection Error Framework

Four measurable error classes, computed and dashboarded for all 24 existing providers:

### SLIs computed per provider per corridor:

**Measurement error**: parse_success_rate, field_completeness, unit_validation_pass_rate, drift_flag_count
**Coverage error**: corridor_coverage_pct, rail_coverage_pct, provider_count_per_corridor
**Sampling error**: cadence_adequacy_ratio, amount_bucket_coverage, time_of_day_representativeness
**Nonresponse error**: job_success_pct, error_type_rates, staleness_distribution, dlq_rate

### Dashboard (CloudWatch/New Relic):
- Heat map: providers × error types → severity
- Time series: error class trends over 30 days
- Corridor data quality score = f(measurement, coverage, sampling, nonresponse)
- Score gates Gold exports

---

## 14. Temporal Workflows (Lane B)

### Setup

- Use Temporal Cloud (managed) OR self-hosted Temporal server
- TypeScript SDK (`@temporalio/workflow`, `@temporalio/activity`, `@temporalio/worker`)
- Worker runs as ECS Fargate task

### Workflows to implement:

**ModuleRepairWorkflow**:
```
Signal: FailureBundle received
  → Activity: assembleContext (load fetch.ts, parse.ts, fixtures, schema)
  → Activity: classifyFailureLayer (fetch-layer vs parse-layer vs mixed)
  → Activity: proposePatch (call LLM via LlmClient, strategy-routed)
  → Activity: validateFetchSafety (if patch touches fetch.ts)
  → Activity: runContractTests (validate against fixtures)
  → Decision: tests pass?
    → YES: Activity: createGitHubPR (via Brain/executor)
    → NO: Activity: createGitHubIssue + Slack alert
  → Wait for signal: PR merged or closed
  → If merged: Activity: verifyDeployment (check error rates)
```

**ModuleOnboardingWorkflow** (for future modules — workflow exists, ready to use):
```
Signal: new module registration
  → Activity: validateLegalBasis
  → Activity: createModuleSpec
  → Activity: bootstrapFixtures
  → Activity: runContractTests
  → Activity: canaryRollout (10% → 50% → 100%)
  → Wait for signal: canary success window
  → Activity: promote to full production
```

**BackfillWorkflow**:
```
Signal: parser_version changed for module X
  → Activity: loadRawPayloads (time range from S3)
  → Activity: reparse (batch, new parser version)
  → Activity: writeVersionedObservations
  → Activity: recomputeIndices (if methodology unchanged)
  → Activity: validateOutputs (compare to originals)
```

---

## 15. Module Onboarding Factory

The factory workflow exists in Temporal (see above). For current scope, it's validated by "re-onboarding" one existing provider (e.g., Wise) through the full flow to prove the machinery works.

### `.remit-scout/modules/catalog.json`

```json
{
  "schema_version": "1.0.0",
  "modules": [
    {
      "module_id": "wise_quote",
      "signal_layer": "quote",
      "capture_method": "api",
      "display_name": "Wise Quote Collector",
      "provider_id": "wise",
      "enabled": true,
      "default_cadence_seconds": 600,
      "freshness_slo_seconds": 1200,
      "rate_limit_rpm": 30,
      "severity_tier": 1,
      "policy_flags": {
        "legal_basis": "public_endpoint",
        "tos_reviewed": true,
        "redistribution_rights": "derived_only"
      }
    }
    // ... 23 more providers, same pattern
  ]
}
```

---

## 16. Quarantine System

Integrated into `ModuleRuntimeState` and enforced by:
- **Tick dispatcher**: quarantined modules are skipped (not scheduled)
- **Repair Agent**: detects quarantine triggers during failure analysis
- **SLO/Quality Agent**: monitors for silent degradation that should trigger quarantine

### Quarantine triggers:

| Trigger | Detection Method | Quarantine Reason | Recovery Path |
|---------|-----------------|-------------------|---------------|
| Auth wall (login required) | HTTP 401/403 + login page keywords | `auth_wall` | Switch to licensed API / partner feed. NEVER heal scraper. |
| ToS change | DOM diff detects ToS page change | `tos_change` | Legal re-review required before re-enabling |
| PII in payload | PII detector finds unexpected personal data | `pii_risk_detected` | Redact + review pipeline |
| Schema drift | Parse success rate drops below threshold + structural change detected | `schema_drift` | Repair Agent proposes fix, or manual intervention |
| Contractual rate limit | Provider sends explicit rate limit signal | `rate_limited` | Reduce cadence to contractual limit |
| Vendor outage | Status page shows major_outage (if status module exists) | `vendor_outage` | Auto-recheck after `quarantine_until` |

---

## 17. Infrastructure Changes (CDK)

### New SQS Queues (`infrastructure/cdk/lib/queues.ts`)

Add 4 queue pairs (each with DLQ):

- `agent-failure` / `agent-failure-dlq` (visibility timeout: 10 min, retention: 14 days) — FailureBundles → Repair Agent
- `agent-stress` / `agent-stress-dlq` (visibility timeout: 2 min, retention: 4 days) — stress events → stress-responder
- `tool-request` / `tool-request-dlq` (visibility timeout: 5 min, retention: 7 days) — agent tool requests → Tool Gateway
- `normalization-queue` / `normalization-dlq` (visibility timeout: 30 sec, retention: 4 days) — ObservationEnvelopes → NormalizationRouter for async factor extraction. Prevents slow LLM calls (LlmSemanticExtractor) from backing up Lane A tick dispatching.

### New ECS Tasks (`infrastructure/cdk/lib/ecs-tasks.ts`)

- `agentOrchestratorTask` — runs Repair Agent as SQS consumer (agent-failure queue)
- `stressResponderTask` — runs stress-responder as SQS consumer (agent-stress queue)
- `temporalWorkerTask` — runs Temporal worker for Lane B workflows
- `HeavyToolGatewayTask` — 4 vCPU, 8GB RAM. Dockerfile installs Chromium (for Playwright DOM captures), Ghostscript, and Poppler (for PDF text extraction). Used by `DocumentExtractorRepairStrategy` and `DomScraperRepairStrategy`. Runs as on-demand Fargate task invoked by Tool Gateway when repair strategies require heavy tools.
- `NormalizationWorkerTask` — Compute-optimized (2 vCPU, 4GB RAM). Consumes `normalization-queue`. Runs FactorExtractors including LLM calls for `LlmSemanticExtractor`. Scales 0-4 tasks based on queue depth.

### New Scheduled Jobs (`infrastructure/cdk/lib/scheduled-jobs.ts`)

- `triangulation-job` — runs every 5 min (Tier 1) / 30 min (Tier 2)
- `knowledge-indexer-job` — daily reindex of Knowledge Plane chunks
- `tce-dashboard-job` — daily Total Collection Error SLI computation
- `dispatch-queue-seeder-job` — seeds dispatch_queue from module_registry on deploy
- `z-score-baseline-job` — **nightly** batch job pre-computes 90-day rolling baselines (mean, stddev) for all `ZScoreExtractor` modules. Results stored in Redis with 25h TTL for O(1) lookup during factor extraction. Key pattern: `baseline:{module_id}:{corridor_id}` → `{ mean_90d, stddev_90d, sample_count, computed_at }`.

### Redis Statistical Cache

The `z-score-baseline-job` pre-computes and caches rolling statistical baselines:

- **Key pattern**: `baseline:{module_id}:{corridor_id}` → JSON `{ mean_90d, stddev_90d, sample_count, computed_at }`
- **TTL**: 25 hours (ensures fresh baseline even if nightly job runs slightly late)
- **Cold start**: If no cached baseline exists, `ZScoreExtractor` falls back to query-time computation against `silver.observation` (slower, but correct). Confidence is reduced proportionally to sample count.
- **Source**: `gold.factor` historical scores + `silver.observation` raw values

### IAM Permissions

- `HeavyToolGatewayTask` role needs:
  - `textract:AnalyzeDocument` — for PDF text extraction in `DocumentExtractorRepairStrategy`
  - `s3:GetObject` on `remit-scout-bronze-*` — for raw payload access
  - `s3:PutObject` on `remit-scout-human-proofs-vault` — for proof artifact storage
- `NormalizationWorkerTask` role needs:
  - `sqs:ReceiveMessage`, `sqs:DeleteMessage` on `normalization-queue`
  - `secretsmanager:GetSecretValue` for LLM API keys (LlmSemanticExtractor)
- Human proof vault Lambda needs:
  - `kms:Sign` for proof artifact signing
  - `s3:PutObject` with Object Lock compliance mode

---

## 18. Configuration

### `backend/shared/config.ts` additions

```typescript
// Add to existing config object:
agent: {
  enabled: boolean                    // master kill switch (default: true)
  llmProvider: 'anthropic' | 'openai'
  llmModel: string                    // default: 'claude-sonnet-4-6'
  llmApiKeySecretArn: string
  llmMaxTokens: number                // default: 4096
  llmTemperature: number              // default: 0.1
  autoDeployEnabled: boolean          // default: false (propose-only)
  canaryPercent: number               // default: 10
  canaryDurationMinutes: number       // default: 90
  failureThreshold: number            // consecutive failures before triggering (default: 3)
  escalationThreshold: number         // failures before human escalation (default: 10)
  maxPatchesPerDay: number            // rate limit on agent patches (default: 20)
  slackChannel: string
  githubRepo: string
},
triangulation: {
  enabled: boolean                    // default: true
  stressElevatedThreshold: number     // default: 25
  stressHighThreshold: number         // default: 50
  stressCriticalThreshold: number     // default: 75
  maxCadenceMultiplier: number        // default: 4
  cadenceOverrideTtlMinutes: number   // default: 60
},
toolGateway: {
  enabled: boolean                    // default: true
  maxDailyToolRequests: number        // default: 1000
  piiRedactionEnabled: boolean        // default: true
},
knowledgePlane: {
  enabled: boolean                    // default: true
  embeddingModel: string              // default: 'text-embedding-3-small'
  embeddingApiKeySecretArn: string
  maxChunksPerSearch: number          // default: 20
},
modules: {
  catalogPath: string                 // default: '.remit-scout/modules/catalog.json'
  emitObservations: boolean           // default: true
  observationRetentionDays: number    // default: 90 (hot store)
},
temporal: {
  enabled: boolean
  address: string                     // Temporal server address
  namespace: string                   // default: 'remit-scout'
  taskQueue: string                   // default: 'agent-workflows'
}
```

---

## 19. Existing File Modifications

### `backend/plane-b/src/collectors/base-collector.ts`

Three additions (all behind feature flags):

1. **Observation dual-write** (after `persistNormalizedQuote`):
```typescript
if (config.modules.emitObservations) {
  const envelope = buildObservationEnvelope(normalizedQuote, this.providerId, corridorId, this.ingestionRunId)
  await writeObservation(this.pool, envelope)
}
```

2. **FailureBundle emission** (in error handler, after 3+ consecutive failures):
```typescript
if (config.agent.enabled && this.consecutiveFailures >= config.agent.failureThreshold) {
  const bundle = await assembleFailureBundle(/* ... */)
  await emitToSqs(config.queues.agentFailureUrl, bundle)
}
```

3. **Dynamic cadence override** (in scheduling loop):
```typescript
const override = await checkCadenceOverride(this.providerId, corridorId)
const effectiveCadence = override ?? this.defaultCadence
```

### `backend/plane-b/src/providers/registry-builder.ts`

Extend `ProviderRegistryEntry` to carry an optional `JobHandler` reference:
```typescript
export type ProviderRegistryEntry = {
  // ... existing fields ...
  jobHandler?: JobHandler  // optional — set when QuoteJobHandlerAdapter wraps the collector
}
```

### `backend/plane-a/src/routes/indices.ts`

Add endpoint:
```typescript
// GET /api/v1/indices/triangulated/:corridor_id
// Query params: ?as_of=ISO_TIMESTAMP&methodology=VERSION
// Returns: { corridor_stress_score, confidence, contributing_signals, computed_at, methodology_version }
```

### `backend/plane-a/src/routes/corrections.ts` (new)

Client-facing correction API for institutional clients to query restatement records:
```typescript
// GET /api/v1/corrections
// Query params: ?corridor_id=USD_NGN&since=ISO_TIMESTAMP&index_type=teer
// Returns: Array<{ correction_id, corridor_id, index_type, computed_at, old_value, new_value, reason, methodology_version }>
// Auth: API key (partner_api_key) with 'corrections:read' scope
```

### `backend/plane-a/src/routes/human.ts` (new)

Human Audit API — dedicated ingestion endpoints for trusted field researchers:
```typescript
// POST /api/v1/human/observations
// Auth: Cognito User Pool (separate from institutional API clients)
// Body: HumanObservationPayload
// Validation: collector must be active, corridor in assigned_corridors
// Returns: { observation_id, status: 'accepted' }

// GET /api/v1/human/my-submissions
// Auth: Cognito User Pool
// Query params: ?since=ISO_TIMESTAMP&limit=50
// Returns: Array<ObservationEnvelope> (filtered to requester's collector_id)

// POST /api/v1/human/proof-upload
// Auth: Cognito User Pool
// Body: { filename, content_type }
// Returns: { upload_url: string, artifact_ref: string }
// Generates pre-signed S3 upload URL for proof artifacts (remit-scout-human-proofs-vault bucket)
// At upload completion: EXIF stripped, GPS stripped, file signed with KMS key
```

### Cryptographic Proof Storage

S3 bucket `remit-scout-human-proofs-vault`:
- **At ingestion**: Lambda trigger strips EXIF/GPS metadata, signs file with AWS KMS key
- **Immutability**: S3 Object Lock (compliance mode) prevents deletion
- **Retention**: 7 years (regulatory compliance)
- **Access**: Only Plane B (for calibration) and authorized auditors via pre-signed URLs

---

## 20. Index Semantic Rules

Hard constraints enforced in code:

| Index | Allowed Inputs | NOT Allowed |
|-------|----------------|-------------|
| **TEER** (price-level) | Fees, spreads, markups in bps/effective rate; mid-market from OANDA | Status incidents, policy shocks, behavioral signals |
| **RVI** (volatility) | Dispersion surfaces, tail behavior, provider rate variance | Incident counts, sanctions (these *condition* RVI as regime labels) |
| **RCI** (constraints) | Status degradation, corridor disablements, sanctions/policy | Raw FX rates or fee data |
| **Composites** | All + app intel + on-chain + human | Must include `confidence` + `contributing_signals` |

---

## 21. Failure Recovery Flows

| Failure Mode | Failure Layer | Response |
|-------------|---------------|----------|
| HTML drift (selectors changed) | parse | Repair Agent → parse.ts patch → contract tests → PR → canary |
| API response schema changed | parse | Repair Agent → parse.ts patch → contract tests → PR |
| API endpoint path/method changed | fetch | Repair Agent → fetch.ts patch → integration tests → PR (`requires-fetch-review`) |
| Required headers changed | fetch | Repair Agent → fetch.ts patch (header updates) → integration tests → PR (`requires-fetch-review`) |
| Session cookie flow changed (public) | fetch | Repair Agent → fetch.ts patch (cookie/CSRF selectors) → integration tests → PR (`requires-fetch-review`) |
| Content-type negotiation changed | fetch | Repair Agent → fetch.ts patch → integration tests → PR (`requires-fetch-review`) |
| HTML drift + session flow changed | mixed | Repair Agent → dual patch (fetch.ts + parse.ts) → both test suites → PR (`requires-fetch-review`) |
| Auth wall / login required | access | **Quarantine** → `auth_wall` → switch collection strategy. NEVER heal scraper. |
| ToS change detected | access | **Quarantine** → `tos_change` → legal re-review required |
| PII in payload | access | **Quarantine** → `pii_risk_detected` → redact + review |
| Schema drift (fundamental) | parse | Repair Agent proposes fix → contract tests → PR. If fundamental, quarantine. |
| Rate limited (contractual) | access | **Quarantine** → `rate_limited` → reduce to contractual limit |
| Vendor outage | infra | **Quarantine** → `vendor_outage` → auto-recheck after TTL |

---

## 22. Compounding Moat Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| MTTD | Mean time to detect connector breakage | < 15 min (Tier 1) |
| MTTR | Mean time to recovery (auto vs human) | Auto < 30 min, human < 4 hours |
| Crisis coverage | % Tier-1 corridors meeting freshness SLO during stress | > 95% |
| Self-heal success rate | % persistent failures yielding passing patch | > 60% |
| Index confidence continuity | Confidence stability when signals drop | Graceful degradation |

Instrumented via CloudWatch custom metrics + New Relic dashboards.

---

## 23. RAG Documents

Already created and maintained at:
- `agents/rag/triangulation-engine.md`
- `agents/rag/agent-orchestration.md`
- `agents/rag/signal-modules.md`
- `agents/rag/index-governance.md`

These are consumed by coding agents (Claude, Cursor, Codex) when working on the codebase.

---

## 24. Verification Checklists

### Phase 0: Types + Migrations
- [ ] `pnpm -C backend typecheck` passes with all new types
- [ ] Migrations 089, 090, 091 apply cleanly on dev
- [ ] Existing TEER/RCI/RVI computation unchanged
- [ ] All 24 existing provider tests pass

### Phase 1: Tool Gateway + Knowledge Plane
- [ ] Tool Gateway validates, logs, and redacts tool requests
- [ ] Knowledge Plane indexes all 24 provider fetch.ts and parse.ts files
- [ ] Hybrid search returns relevant results for known failure patterns
- [ ] Denied tool requests are logged with denial reason

### Phase 2: JobHandler + Dual-Write
- [ ] QuoteJobHandlerAdapter wraps all 24 collectors
- [ ] Observations appear in `silver.observation` for all 24 providers
- [ ] `payload_hash` enables dedup
- [ ] Hot columns populated for quote signals
- [ ] S3 Parquet cold store receives full payloads
- [ ] Existing `silver.quote_record` writes unchanged

### Phase 3: Self-Healing Pipeline
- [ ] FailureBundle emitted after 3+ consecutive failures
- [ ] LLM proposes valid parse.ts and/or fetch.ts patch
- [ ] Fetch safety validation blocks credential injection, URL domain changes, TLS changes
- [ ] PRs touching fetch.ts receive `requires-fetch-review` label
- [ ] Integration tests replay stored HTTP fixtures for fetch.ts patches
- [ ] Contract tests run against 20+ stored fixtures per provider
- [ ] GitHub PR created with patch + test results
- [ ] Slack notification sent
- [ ] All actions logged to `silver.agent_action`
- [ ] Quarantine triggered for auth_wall, tos_change, pii_risk

### Phase 4: Dispatch Queue + Tick Dispatcher
- [ ] All 24 providers seeded in `dispatch_queue`
- [ ] SKIP LOCKED scheduling works under concurrent dispatchers
- [ ] Priority ordering respects tier + stress escalation
- [ ] Token buckets enforce per-module budgets
- [ ] Quarantined modules skipped

### Phase 5: Triangulation + Adaptive Probing
- [ ] Corridor stress scores computed from existing TEER/RCI/RVI
- [ ] Stress events emitted on threshold crossings
- [ ] Adaptive probing adjusts cadence for existing providers
- [ ] Cadence overrides have TTL and auto-expire
- [ ] Signal combiner is pluggable (future signals can be added)

### Phase 5.5: Factor Normalization Plane
- [ ] NormalizationRouter reads `normalization_strategy` from catalog.json
- [ ] VolumePriceExtractor produces correct bps factors for quote observations
- [ ] ZScoreExtractor loads baselines from Redis cache (or falls back to query-time)
- [ ] StepFunctionExtractor maps status states to correct severity scores
- [ ] LlmSemanticExtractor produces deterministic severity scores with prompt versioning
- [ ] `gold.factor` table populated with standardized factors
- [ ] `normalization-queue` SQS processing works end-to-end
- [ ] NormalizationWorkerTask scales based on queue depth
- [ ] `z-score-baseline-job` pre-computes and caches rolling baselines in Redis
- [ ] Triangulation engine reads from `gold.factor` for non-quote signals

### Phase 5.6: Human Sensor Network
- [ ] `silver.human_sensor_profile` table created and populated
- [ ] Human Audit API endpoints authenticated via Cognito
- [ ] Proof upload generates pre-signed URL and strips EXIF/GPS on completion
- [ ] Calibration hook detects >5% discrepancy and logs CalibrationEvent
- [ ] Tier promotion rules enforced (tier 1→2→3 based on submissions + trust score)
- [ ] Human observations flow through LlmSemanticExtractor to `gold.factor`

### Phase 6: Index Governance + Temporal
- [ ] Three-axis versioning on all gold outputs
- [ ] Publication protocol (provisional → final) operational
- [ ] As-of query endpoint returns point-in-time data
- [ ] Correction ledger records changes
- [ ] Corrections API (`/api/v1/corrections`) returns restatement records
- [ ] Temporal worker runs ModuleRepairWorkflow successfully
- [ ] Module Onboarding Factory workflow validated with one existing provider
- [ ] Total Collection Error SLIs computed for all 24 providers
- [ ] MTTD/MTTR baseline established

### Phase 7: Repair Strategy Validation
- [ ] DomScraperRepairStrategy assembles DOM diff context for HTML providers
- [ ] StructuredApiRepairStrategy assembles schema diff context for API providers
- [ ] DocumentExtractorRepairStrategy extracts PDF text via Textract
- [ ] Strategy routing maps capture_method correctly for all 24 providers
- [ ] HeavyToolGatewayTask runs Chromium/Ghostscript/Poppler tools successfully
- [ ] Schema pre-flight validation blocks agent execution on invalid catalog.json
- [ ] Contract tests include curated edge cases alongside recent successes
- [ ] New Relic custom events fire for all specified event types
- [ ] Slack Block Kit messages render correctly for all notification types
