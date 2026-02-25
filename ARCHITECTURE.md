# Remit-Scout Architecture (Index + Invariants)

## Purpose
This file is the primary navigation surface for Remit-Scout architecture.
It is intentionally optimized for LLM context windows:
- small, stable invariants
- fast “where do I look?” routing
- links to deeper docs instead of embedding everything here

Detailed docs live under:
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/architecture/`

## Agent navigation (start here)
1. System invariants: `ARCHITECTURE.md` (this file)
2. IssueOps control plane: `docs/architecture/issueops.md`
3. Agent deploy promotion checklist: `docs/runbooks/agent-deploy-promotion-checklist.md`
4. Providers: `docs/architecture/providers.md`
5. Queues: `docs/architecture/queues.md`
6. Observability: `docs/architecture/observability.md`
7. Security posture: `docs/architecture/security.md`
8. Deploy strategy: `docs/architecture/deploy-strategy.md`
9. Runbooks (human-facing): `docs/runbooks/`
10. DR runbook: `docs/runbooks/disaster-recovery.md`
11. New Relic observability runbook: `docs/runbooks/newrelic-observability.md`

## System invariants (must not break)
- Plane A must never read Bronze data directly.
- All public APIs must validate inputs and return stable response schemas.
- Pulse endpoints must never fabricate freshness timestamps or demo values. If Gold/Gold Export inputs are missing,
  APIs must return empty payloads with explicit availability flags (for example `dataAvailable=false`, `updatedAt=null`)
  so the UI can render a truthful "warming up" state.
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
- Cross-plane trace continuity is required for public request paths (A -> C -> B) using propagated trace context and correlation identifiers.
- Plan-gated history windows must be enforced consistently across backend entitlements and UI selectors (free=30 days, plus=90 days, enterprise=extended/unlimited).

## Environment model
- **dev**: optimized for speed of iteration, short TTLs, lower capacity.
- **staging**: mirrors production for networking and security validation.
- **prod**: high SLOs, zero-risk changes, full auditability.

## System map (3 planes + 3 tiers)
- Plane A (public API): serves `/api/v1/*`, backed by Redis hot cache.
- Plane B (ingestion/refresh): collectors fetch providers, write Bronze raw + Silver normalized.
- Plane C (publisher): aggregates Gold outputs, serves internal/publisher surfaces.
- Tiers:
  - Bronze: raw provider payloads
  - Silver: normalized quotes + ops truth
  - Gold: curated aggregates, indices, exports

## Where to debug X (fast routing)

| Symptom | First evidence pack | Next evidence/forensics | Primary entrypoints | Runbook |
|---|---|---|---|---|
| Provider outage / blocked | `evidence.provider_health.github_actions` | `forensics.corridor_provider.local` | `backend/plane-b/src/providers/` + `backend/plane-b/src/collectors/*` | `docs/runbooks/provider-outage.md` |
| Queue stuck / backlog | `evidence.queue_backlog.github_actions` | worker logs + queue watchdog | `backend/shared/sqs.ts` + `backend/scripts/*queue-worker.ts` | `docs/runbooks/dev-pause-resume.md` |
| API slow / unhealthy | `evidence.http_latency.github_actions` | CloudWatch/Synthetics evidence | `backend/plane-a/src/server.ts` + routes | `docs/runbooks/indices-readiness.md` |
| No-quotes regressions | `evidence.no_quotes_audit.github_actions` | provider health + corridor forensics | `backend/scripts/no-quotes-audit.ts` + Plane A `/providers` | `docs/runbooks/provider-outage.md` |
| Capability drift | `evidence.provider_capability_probe.github_actions` | provider evidence | `backend/scripts/provider-capability-probe.ts` | `docs/runbooks/provider-outage.md` |
| Exports failing / delayed | `evidence.exports_health.github_actions` | queue backlog (`queue_kind=exports`) + worker logs | `backend/scripts/export-queue-worker.ts` + `backend/plane-a/src/repositories/implementations/export-job-repository.ts` | `docs/runbooks/exports-health.md` |
| Freshness SLO regression | `evidence.freshness_slo.github_actions` | no-quotes audit + provider health | `backend/scripts/data-health-slo-job.ts` + `backend/shared/slo-tracker.ts` | `docs/runbooks/freshness-slo.md` |
| Bronze→Silver throughput drop | `evidence.bronze_silver_throughput.github_actions` | provider health + normalize pipeline checks | `backend/plane-b/src/collectors/base-collector.ts` + `backend/plane-b/src/normalize/quote-normalizer.ts` | `docs/runbooks/bronze-silver-throughput.md` |
| DB pressure / long queries | `evidence.db_health.github_actions` | infra drift checks + migration/index review | `backend/shared/db.ts` + `backend/db/migrations/` | `docs/runbooks/db-health.md` |
| Indices readiness issues | `evidence.indices_readiness.github_actions` | SLO job + ops endpoint + reconciliation | `backend/scripts/data-health-slo-job.ts` + `backend/plane-a/src/routes/ops/indices-health.ts` | `docs/runbooks/indices-readiness.md` |
| Pulse stale / cache lag | `evidence.pulse_cache_health.github_actions` | indices readiness + Gold pulse job health | `backend/scripts/gold-pulse-cache-job.ts` + `backend/plane-a/src/routes/pulse.ts` | `docs/runbooks/pulse-cache.md` |

## IssueOps Control Plane (Brain / Executors / Judge)
Remit-Scout runs ops work as durable artifacts and bounded loops:
- **Brain** decides which skills to run for a Case.
- **Executors** run skills (GitHub Actions, AWS scheduled jobs, local).
- **Judge** validates evidence + contracts, decides iterate/escalate/close.

Details: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/architecture/issueops.md`

## SLO targets (default values)
Canonical list: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/architecture/observability.md`

## Repo navigation notes (LLM friendly)
- When diagnosing: prefer running a skill/evidence pack over reading raw logs.
- Prefer bounded EvidenceResult JSON + pointers over copying multi-megabyte outputs into context.
- When changing wiring: update the canonical catalogs (`.remit-scout/*`) first and derive other lists from them where possible.

## Security invariants (2026-02 hardening)
- Plane C `/internal/*` routes must be protected by IAM authorizer and/or explicit internal auth token checks.
- Plane C production/staging deployments must not run with `PLANE_C_ENABLE_IAM_AUTH=0` unless `PLANE_C_INTERNAL_API_TOKEN` is configured.
- Plane A production/staging runtime requires `ADMIN_IP_ALLOWLIST`; deploy-time wiring must supply it.
- Plane A rate-limit fallback in production/staging is fail-closed (`reject`); skip/memory fallbacks are non-prod only.
- Marketing helper routes under `/api/v1/alerts/*` are dev-only public surfaces; staging/prod requires auth.

## Admin security invariants (2026-02)
- Admin access tokens are validated and revoked via Redis blocklist; revocation checks default to fail-open with alerting, and can be configured to fail-closed via `PLANE_A_ADMIN_REVOCATION_FAIL_CLOSED`.
- Admin MFA (Supabase TOTP) must be available and enforceable for admin sessions when configured.
- Account deletion is a two-step workflow: `DELETE /api/v1/account` creates a pending deletion row in `public.system_account_deletion_request`, users have a 7-day cancel window, and background cleanup performs physical deletion after the grace period.

## Admin UI surface changes
- Canonical admin shell is `frontend/layouts/admin.vue` with command palette and sidebar navigation.
- `/admin/ops-health` is a compatibility redirect to `/admin/observer`.
- Admin observer and dashboard summaries use `/api/v1/ops/observer/summary` for queue + activity visibility.
