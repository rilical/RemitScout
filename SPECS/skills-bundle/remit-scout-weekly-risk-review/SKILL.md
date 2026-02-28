---
name: remit-scout-weekly-risk-review
description: Produce the weekly Remit-Scout 1–7 risk report (drift, security, SLOs) by diffing changes and routing review via agents/AGENT-MATCH.md; use before releases and as a weekly operational governance check.
---

# Remit-Scout Weekly Risk Review

## Overview

This is a repeatable, evidence-driven weekly audit: “what changed, what could break, what’s missing (migrations/tests/infra wiring)”.
It is intentionally scoped to **changed files** plus architecture invariants.

## Inputs
- Baseline window: default last **7 days**
- Environment posture: assume **prod risk** unless explicitly “dev-only”
- Evidence sources (optional): AWS read-only + SQL read-only (see `agents/RUNBOOKS.md`)

## Workflow (deterministic)

1) **Compute baseline + changed files**

```bash
git fetch --all --prune
BASELINE="$(git rev-list -n 1 --before='7 days ago' HEAD)"
git diff --name-only "$BASELINE"..HEAD
```

2) **Load architecture invariants**
- `ARCHITECTURE.md`

3) **Select agents via Agent Match (no guessing)**
- Read: `agents/AGENT-MATCH.md`
- Typical weekly set (if scope spans system): `delta-drift`, `security-compliance`, `slo-police`
- Load only the chosen RAG(s): `agents/rag/<agent>.md`

4) **Review only what changed**
- Anchor every finding to a file path.
- Call out missing migrations/tests/wiring and any contract drift (frontend vs backend).

5) **Emit the required report format**

Exact output sections (must include all):
1) Critical Issues
2) Major Issues
3) Minor Issues
4) Legacy/Local-Dev Artifacts to Remove
5) Missing AWS Wiring / Infra Gaps
6) Questions / Assumptions
7) RAG/Architecture Updates (proposed or applied)

## Optional evidence (read-only)
- AWS read-only command patterns: `agents/RUNBOOKS.md`
- Dev pause/cost runbooks: `docs/runbooks/dev-pause-resume.md`, `docs/runbooks/cost-spike.md`

## Output template (for automations/inbox items)
Include at top:
- Baseline commit: `<sha>`
- Changed files count: `<n>`
- Environments impacted: `<dev|staging|prod>`

## Central report integration

Weekly risk review output is standalone but should also update the Action Items table in `ops/reports/daily-ops-report.md` with any Critical or Major issues found, classified for the self-healing automation to act on.
