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
- Amount buckets must be exact; if not, enqueue a new request—never reuse an imprecise bucket.
- Method filters must only allow methods supported by providers.

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
- Dev: p95 API ≤1500ms, data freshness ≤60m, DLQ=0.
- Staging: p95 API ≤1000ms, data freshness ≤30m, DLQ=0.
- Prod: p95 API ≤800ms, freshness per tier, DLQ=0.
- Treat missing SLO metrics as SLO failures.

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
