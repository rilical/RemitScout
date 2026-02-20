# Remit-Scout PostgreSQL & Platform Audit Dossier

Date: 2026-02-20
Scope: Postgres runtime correctness, migration safety, proxy behavior, cross-plane isolation, and legacy infra artifacts.
Mode: Read-only verification and planning only.

## 0) Pass/Fail status vs plan invariants

1. Configuration and runtime wiring: **FAIL** (plane DSN resolution allows non-explicit fallback behavior in non-strict mode).
2. Proxy and timeout policy: **PARTIAL** (proxy detection + timeout routing present, but no auditable policy matrix for per-connection-class semantics and known intentional tradeoffs).
3. Migration/credential hygiene: **PARTIAL** (migrator credential support exists, but separation-by-construction is not explicit for all runtime planes/overrides).
4. Role/schema/bootstrap guardrails: **PARTIAL** (bootstrap grants exist; no explicit environment-scoped least-privilege matrix and legacy defaults are not strongly gated).
5. Monitoring/alarm completeness: **PARTIAL** (high-signal DB observability exists but long-running query/deadlock/replica lag specific alarms and explicit runbook links are incomplete).
6. Legacy artifacts and drift: **FAIL** (deprecated K8s cronjobs still contain direct DB references and are present in-repo without enforced deprecation gating).
7. Subagent/skill onboarding: **PASS** (`.claude` agent definitions imported into active skill registry as reusable skills).

## 1) Critical Issues

1. `backend/shared/config.ts` + `backend/shared/startup.ts`: Plane DSN resolution uses implicit fallback to `DATABASE_URL` via `getDatabaseUrl` when strict mode is off (non-fail-fast behavior).
- Why: A single unset plane variable can silently route a plane to shared/default credentials/endpoint, undermining isolation assumptions.
- Fix: Introduce/require strict mode by environment (except explicitly scoped test/dev exceptions), and add explicit plane-specific required variable checks before startup.

2. `infrastructure/cdk/lib/remit-scout-stack.ts`/`infrastructure/cdk/lib/database.ts`/`backend/shared/db.ts`: Single shared proxy endpoint is used across all planes; runtime proxy paths disable statement timeout semantics (`disable_statement_timeout`/equivalent behavior) at connection class level.
- Why: Cross-plane blast radius increases; long-running SQL from any plane can consume shared proxy/DB budget and evade timeout protection on proxy path.
- Fix: Add and document a per-plane connection policy matrix with strict separation or explicit risk acceptance per plane and enforce at stack/env/runtime contract level.

3. `backend/db/migrations/001_init.sql`: `CREATE ROLE` defaults and broad privilege grants are applied as part of bootstrap without a clearly documented environment-sensitive gating strategy.
- Why: Privilege breadth is hard to review during drift events and expands default blast radius, especially with shared credentials.
- Fix: Convert migration bootstrap to explicit least-privilege role definitions with schema-level grant comments and explicit migration rationale for each grant.

## 2) Major Issues

1. `backend/shared/db.ts` + `infrastructure/cdk/lib/remit-scout-stack.ts`: No explicit, typed policy map for query timeout behavior by connection class (`proxy` vs direct/db-proxy). Timeout behavior depends on regex-based detection and flags spread across shared defaults.
- Why: Policy drift is easy and difficult to audit by human review alone.
- Fix: Define typed `connectionRoute` + `statementTimeoutPolicy` config with allowed values and static assertions per service.

2. `backend/shared/config.ts`: `isStrictConfig` is present but fallback usage remains in runtime paths.
- Why: Non-prod behavior can accidentally leak into prod-like profiles when env loading is partial.
- Fix: Add environment contract tests and startup checks that reject mixed strictness profiles.

3. `infrastructure/cdk/lib/ecs-tasks.ts` + `backend/scripts/aws/db-migrate-ecs.ts`: Migration URL privilege path is configurable but runtime containers have no explicit guardrail proving migrator URL is never present in non-migrator task roles.
- Why: Privileged bootstrap creds can bleed into non-migration workloads if env injection changes.
- Fix: Enforce explicit naming schema and automated diff checks comparing injected env against role policy matrix.

4. `infrastructure/cdk/lib/monitoring.ts`: DB health alarm set is good for infrastructure capacity but lacks mandatory long-query/deadlock/replication-lag specifics requested for PostgreSQL incident clarity.
- Why: Stalled query incidents can be diagnosed late or ambiguously.
- Fix: Add deadlock, long-running query, and replica lag alarms plus actionable runbook linkage.

## 3) Minor Issues

1. `backend/shared/startup.ts`: ECS-only DB readiness gating can mask local non-ECS path gaps; readiness behavior differs by runtime mode.
- Fix: Standardize readiness checks with environment policy labels and include explicit plane-to-plane verification in non-ECS smoke checks.

2. `backend/shared/db.ts`: `isTransactionControlStatement` excludes statements starting with control keywords from timeout wrapper.
- Why: Transactional SQL may bypass query-local timeout path in proxy mode.
- Fix: Add explicit documentation and unit tests for each query class and safe exception list.

3. `backend/shared/config.ts` & `backend/shared/aws-params.ts`: Sensitive credential provenance remains indirect through helper names; auditability can improve.
- Fix: Add redaction-safe metadata for secret source and policy classification.

## 4) Legacy/Local-Dev Artifacts to Remove

1. `/Users/omarghabyen/Desktop/Remit-Scout Production V2/infrastructure/k8s/b2c-refresh-worker-cronjob.yaml`
- Contains direct DB/Redis references and legacy wiring. Marked deprecated in-file.
- Action: remove from active execution paths or move to explicit archive/deprecation directory with CI guardrails.

2. `/Users/omarghabyen/Desktop/Remit-Scout Production V2/infrastructure/k8s/stoplist-auto-resume-cronjob.yaml`
- Contains direct DB/Redis references and deprecation note without enforced execution gating.
- Action: same as above; add explicit “disabled by default + reason + owner + expiry” policy if temporary keep.

## 5) Missing AWS Wiring / Infra Gaps

1. `infrastructure/cdk/lib/remit-scout-stack.ts` does not export per-plane DB topology endpoints in a consumable incident-output format with clear labels for where each plane should connect.
- Fix: Add stable CloudFormation outputs/SSM keys for `planeA`, `planeB`, `planeC` endpoints and policy type (`direct`/`proxy`) per environment.

2. `infrastructure/cdk/lib/monitoring.ts` misses explicit alarm-to-runbook linkage metadata for DB stall/deadlock/repl-lag scenarios.
- Fix: attach alarm descriptions with runbook URLs, pager thresholds, and rollback playbooks.

3. `infrastructure/cdk/lib/backup.ts` has restore workflows but lacks explicit “audit assertion points” documenting which schemas/roles are required for PITR/restore drills.
- Fix: codify restore assertions by role/schema and publish in operator runbook.

## 6) Questions / Assumptions

1. Is `NON_STRICT` mode still required in any non-development environment?
2. Is the shared proxy architecture intentional for all planes in every environment, or is this a legacy expedient awaiting migration?
3. Are `planeAUrl/planeBUrl/planeCUrl` runtime values managed by environment contracts outside CDK task definitions?
4. What is the current official source-of-truth for incident runbook links referenced by CloudWatch/Prom alarms?

## 7) RAG/Architecture Updates (proposed)

1. Add an explicit “Postgres plane contract” section to `ARCHITECTURE.md` capturing:
- Plane DSN resolution precedence (strict vs permissive modes),
- Connection profile policy (`proxy`, `direct`, `proxy_disabled`),
- Timeout semantics and known tradeoffs.
2. Add a `backend/shared/config.ts` section in RAG for environment-specific requiredness and failure modes.
3. Add a `monitoring.ts` contract note for DB incident signals (CPU, connections, repl lag, deadlocks, long-running tx).

## 7B) Audit Risk Register (Critical/Major/Minor/Info)

1. Critical: Cross-plane proxy unification amplifies blast radius.
- Likelihood: High
- Blast radius: High (multiple planes, shared path)
- Env impact: Dev/Staging/Prod

2. Critical: Plane fallback to generic `DATABASE_URL` in non-strict mode.
- Likelihood: Medium-High
- Blast radius: High (wrong plane binding, accidental cross-traffic)
- Env impact: Dev/Staging/Prod when config drift exists

3. Major: Lack of explicit timeout policy matrix and query-risk handling for proxy class.
- Likelihood: Medium
- Blast radius: Medium-High (runaway queries visible late)
- Env impact: Env-dependent (higher in staging/prod where proxy is used)

4. Major: Legacy K8s DB cron manifests still present without execution enforcement.
- Likelihood: Medium
- Blast radius: Medium
- Env impact: Any pipeline/env applying manifests

5. Minor: Runbook/alarm linkage gaps and role/grant auditability.
- Likelihood: Medium
- Blast radius: Medium
- Env impact: All envs during incidents

## 8) Execution-safe remediation roadmap

1. **R-01 (Owner: Platform Infra)** — Enforce plane DSN strict mode in staging/prod; require explicit env variables for A/B/C.
- Dependency: Config schema + startup checks alignment.
- Estimated effort: 0.5 day.
- Validation: startup fails-fast with missing plane URL in non-test envs.

2. **R-02 (Owner: Platform Infra + DB SRE)** — Codify typed connection profiles in shared config/schema and propagate per-plane topology outputs.
- Dependency: `backend/shared/config.ts`, `backend/shared/db.ts`, `infrastructure/cdk/lib/remit-scout-stack.ts`.
- Estimated effort: 1 day.
- Validation: audit script confirms explicit profile for each plane/env.

3. **R-03 (Owner: DB SRE)** — Add migration-vs-runtime secret separation checks and explicit task role injection assertions.
- Dependency: `backend/scripts/aws/db-migrate-ecs.ts`, `infrastructure/cdk/lib/ecs-tasks.ts`.
- Estimated effort: 1 day.
- Validation: migrator-only secret unavailable to non-migrator task roles.

4. **R-04 (Owner: Platform Observability)** — Add replica lag/deadlock/long-query alarms + runbook URLs in `monitoring.ts`.
- Dependency: Existing metric namespace mapping and on-call docs.
- Estimated effort: 1 day.
- Validation: alarm state change includes actionable links and drillbooks.

5. **R-05 (Owner: Platform Governance)** — Remove or quarantine legacy K8s cronjobs with deprecated DB references.
- Dependency: deployment manifests inventory + pipeline gates.
- Estimated effort: 0.5 day.
- Validation: no deprecated DB cron manifests are deployable without explicit signed exception.

6. **R-06 (Owner: Backend SRE)** — Add migration bootstrap hardening plan for 001_init SQL grants and role ownership assumptions.
- Dependency: security review + least-privilege policy.
- Estimated effort: 1 day.
- Validation: migration review checklist signed before next cutover.

## 9) One-page executive readout

Top 5 blockers:
1. Plane DB resolution fallback (non-strict) can silently violate plane boundaries.
2. Shared proxy path for all planes increases blast radius and makes timeout exceptions platform-wide.
3. Legacy per-plane timeout policy exists but is not auditable as a deliberate matrix.
4. Legacy K8s DB cron manifests remain in-repo with direct DB wiring.
5. Monitoring lacks explicit query deadlock/long-running/replica-lag signals + runbook mapping.

Go / No-go for next deploy window: **NO-GO** unless blockers 1 and 2 are explicitly accepted in deployment notes and 3 has an explicit policy document.

## 10) Skills import ledger (subagent onboarding)

Ledger location: `$CODEX_HOME/skills` (`~/.codex/skills` by default)

Imported skills:
- aws-cost-operations
- compliance-auditor
- fintech-engineer
- flutter-expert
- frontend-design
- frontend-developer
- payment-integration
- performance-engineer
- postgres-pro
- security-auditor
- sentry-setup-logging
- sentry-setup-metrics
- sentry-setup-tracing
- sre-engineer
- stripe-best-practices
- typescript-pro
- ui-designer
- vue-expert
- provider-integrator

Determinism note: each imported skill has `SKILL.md` copied directly from source under `/Users/omarghabyen/.claude/agents/` (repo-level or home-level) and staged under matching skill name directories.
