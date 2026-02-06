# Remit-Scout Architecture Guide (ARCHITECTURE.md)

## Purpose
This file is the primary reference for Remit-Scout architecture. It defines key system boundaries, major data flows, AWS wiring, tiering rules, and operational health checks. Treat this document as the main architectural source unless explicitly overridden.

## How to use this file
- Always consult this architecture guide before making major changes or proposing system-level design updates.
- Use the information here as a grounding reference. Do not assume existence of undocumented system modules or flows.
- In cases of uncertainty, prioritize correctness, observability, and AWS compatibility over local development shortcuts.

## RAG self-healing policy
- Agents or contributors who discover gaps that impact multiple system components should suggest updates to this file.
- Gaps that are agent-specific should be fixed in relevant agent documentation or RAG files.
- Only apply edits when authorized; otherwise, suggest changes for review or approval.

## System invariants (must not break)
- Plane A must never read Bronze data directly.
- All public APIs must validate inputs and return stable response schemas.
- Silver is the primary source of truth for alert evaluations; Gold is used for aggregates.
- Tier assignments are versioned; historical assignments are immutable.
- All exports should normalize to a $500 USD equivalent in the sending currency and include the relevant destination value.
- The rights matrix is always authoritative: provider eligibility for corridors and methods must be explicit.
- A NULL/empty rights-matrix country set must **not** match all corridors.
- Amount buckets are exact by default. B2C may allow an approximate bucket **only** when
  `PLANE_A_B2C_MAX_BUCKET_DELTA_PCT > 0`; responses must include `approximate` +
  `bucket_delta_pct`. If outside tolerance, reject or enqueue a new request. B2B remains exact.
- Method filters must only allow methods supported by providers.
- Indices must respect rights-matrix allowlists (`allowed_in_teer`, `allowed_in_rci`, `allowed_in_rvi`) in both Gold and live API computations.

## Environment model
- **dev**: optimized for speed of iteration, short TTLs, lower capacity.
- **staging**: mirrors production for networking and security validation.
- **prod**: high SLOs, zero-risk changes, full auditability.

## Data flow overview
- **Ingest**: Plane B collectors → Bronze (raw) → Silver (normalized)
- **Refresh**: B2C requests trigger refresh workflows → Plane B refresh workers → Silver updates
- **Publish**: Gold jobs aggregate from Silver → Plane C publishes (scheduled backfill + live queue updates)
- **Serve**: Plane A serves clients with Redis hot cache for fast access
See below for canonical definitions; treat this as a high-level summary.

## Sweep mechanics (B2B vs B2C)
- **B2C sweeps**: user-driven, enqueue SQS requests, refresh workflows update Silver and warm caches.
- **B2B sweeps**: scheduled via EventBridge, corridor-first fanout to SQS, collectors ingest to Bronze/Silver, Gold aggregation per cadence.
- **Tier assignment**: code-based rules in `corridor-tiers.ts`; US-origin corridors are tier_1, others tier_2.
- **Macro-only model**: only curated macro corridors (~7,500 lanes) are scheduled via `macro-corridors.ts`.
- **Storage**: Bronze (raw), Silver (normalized), Gold (aggregated: history, pulse, popular corridors).

## Readiness gates
- Gold publishing requires provider coverage and quality.
- Alerts only trigger when coverage and data freshness are above threshold.
- Tier changes only take effect for future periods (snapshots are monthly/quarterly).
- Indices readiness (TEER/RCI/RVI) requires passing availability, suppression, and weight-confidence SLOs
  produced by the data-health SLO job.

## Cadence tiers (2-tier model)

### Collection Tiers (scraping cadence)
- **Tier-1 Collection:** US-origin (USD) macro corridors; scraped every 10 minutes.
- **Tier-2 Collection:** All other macro corridors; scraped every 3 hours.
- Tier assignment is code-based in `corridor-tiers.ts`: US-origin corridors = tier_1, others = tier_2.
- Only macro corridors (~7,500 curated lanes) are scheduled; hardcoded in `macro-corridors.ts`.

### Export Tiers (API/data access)
- **Tier 1 Export:** Only USD-origin corridors (10 min freshness guarantee).
- **Tier 2 Export:** ALL corridors (includes USD + non-USD).
  - USD corridor data comes from Tier-1 collection (fresher, every 10 min)
  - Non-USD data comes from Tier-2 collection (every 3 hours)
  - Reported SLA for Tier 2 is 3 hours (even though USD data is fresher)
  - **No duplicate scraping** - USD data is reused from Tier 1 collection
- Enterprise customers on Tier 2 plan get USD corridors "for free" without additional scraping load.

**Tier-1 override (dev/staging):**
- When `PLANE_B_DISABLE_TIER1=1`, Tier 1 is effectively disabled and **all corridors collect at Tier 2 cadence (3 hours)**.
- Tier 1 infrastructure remains provisioned but unused; Tier 1 API still exposes USD corridors, but cadence reflects Tier 2.

## Synthetic weighting for indices (TEER/RCI/RVI)
- Indices use **synthetic volume weights** derived from quote frequency, spread stability, and recency.
- Weights are computed by the scheduled **provider-weighting** job (Plane C Lambda) and stored in `gold.provider_weight_snapshot`.
- Live (Plane A) and Gold indices consume the same snapshot weights for consistency.
- Sparse corridors blend corridor weights with **global weights** (`corridor_id='__global__'`) using `weight_confidence`.

### Weighting model (current implementation)
- **Inputs** (B2B-only, production-eligible quotes):
  - `silver.quote_record` joined to `silver.ingestion_run`, `silver.rights_matrix`,
    and `silver.provider_corridor_capability`.
  - Filters: `collector_type LIKE 'b2b_%'`, `rm.allowed_collect/allowed_b2b/allowed_resell_b2b`,
    `rm.status='production'`, `rm.stoplist_status='active'`,
    and `allowed_in_teer/rci/rvi` true for at least one index.
- **Scores**:
  - Frequency score: `log1p(provider_quotes / available_hours)`.
  - Spread score: `exp(-0.5 * z^2)` where `z = (avg_rate - median_rate) / std_rate`.
  - Recency score: `exp(-lambda * age_minutes)` with `lambda = ln(2) / half_life_minutes`
    (default half-life: 180 minutes).
  - Tier multiplier (persistence): `1.5` if persistence >= 0.9, `1.0` if >= 0.6, else `0.5`.
  - Raw weight: `frequency^alpha * spread^beta * recency^gamma * tier_multiplier`
    (defaults: `alpha=0.4`, `beta=0.4`, `gamma=0.2`).
- **Confidence**:
  - `weight_confidence = min(1, window_days / lookback_days) * min(1, quote_count / min_quotes)`,
    and forced to `0` if `window_days < min_days` or `provider_count < min_providers`
    (defaults: lookback=30d, min_days=3, min_providers=3, min_quotes=500).
- **Blending**:
  - If both corridor and global weights exist:  
    `final_weight = conf * corridor_weight + (1 - conf) * global_weight`.
  - If missing, fall back to the available weight; if none, use equal weights.
- **Method profile**:
  - Weights are stored with `method_profile` but are currently corridor+provider only
    (`method_profile` is `NULL` in the weighting job).

### Indices methodology (current implementation)
- **RCI (cost ratio)**: weighted average of total cost ratio  
  `cost_ratio = (fee_amount + FX_markup) / send_amount`.
- **TEER (effective rate)**:  
  `TEER = mid_market_rate * (1 - RCI)` (weighted by `allowed_in_teer`).
- **RVI (dispersion)**: weighted standard deviation of **effective_rate** where  
  `effective_rate = ((send_amount - fee_amount) * implied_fx_rate) / send_amount`.
- **RVI (bps)**: `rvi_bps = (RVI / TEER) * 10,000`.
- **Mid-market**: `gold.fx_rate_history` (date-matched) with fallback to `gold.fx_rates`
  (OANDA sync).
- **Method profiles used for indices**:
  - `cash_pickup` (cash payout + bank/card/cash pay-in)
  - `standard_bank` (bank payout + bank transfer pay-in)
  - `standard_card` (bank payout + card wallet pay-in)
- **Metadata exposed**: `weighting_model` (`synthetic_volume_v1`), `methodology_version`
  (`indices_v2`), `weight_confidence`, and `weight_window_days`.

### Implementation Details
- Tier-3 and observation mode have been removed; the system uses a simplified 2-tier model.
- **Jitter:** Workers apply random jitter (500ms message-level, 200ms provider-level) to spread rate limit contention.

## Tier versioning
- **Purpose**: Preserve historical continuity for backtesting; changes to corridors/cadences don't break existing data consumers.
- **Table**: `silver.corridor_tier_snapshot` stores corridor tier assignments by version.
- **Config**: `PLANE_B_B2B_TIER_VERSION` (default: `0`) specifies which version snapshot to use.
- **Version 0**: Baseline snapshot with current macro corridors (US-origin = tier_1, others = tier_2).
- **Future versions**: New versions (1, 2, ...) can add corridors or change cadences without affecting v0 consumers.
- **Migration**: `063_seed_tier_version_0.sql` seeds the baseline v0 snapshot.
- **Immutability**: Tier snapshots are immutable once created; new changes require a new version.

## SLO targets (default values)
- API p95 latency (quotes/providers/rates):
  dev <= 1500ms, staging <= 1000ms, prod <= 800ms.
- Freshness p95:
  tier-1 <= 900s (15m), tier-2 <= 10,800s (3h),
  dev override for tier-2 = 21,600s (6h).
- Quote success rate: tier-1 >= 0.98, tier-2 >= 0.95.
- Provider coverage: tier-1 >= 3, tier-2 >= 3.
- Indices readiness (Tier-0 corridors, amount=500, method=standard_bank):
  available_ratio >= 0.80, suppressed_ratio <= 0.20, weight_confidence_p10 >= 0.30.
- DLQ depth must remain 0 across queues.
- Treat missing SLO metrics as SLO failures.

## Health + readiness endpoints (current)
- Plane A: `/healthz` (liveness) and `/readyz` (DB + Redis dependency checks).
- ECS workers: shared health server on port 8080 with `/healthz` + `/readyz`;
  ECS health checks call `/healthz` instead of `pgrep`.
- Ops admin: `/api/v1/ops/indices/health` summarizes Tier-0 indices readiness
  from `gold_export.cdp_daily`.

## Observability additions (current)
- **Data health SLO job** (`data-health-slo`) runs on EventBridge and emits:
  freshness p95 (tier1/tier2), quote success rate (tier1/tier2), provider coverage (tier1/tier2),
  indices readiness ratios, and weight-confidence p10.
- **Probe heartbeats**: `RemitScout/Probes:probe_run_total` with heartbeat alarms
  (treat missing data as breaching).
- **Synthetics**: canaries for `/healthz`, `/quotes`, and `/api/indices/latest`
  (dev: health only; staging/prod: health + quotes + indices).
- **Runbooks**: `docs/runbooks/provider-outage.md`, `docs/runbooks/indices-readiness.md`.

## Volatility computation
- Volatility is derived from FX history (OANDA or Gold sources); not directly provided.
- Use rolling stddev of log-returns or range-based measures over 7d/30d windows.
- Changes are only applied on a fixed cadence, published with versioned change logs.

## Architecture quick map
- Plane A (public API): main entrypoint under `/api/v1`
- Plane B (ingestion): collector and refresh worker services
- Plane C (internal publisher): publishes Gold outputs, served by Lambda/API GW
- Data tiers: Bronze (raw), Silver (normalized, active), Gold (curated outputs)

## Repo map (top-level)
- Major repo directories include infrastructure setup, backend apps (Plane A/B/C), scripts, shared code, frontend application, and agents.

## Local/dev-only assets
- None currently deployed that aren't described elsewhere.

## AWS dev snapshot (last known)
- See CloudFormation for latest stack info. Resource names/IDs include:
  - Stack: `remit-scout-dev`
  - Plane A & C URLs (API Gateway endpoints)
  - VPC and subnet IDs
  - RDS proxy, Redis, S3 buckets for various data/exposed artifacts
  - ECS services run in private subnets; verify `*_COMPLETE` before use.

## Deployment flow (dev/staging/prod)
- Build backend image (docker)
- Deploy infrastructure scripts
- Verify health endpoints, queue depths, and service status

## Secrets + runtime config (suggested pattern)
- Use Secrets Manager and SSM for secure config
- ECS/Lambda: inject secrets via CDK wiring and runtime resolution
- Main Circle of config: `backend/shared/config.ts` (used by Plane A/B/C)

## AWS wiring (suggested approach)
- Separate VPC/subnet for public/private networking, NAT as needed
- Plane B ECS tasks run private; Lambdas for scheduled jobs are VPC-attached
- Dev: Use VPC endpoints for S3/ECR and logs; prod uses NAT
- WAF attached to CloudFront for Plane A; enabled by default for prod
- Dashboards and CloudWatch alarms should be in place for DLQ, Lambda errors, CPU, RDS, Redis, freshness, quote success rate, p95 latency, etc.

## Detailed component map (roles and profiles)
- Each major plane/app has clear separation by main functions: API, business logic, normalization, ingestion, or publishing.
- See repo for details by context.

---

## Endpoint-level mapping

- Plane A: all public routes are found under `/api/v1`.
- Plane B: ingestion only; no public endpoints.
- Plane C: internal API routes for publisher outputs.

(This document intentionally no longer attempts to map out explicit file paths for all routes, modules, or storage schema. File lists and mappings are maintained in the codebase and may evolve over time. For reference or onboarding, contributors can explore the following broad file patterns and directories: `backend/**`, `frontend/**`, `infrastructure/**`, `agents/**`, `scripts/**`, and `docs/**`. File and directory details are suggestive only. When reasoning about system ownership or flow, always confirm directly in the codebase.)

---

## Data lineage table (Bronze → Silver → Gold)

| Tier / Artifact            | Writer(s)                | Storage                           | Refresh/cadence          | Consumers                    |
|---------------------------|--------------------------|-----------------------------------|--------------------------|------------------------------|
| Bronze raw payloads       | Plane B collectors       | Bronze S3, local storage          | Continuous, by sweep     | Normalization, debugging     |
| Silver normalized quotes  | Ingest/refresh workers   | Plane B DB (silver)               | Continuous, periodic     | Plane A, Gold jobs           |
| Gold FX rates             | Gold jobs/sync scripts   | Gold DB & caches                  | Hourly/periodic jobs     | Plane A endpoints, publisher |
| Gold aggregates           | Gold batch jobs + live worker | Gold tables/caches            | Scheduled backfill + live (≈1m) | Gold endpoints, downsteam    |

## Database schema inventory
- Canonical schemas: Bronze: raw provider payloads; Silver: normalized quotes plus corridor/provider/alert/user/billing tables; Gold: curated aggregates, indices, and exports.
- Public types: various for alert/job/status enums.
- Compatibility views: legacy views for backward compatibility.

## Config limits and operational caps
- Plane A and Plane B have default rate and concurrency limits as set in configuration.
- RPM, job, and payload caps are in `backend/shared/config.ts`.
- Provider-specific controls, rate limits, and other tweaks are supported via config, DB overrides, or per-provider settings as defined in codebase.

## B2B/B2C sweep mechanics + tiering (overview)
- Tiers are versioned; never rewritten.
- Tier snapshots are locked per period.
- Cadence and priority drive sweep scheduling.
- Gold is authoritative for published outputs.
- Alerts draw from Silver (real-time) and Gold (aggregate).

## Other architectural conventions and definitions
- IDs, amount buckets, canonical methods, and other primitive types follow rules and types as implemented in the shared codebase.
- Full details for signatures, Redis keys, alerting, export contracts, and other wire formats are maintained as comments or types in backend code.
- Secrets, runtime config, and per-provider overrides follow the code as specified, with all common controls using environment variables, config files, or well-defined interfaces under `backend/shared/**` and `infrastructure/**`.

## How to find files or logic
Rather than rely on exhaustive file lists here, contributors and LLMs should use the broad directory structure above and search patterns such as `backend/**`, `frontend/**`, `infrastructure/**`, `agents/**`, or other repo-wide queries to locate related modules or entrypoints.

When in doubt, discuss or confirm system boundaries, data flows, and final authorities directly in code or with the relevant module/owner.

## Glossary (summary)
- **Bronze:** Raw provider payloads (collected by Plane B).
- **Silver:** Normalized quotes and metadata (alerts, refresh statuses, etc.).
- **Gold:** Curated outputs (aggregates, indices, pulse cache, publisher tables).
- **Tier snapshot:** Frozen/locked corridor tier assignment for a given period.
