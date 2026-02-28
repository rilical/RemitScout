---
name: remit-scout-self-healing
description: Master self-healing automation — reads the central ops report, diagnoses every issue to root cause, applies code/config fixes autonomously, runs tests, creates branches, and pushes PRs. Eliminates the need for a dedicated infrastructure engineer.
---

# Remit-Scout Self-Healing Automation

## Overview

This is the master automation that closes the loop. It reads `ops/reports/daily-ops-report.md`, parses every issue found by other skills, diagnoses root causes down to specific files and lines, applies fixes, validates them, and pushes PRs — all without human involvement. When it cannot safely auto-fix, it creates detailed issue reports with exact remediation steps.

## Preconditions
- Git access with push permissions to feature branches
- `gh` CLI authenticated for PR creation
- All other remit-scout skills installed
- AWS CLI profiles configured
- Database read access (for diagnostic queries)

## How it works

### Phase 1: Collect (run all diagnostic skills)

Run each skill and write output to the central report. Each skill writes to its designated section in `ops/reports/daily-ops-report.md`.

```bash
REPORT="ops/reports/daily-ops-report.md"
DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
ENV=${ENV:-dev}
```

Execute skills in order:

1. `remit-scout-aws-resource-audit` → Section 1
2. `remit-scout-provider-health-probe` → Sections 2–3 (B2B and B2C separately)
3. `remit-scout-b2b-b2c-corridor-diagnostics` → Section 4
4. `remit-scout-gold-indices-integrity` → Section 5
5. `remit-scout-export-monitor` → Section 6
6. `remit-scout-db-observer` → Section 7
7. `remit-scout-codebase-hygiene` → Section 8
8. `remit-scout-env-drift-detector` → Section 9
9. `remit-scout-dev-cost-guard` → Section 10
10. `remit-scout-smoke` → Section 12
11. `remit-scout-frontend-e2e` → Section 13
12. `remit-scout-queue-corridor-watchdog` → Section 14
13. `remit-scout-rate-anomaly-detector` → Section 15
14. `remit-scout-provider-api-change-detector` → Section 16
15. `remit-scout-silver-gold-reconciliation` → Section 18
16. `remit-scout-fx-rate-anomaly-detector` → Section 19
17. `remit-scout-capacity-planner` → Section 20
18. `remit-scout-incident-postmortem-generator` → Section 21 (runs after all other skills)

### Phase 2: Parse and classify findings

Read the completed report and classify every issue:

| Classification | Auto-fixable? | Action |
|---------------|--------------|--------|
| **CODE_FIX** | Yes | Fix code, run tests, PR |
| **CONFIG_FIX** | Yes | Fix config/env, PR |
| **MIGRATION_NEEDED** | Yes (scaffolding) | Create migration, PR |
| **INFRA_FIX** | Partial | CDK change + PR (deploy is manual) |
| **DATA_FIX** | No (manual) | Create runbook + issue |
| **PROVIDER_DOWN** | Partial | Auto-stoplist or escalate |
| **SLO_BREACH** | No | Alert + root cause analysis |
| **COST_SPIKE** | Yes (dev) | Auto-pause dev resources |

### Phase 3: Diagnose (root cause analysis)

For each issue, drill down to the root cause:

#### Issue type: Provider not collecting (DEAD/STALE)

```
Diagnosis chain:
1. Is the probe Lambda running? → Check CloudWatch logs
2. Is the provider stoplisted? → Check rights_matrix.stoplist_status
3. Is the provider's API responding? → Check probe error logs
4. Is the collector parsing correctly? → Check ingestion_run errors
5. Is the rights matrix correct? → Check allowed_b2b/allowed_b2c
6. Is the corridor in macro-corridors? → Check corridor_tier_snapshot
```

Root cause SQL:

```sql
SELECT
  p.slug,
  rm.status,
  rm.stoplist_status,
  rm.allowed_b2b,
  rm.allowed_b2c,
  rm.allowed_collect,
  ir.error_message,
  ir.completed_at,
  ir.collector_type
FROM silver.provider p
LEFT JOIN silver.rights_matrix rm ON rm.provider_id = p.id
LEFT JOIN LATERAL (
  SELECT * FROM silver.ingestion_run
  WHERE provider_id = p.id
  ORDER BY started_at DESC LIMIT 1
) ir ON true
WHERE p.slug = '<provider_slug>';
```

#### Issue type: Gold indices stale

```
Diagnosis chain:
1. Is OANDA sync running? → Check gold.fx_rates freshness
2. Is the gold-indices Lambda running? → Check CloudWatch logs
3. Is provider-weighting producing snapshots? → Check gold.provider_weight_snapshot
4. Is the DB lock stuck? → Check pg_locks on gold tables
5. Are there enough providers? → Check weight_confidence
6. Is FX freshness gate blocking? → Check GOLD_INDICES_FX_MAX_AGE_HOURS
```

#### Issue type: Export failed/stuck

```
Diagnosis chain:
1. Is the export-worker Lambda running? → Check CloudWatch logs
2. Is SQS delivering? → Check queue depth + DLQ
3. Is the export query timing out? → Check pg_stat_activity
4. Is the S3 bucket writable? → Check IAM permissions
5. Are corridor-history headers correct? → Check export-worker-constants.ts
```

#### Issue type: Corridor dropped from sweep (never enqueued)

```
Diagnosis chain:
1. Is the corridor in macro-corridors? → Check corridor_tier_snapshot v0
2. Does the corridor have B2B rights? → Check rights_matrix allowed_b2b + allowed_collect
3. Is any provider active for this corridor? → Check stoplist_status='active'
4. Was backpressure active? → Check scheduler logs for scheduler_backpressure
5. Was the sweep scheduler Lambda/ECS running? → Check CloudWatch logs
6. Is the tier queue accepting? → Check queue depth vs b2bMaxQueueDepth
```

Root cause SQL:

```sql
SELECT
  cts.corridor_id,
  c.send_country || '-' || c.receive_country AS corridor,
  cts.tier,
  COUNT(DISTINCT rm.provider_id) AS eligible_providers,
  BOOL_OR(rm.stoplist_status = 'active') AS has_active_provider
FROM silver.corridor_tier_snapshot cts
JOIN silver.corridor c ON c.id = cts.corridor_id
LEFT JOIN silver.rights_matrix rm ON rm.corridor_id = cts.corridor_id
  AND rm.allowed_b2b = true AND rm.allowed_collect = true AND rm.status = 'production'
WHERE cts.version = 0 AND cts.corridor_id = '<corridor_id>'
GROUP BY cts.corridor_id, corridor, cts.tier;
```

#### Issue type: Sweep task succeeded but no quotes in Silver

```
Diagnosis chain:
1. Did the collector actually run? → Check ingestion_run for this provider+corridor
2. Did the collector return data? → Check ingestion_run.quotes_count
3. Did normalization fail? → Check ingestion_run.error_message
4. Is the provider's parser broken? → Check for parse errors in logs
5. Did the quote fail validation? → Check if quote was inserted but with bad data
6. Is there a circuit breaker tripped? → Check silver.circuit_breaker
```

#### Issue type: DLQ depth > 0

```
Diagnosis chain:
1. Which queue's DLQ? → Check all 9 DLQ depths
2. Sample DLQ messages → aws sqs receive-message (peek, don't delete)
3. What's the error? → Parse __rs_dlq metadata or message body
4. Is it a single provider or widespread? → Group by provider_id in DLQ messages
5. Is the worker crashing? → Check ECS service events and CloudWatch logs
6. Is it a transient error? → Check if retry count was exhausted
```

#### Issue type: Queue age exceeds threshold (backlog building)

```
Diagnosis chain:
1. Is the worker running? → Check ECS desired vs running count
2. Is the worker processing? → Check processing rate (tasks/hour)
3. Is enqueue rate exceeding processing rate? → Compare sweep cadence vs worker throughput
4. Is there a slow provider blocking? → Check avg process time per provider
5. Is backpressure already active? → Check scheduler logs
6. Should we scale workers? → Check ECS scaling policies vs current load
```

#### Issue type: Circuit breaker tripped for provider/corridor

```
Diagnosis chain:
1. What triggered the trip? → Check failure_count and last error
2. Is it a 429 (rate limit)? → Expected, wait for cooldown
3. Is it a 403 (auth failure)? → Provider API key issue, escalate
4. Is it a timeout? → Provider API slow, check network
5. Is it a parser error? → Code fix needed for changed API response
6. When does cooldown expire? → Check cooldown_until, compare to now
```

#### Issue type: Localhost/local-dev in production code

```
Diagnosis chain:
1. Is it guarded by isStrictConfig? → Acceptable
2. Is it in a test file? → Acceptable
3. Is it in backend/tmp/? → Delete, add to .gitignore
4. Is it in production code unguarded? → CODE_FIX needed
```

#### Issue type: Codebase hygiene (dead code, TODOs, deprecated)

```
Diagnosis chain:
1. Is it a TODO that's blocking? → Create issue
2. Is it commented-out code? → Remove, commit
3. Is it a deprecated file? → Remove or migrate, commit
4. Is it a dead export? → Remove, run tests, commit
```

### Phase 4: Fix (auto-remediation)

For each auto-fixable issue:

```bash
# Create feature branch
BRANCH="fix/self-healing-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BRANCH" develop

# Apply fix (code edits, config changes, file deletions)
# ... (specific to each issue type)

# Run tests
pnpm -C backend test --run

# Commit
git add -A
git commit -m "fix: <description from diagnosis>

Auto-fix by self-healing automation.
Source: ops/reports/daily-ops-report.md
Issue: <issue description>
Root cause: <root cause>
"

# Push and create PR
git push -u origin "$BRANCH"
gh pr create \
  --title "fix: <short description>" \
  --body "## Auto-fix by Self-Healing Automation

### Issue
<description>

### Root Cause
<diagnosis chain result>

### Fix Applied
<what was changed>

### Validation
- [ ] Tests pass
- [ ] Linter clean
- [ ] No regressions in smoke test

### Source
- Report: \`ops/reports/daily-ops-report.md\`
- Skill: \`<source skill>\`
- Section: \`<report section>\`
"
```

### Phase 5: Update report

After each fix, update the report's Action Items table and Self-Healing Log:

The report sections should be updated with:
- **Action Items:** Status changed from PENDING → IN_PROGRESS → FIXED (with PR link)
- **Self-Healing Log:** New row with timestamp, issue, diagnosis, fix, branch, PR link, result

### Phase 6: Archive

At the end of each day, archive the report:

```bash
ARCHIVE_DATE=$(date -u +%Y-%m-%d)
cp ops/reports/daily-ops-report.md "ops/reports/archive/${ARCHIVE_DATE}.md"
```

Then reset the active report for the next day (regenerate from template).

## Auto-fix playbooks (by issue type)

### Playbook: Remove localhost from production code

```
1. rg "localhost|127\.0\.0\.1" backend/ --glob '!*.test.*' --glob '!*.example'
2. For each match NOT in the known-acceptable list:
   a. If it's a fallback with no guard → add isStrictConfig guard
   b. If it's a hardcoded URL → replace with env var
   c. If it's in backend/tmp/ → delete file, ensure .gitignore covers it
3. Run tests
4. Commit + PR
```

### Playbook: Remove commented-out code

```
1. Find blocks of >5 consecutive commented lines in production code
2. For each block:
   a. If it references a sprint/future feature → move to docs/roadmap/ or delete
   b. If it's dead code → delete
3. Run tests
4. Commit + PR
```

### Playbook: Remove deprecated files

```
1. Find files with @deprecated marker
2. Check if replacement exists (e.g., config.ts → config-aws.ts)
3. Verify no imports reference the deprecated file
4. Delete deprecated file
5. Run tests
6. Commit + PR
```

### Playbook: Fix gitignore gaps

```
1. Run git check-ignore on known local directories
2. Add missing entries to .gitignore
3. git rm --cached any tracked files that should be ignored
4. Commit + PR
```

### Playbook: Stale provider auto-stoplist

```
1. Query Silver for providers with no quotes in >12 hours
2. Check if probe Lambda has errors (vs provider just has no data)
3. If probe errors → flag for investigation (no auto-fix)
4. If provider API is down → auto-stoplist with notes='auto_paused:api_down'
   (stoplist-auto-resume will re-enable when cooldown expires)
```

SQL for auto-stoplist:

```sql
UPDATE silver.rights_matrix
SET stoplist_status = 'paused',
    stoplist_notes = 'auto_paused:no_quotes_24h',
    stoplist_paused_at = NOW()
WHERE provider_id = (SELECT id FROM silver.provider WHERE slug = '<slug>')
  AND stoplist_status = 'active';
```

### Playbook: Dev cost spike

```
1. Check if dev ECS desired > 0 or EventBridge rules ENABLED
2. If outside business hours → make ops-pause-dev
3. If during business hours → alert only
```

### Playbook: Stuck sweep tasks (re-enqueue)

```
1. Query silver.b2b_sweep_task for status='processing' AND enqueued_at < NOW() - 30 min
2. For each stuck task:
   a. Check if the worker ECS service is running
   b. If worker is down → flag INFRA_FIX
   c. If worker is running but task is stuck → mark task as 'failed' with error_reason
3. If the corridor has no successful task in this sweep run:
   a. Create a new sweep task (re-enqueue to the correct tier queue)
4. Log re-enqueue in Self-Healing Log
```

### Playbook: DLQ drain and diagnosis

```
1. For each DLQ with depth > 0:
   a. Peek at up to 10 messages (receive but don't delete)
   b. Parse __rs_dlq metadata for error + original message
   c. Group by error type and provider
   d. If all errors are from one provider → auto-stoplist provider
   e. If errors are diverse → flag for manual investigation
   f. After diagnosis, if safe: purge DLQ messages
2. Create action item with error summary
3. Never auto-delete DLQ messages without diagnosis
```

### Playbook: Worker scaling (queue backlog)

```
1. Check queue age and depth for the affected queue
2. Check current ECS service desired vs running count
3. If running < desired → ECS issue, flag INFRA_FIX
4. If desired is at max → need CDK change to raise max, create PR
5. If desired is below max → ECS auto-scaling should handle (wait and re-check)
6. If backpressure is active → acceptable, log and monitor
```

### Playbook: Circuit breaker recovery

```
1. Query silver.circuit_breaker for non-closed states
2. For each tripped breaker:
   a. If cooldown expired but still tripped → manual reset needed
   b. If error is 429 (rate limit) → expected, monitor
   c. If error is auth/parse → flag CODE_FIX or SECRET_FIX
3. Do NOT auto-reset circuit breakers (they self-heal via cooldown)
4. Create action item if breaker has been tripped > 24h
```

### Playbook: Missing DB migration

```
1. Compare migration files in backend/db/migrations/ vs applied in each env
2. If migration exists in code but not in staging/prod:
   a. Create a PR with the migration tagged for deploy
   b. Add to action items: "Run make db-migrate-staging/prod after merge"
```

### Playbook: Provider B2B/B2C rights matrix gap

```
1. Query providers with allowed_b2b=true but 0 B2B quotes in 24h
2. Query providers with allowed_b2c=true but 0 B2C quote requests
3. Cross-reference with corridor_tier_snapshot and macro_corridors
4. If provider has rights but no corridors in tier snapshot → flag gap
5. If provider has corridors but no quotes → diagnosis chain for provider down
```

## B2B vs B2C awareness

This automation is fully aware that B2B and B2C have different provider sets:

- **B2B providers:** Filtered by `allowed_b2b=true` in rights_matrix. Only `collector_type LIKE 'b2b_%'` ingestion runs count. These feed into Gold indices (TEER/RCI/RVI).
- **B2C providers:** Filtered by `allowed_b2c=true`. Driven by user requests, not scheduled sweeps. Do NOT feed into Gold indices directly.
- **Provider count per corridor varies:** A US→MX corridor might have 17 B2B providers, while US→PH has 12. The RVI count depends on the actual providers with `status='production'` AND `allowed_in_rvi=true` for that specific corridor.

Diagnostic queries must always split by B2B vs B2C:

```sql
-- B2B provider count per corridor (for indices)
SELECT
  c.send_country || '-' || c.receive_country AS corridor,
  COUNT(DISTINCT rm.provider_id) AS b2b_providers,
  COUNT(DISTINCT CASE WHEN rm.allowed_in_teer THEN rm.provider_id END) AS teer_providers,
  COUNT(DISTINCT CASE WHEN rm.allowed_in_rci THEN rm.provider_id END) AS rci_providers,
  COUNT(DISTINCT CASE WHEN rm.allowed_in_rvi THEN rm.provider_id END) AS rvi_providers
FROM silver.rights_matrix rm
JOIN silver.corridor c ON c.id = rm.corridor_id
WHERE rm.allowed_b2b = true
  AND rm.status = 'production'
  AND rm.stoplist_status = 'active'
GROUP BY corridor
ORDER BY b2b_providers;

-- B2C provider count per corridor (for API/frontend)
SELECT
  c.send_country || '-' || c.receive_country AS corridor,
  COUNT(DISTINCT rm.provider_id) AS b2c_providers
FROM silver.rights_matrix rm
JOIN silver.corridor c ON c.id = rm.corridor_id
WHERE rm.allowed_b2c = true
  AND rm.status = 'production'
  AND rm.stoplist_status = 'active'
GROUP BY corridor
ORDER BY b2c_providers;
```

## Guardrails (what this automation will NEVER do)

1. **Never push directly to main or develop** — always creates feature branches
2. **Never modify production data** — SQL fixes are read-only diagnostics; data changes are flagged for manual action
3. **Never deploy to staging/prod** — CDK changes are PR'd; deploy is manual
4. **Never delete provider data** — stoplisting is reversible; deletions require human approval
5. **Never skip tests** — every code fix runs the full test suite before commit
6. **Never force-push** — all pushes are regular pushes to new branches
7. **Never modify secrets** — secret changes are flagged for manual action

## Output template (written to ops/reports/daily-ops-report.md)

After all phases complete, the Self-Healing Log section is updated:

```
## Self-Healing Log

| Timestamp | Issue | Diagnosis | Fix Applied | Branch | PR | Result |
|-----------|-------|-----------|-------------|--------|-----|--------|
| 2026-02-11T06:00:00Z | Localhost in swagger.ts unguarded | CODE_FIX: missing isAwsRuntime check | Added guard | fix/self-healing-20260211-060000 | #142 | MERGED |
| 2026-02-11T06:01:00Z | backend/tmp/ tracked | CONFIG_FIX: .gitignore gap | Added to .gitignore, git rm --cached | fix/self-healing-20260211-060100 | #143 | MERGED |
| 2026-02-11T06:02:00Z | Sprint 4 commented block | CODE_FIX: dead code | Removed 50 lines from dispatcher.ts | fix/self-healing-20260211-060200 | #144 | PENDING_REVIEW |
| 2026-02-11T06:03:00Z | Gold FX stale (>6h) | SLO_BREACH: OANDA sync Lambda failed | Not auto-fixable | — | — | ESCALATED |
```

## Codex automation prompt (copy-paste ready)

### Daily self-healing (full cycle)

```
You are the Remit-Scout self-healing automation.
Environment: ${ENV}

1. Read `ARCHITECTURE.md` for system invariants.
2. Run all diagnostic skills in order, writing output to `ops/reports/daily-ops-report.md`:
   - remit-scout-aws-resource-audit (Section 1)
   - remit-scout-provider-health-probe (Sections 2-3, split B2B/B2C)
   - remit-scout-b2b-b2c-corridor-diagnostics (Section 4)
   - remit-scout-gold-indices-integrity (Section 5)
   - remit-scout-export-monitor (Section 6)
   - remit-scout-db-observer (Section 7)
   - remit-scout-codebase-hygiene (Section 8)
   - remit-scout-env-drift-detector (Section 9)
   - remit-scout-dev-cost-guard (Section 10)
3. Parse the completed report for issues with status != HEALTHY.
4. For each issue:
   a. Run the diagnosis chain from the self-healing skill
   b. Classify as CODE_FIX, CONFIG_FIX, MIGRATION_NEEDED, INFRA_FIX, DATA_FIX, PROVIDER_DOWN, SLO_BREACH, or COST_SPIKE
   c. If auto-fixable: apply the fix playbook, run tests, create branch, push PR
   d. If not auto-fixable: create detailed action item with exact steps
5. Update the report with all findings, fixes, and PR links.
6. Archive yesterday's report to ops/reports/archive/.
7. Return the executive summary.
```

### Quick fix cycle (codebase hygiene only)

```
You are the Remit-Scout self-healing automation.
Focus: codebase hygiene only.

1. Run remit-scout-codebase-hygiene.
2. For every finding:
   a. Diagnose root cause
   b. Apply fix playbook (remove dead code, fix gitignore, remove localhost leaks)
   c. Run tests
   d. Create one branch per logical fix group
   e. Push PRs
3. Update ops/reports/daily-ops-report.md Section 8.
4. Return list of PRs created.
```

### Provider diagnosis cycle

```
You are the Remit-Scout self-healing automation.
Focus: provider health only.

1. Run remit-scout-provider-health-probe (split B2B and B2C).
2. Run remit-scout-b2b-b2c-corridor-diagnostics.
3. For each provider with status STALE or DEAD:
   a. Run the full diagnosis chain (probe → rights matrix → API → collector → corridors)
   b. If provider API is confirmed down: auto-stoplist with notes
   c. If probe Lambda is failing: diagnose Lambda error, apply fix if possible
   d. If rights matrix is misconfigured: flag for manual review
4. Update ops/reports/daily-ops-report.md Sections 2-4.
5. Return provider status matrix.
```

### Queue & corridor pipeline cycle

```
You are the Remit-Scout self-healing automation.
Focus: queue and corridor pipeline health.

1. Run remit-scout-queue-corridor-watchdog.
2. For each issue found:
   a. Corridors missing from sweep → diagnose rights matrix + macro corridors + backpressure
   b. Stuck tasks → re-enqueue or flag worker issue
   c. DLQ depth > 0 → peek at DLQ, diagnose, group by error/provider
   d. Sweep success but no quotes → diagnose collector + parser + circuit breaker
   e. Queue age exceeding threshold → check worker scaling
   f. Circuit breakers tripped → monitor cooldown, flag if > 24h
3. Apply relevant playbooks for auto-fixable issues.
4. Update ops/reports/daily-ops-report.md Section 14.
5. Return corridor pipeline status matrix with per-tier breakdown.
```
