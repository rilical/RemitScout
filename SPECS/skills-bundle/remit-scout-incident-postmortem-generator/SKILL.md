---
name: remit-scout-incident-postmortem-generator
description: Auto-generate structured post-mortems from self-healing actions — timeline, root cause, fix, impact, prevention. Closes the feedback loop so the system learns from every incident.
---

# Remit-Scout Incident Post-Mortem Generator

## Overview

Every time the self-healing automation fixes something, it logs to the Self-Healing Log in `ops/reports/daily-ops-report.md`. But without a post-mortem, the same issue will recur. This skill reads the Self-Healing Log, generates a structured post-mortem for each incident, and proposes prevention measures (new tests, new alarms, code hardening).

## Inputs

Read from `ops/reports/daily-ops-report.md` → Self-Healing Log:

```
| Timestamp | Issue | Diagnosis | Fix Applied | Branch | PR | Result |
```

## Post-mortem template (generated per incident)

```markdown
# Post-Mortem: ${ISSUE_TITLE}

## Summary
- **Date:** ${TIMESTAMP}
- **Duration:** ${DETECTION_TO_FIX_DURATION}
- **Severity:** ${CRITICAL|MAJOR|MINOR}
- **Environment:** ${ENV}
- **Auto-fixed:** ${YES|NO}

## Timeline
| Time | Event |
|------|-------|
| T+0 | Issue detected by ${SOURCE_SKILL} |
| T+${N}m | Self-healing automation diagnosed root cause |
| T+${N}m | Fix applied: ${FIX_DESCRIPTION} |
| T+${N}m | Tests passed, PR created (${PR_LINK}) |
| T+${N}m | PR merged / fix deployed |
| T+${N}m | Verified: issue resolved |

## Root Cause
${ROOT_CAUSE_DESCRIPTION}

### Diagnosis Chain
1. ${STEP_1}
2. ${STEP_2}
3. ...

### Root Cause Classification
- Type: ${CODE_FIX|CONFIG_FIX|PROVIDER_DOWN|DATA_FIX|INFRA_FIX|SLO_BREACH}
- File(s): ${AFFECTED_FILES}
- Line(s): ${AFFECTED_LINES}

## Impact
- **Users affected:** ${NONE|ENTERPRISE_CUSTOMERS|ALL}
- **Data corrupted:** ${YES_QUARANTINED|NO}
- **Indices affected:** ${TEER|RCI|RVI|NONE}
- **Corridors affected:** ${COUNT} (${LIST})
- **Providers affected:** ${COUNT} (${LIST})
- **Duration of bad data:** ${MINUTES}

## Fix Applied
- **Branch:** ${BRANCH}
- **PR:** ${PR_LINK}
- **Changes:**
  - ${FILE_1}: ${CHANGE_DESCRIPTION}
  - ${FILE_2}: ${CHANGE_DESCRIPTION}

## Prevention Measures

### Immediate (auto-create)
1. **New test:** Add test case to `backend/tests/` that would have caught this
2. **New alarm:** Add CloudWatch alarm for ${METRIC} with threshold ${VALUE}
3. **Quality gate:** Add validation in ${NORMALIZER|PARSER|COLLECTOR}

### Long-term (propose)
1. ${ARCHITECTURAL_IMPROVEMENT}
2. ${MONITORING_GAP_TO_FILL}
3. ${PROCESS_IMPROVEMENT}

## Lessons Learned
- What worked: ${WHAT_WORKED}
- What didn't work: ${WHAT_DIDNT}
- What to improve: ${IMPROVEMENTS}
```

## Workflow

### Step 1: Extract incidents from Self-Healing Log

```bash
# Parse the last day's Self-Healing Log entries
rg "^\|" ops/reports/daily-ops-report.md | rg -v "Timestamp|---"
```

### Step 2: For each incident, gather evidence

For each row in the log:
1. Read the source skill's output section for full diagnostic details
2. Read the git diff from the fix branch
3. Read the PR description
4. Query the database for impact assessment

### Step 3: Generate post-mortem

Fill in the template above with evidence from Step 2.

### Step 4: Propose prevention measures

For each incident type:

| Type | Prevention |
|------|-----------|
| PARSER_BROKEN | Add fixture test with new response format |
| RATE_ANOMALY | Add z-score > 5 hard rejection in normalizer |
| DLQ_SPIKE | Add per-provider DLQ alarm |
| STALE_FX | Add FX freshness alarm with lower threshold |
| PROVIDER_DOWN | Add HTTP health check probe |
| STUCK_TASK | Add sweep task timeout alarm |

### Step 5: Auto-create prevention artifacts

For test cases:

```bash
# Create a test file for the specific scenario
BRANCH="prevent/postmortem-$(date +%Y%m%d)-${INCIDENT_ID}"
git checkout -b "$BRANCH" develop
# Write test... (generated from post-mortem analysis)
pnpm -C backend test --run
git add -A && git commit -m "test: add regression test for ${ISSUE_TITLE}"
git push -u origin "$BRANCH"
gh pr create --title "test: prevent recurrence of ${ISSUE_TITLE}" --body "..."
```

For alarms (CDK):

```bash
# Propose alarm addition to monitoring.ts
# (Creates PR with CDK change)
```

### Step 6: Archive post-mortem

```bash
mkdir -p ops/postmortems
cp postmortem.md "ops/postmortems/$(date +%Y-%m-%d)-${INCIDENT_ID}.md"
```

## Output template

```
## Post-Mortem Summary — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Incidents reviewed: <n>

### Incidents
| ID | Issue | Severity | Auto-fixed | Prevention PR |
(table rows)

### Prevention Measures Created
| Type | Description | PR |
(table rows)

### Systemic Patterns
- Most common root cause: ${TYPE}
- Most affected provider: ${PROVIDER}
- Most affected corridor: ${CORRIDOR}
- Recommendation: ${SYSTEMIC_FIX}
```

## Central report integration

Write summary to **Section 21: Post-Mortems** in `ops/reports/daily-ops-report.md`.

## When to run
- **Daily (after self-healing cycle):** Review all auto-fixes
- **Weekly:** Aggregate patterns and propose systemic improvements
- **After major incidents:** Immediate post-mortem
