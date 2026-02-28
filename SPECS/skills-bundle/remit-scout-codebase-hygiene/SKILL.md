---
name: remit-scout-codebase-hygiene
description: Detect legacy code, local-dev artifacts, dead code, commented blocks, hardcoded URLs, and missing gitignore entries across the Remit-Scout codebase. Use weekly or before releases to keep the repo clean.
---

# Remit-Scout Codebase Hygiene

## Overview

Automated code quality audit focused on production readiness. Scans for artifacts that indicate local development leaks, legacy/deprecated code, and patterns that should be cleaned before staging/prod deployment.

## Checks

### 1. Local development artifacts

Search for localhost references in production code (exclude test files):

```bash
rg -n "localhost|127\.0\.0\.1|0\.0\.0\.0" backend/ --glob '!*.test.*' --glob '!*.spec.*' --glob '!*.example' --glob '!node_modules/' --glob '!tmp/'
```

Known acceptable patterns (document, don't fix):
- `backend/shared/config.ts` — fallback URLs guarded by `isStrictConfig`
- `backend/plane-a/src/plugins/swagger.ts` — dev-only Swagger URL

Flag anything NOT in the known list.

### 2. Hardcoded file paths

```bash
rg -n "/Users/|/home/|C:\\\\|D:\\\\" backend/ frontend/ infrastructure/ --glob '!node_modules/'
```

Any match is a leak. Check `backend/tmp/` especially.

### 3. TODO/FIXME/HACK audit

```bash
rg -n "TODO|FIXME|HACK|XXX|TEMP|TEMPORARY" backend/ frontend/ --glob '!node_modules/' --glob '!*.md' -c
```

Detailed list:

```bash
rg -n "TODO|FIXME|HACK" backend/ frontend/ --glob '!node_modules/' --glob '!*.md'
```

### 4. Commented-out code blocks (>5 lines)

```bash
rg -n "^(\s*//.+){5,}" backend/plane-a/src/ backend/plane-b/src/ backend/scripts/ --multiline
```

Known: `backend/plane-b/src/notifications/dispatcher.ts` — Sprint 4 block (~50 lines).

### 5. Deprecated files and modules

Check for explicit deprecation markers:

```bash
rg -n "@deprecated|DEPRECATED|deprecated" backend/ infrastructure/ --glob '!node_modules/'
```

Known deprecated:
- `backend/plane-b/src/notifications/config.ts` — use `config-aws.ts` instead
- `infrastructure/k8s/b2c-refresh-worker-cronjob.yaml` — migrated to EventBridge
- `infrastructure/k8s/stoplist-auto-resume-cronjob.yaml` — migrated to EventBridge

### 6. Dead exports (unused code)

```bash
# Find exported functions/constants not imported anywhere
for f in $(rg -l "^export " backend/shared/ backend/plane-a/src/ backend/plane-b/src/ --glob '*.ts'); do
  rg -o "export (?:const|function|class|type|interface|enum) (\w+)" "$f" -r '$1' | while read sym; do
    USES=$(rg -c "\b${sym}\b" backend/ --glob '*.ts' --glob '!*.test.*' --glob "!$(basename $f)")
    if [ "$USES" = "0" ] || [ -z "$USES" ]; then
      echo "UNUSED: ${sym} in ${f}"
    fi
  done
done
```

### 7. Gitignore gaps

Verify these directories are ignored:

```bash
for dir in backend/tmp frontend/tmp backend/coverage artifacts .ralph .worktrees; do
  if git check-ignore -q "$dir" 2>/dev/null; then
    echo "OK: $dir is ignored"
  else
    echo "MISSING: $dir not in .gitignore"
  fi
done
```

### 8. OpenAPI spec consistency

```bash
# Check dev server port matches actual Plane A port
rg "localhost" docs/openapi/ --glob '*.yaml'
```

Compare with `backend/shared/config.ts` Plane A port (default: 4000).

### 9. Environment variable consistency

```bash
# Find all env vars referenced in code
rg -o "process\.env\.(\w+)" backend/ --glob '*.ts' --glob '!node_modules/' -r '$1' | sort -u > /tmp/env_vars_code.txt

# Compare with .env.local.example
rg -o "^(\w+)=" backend/.env.local.example -r '$1' | sort -u > /tmp/env_vars_example.txt

# Find vars in code but not in example
comm -23 /tmp/env_vars_code.txt /tmp/env_vars_example.txt
```

### 10. Security-sensitive files

```bash
# Check for files that shouldn't be committed
rg -l "password|secret|api_key|apikey|token" backend/ --glob '!*.test.*' --glob '!*.example' --glob '!node_modules/' --glob '!*.md' | while read f; do
  if ! git check-ignore -q "$f" 2>/dev/null; then
    echo "REVIEW: $f (contains sensitive keywords and is tracked)"
  fi
done
```

## Output template

```
## Codebase Hygiene Report
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Branch: $(git rev-parse --abbrev-ref HEAD)
Commit: $(git rev-parse --short HEAD)

### Localhost References (non-test)
| File | Line | Content | Known? |
(table rows)

### Hardcoded Paths: <count> found
### TODOs/FIXMEs: <count> total
### Commented Code Blocks: <count>

### Deprecated Files
| File | Replacement | Action |
(table rows)

### Dead Exports: <count>
### Gitignore Gaps: <list>
### OpenAPI Inconsistencies: <list>
### Missing Env Vars (code vs example): <list>
### Security Review: <count> files to review

### Verdict: CLEAN | NEEDS_ATTENTION | DIRTY
### Priority fixes: (list)
```

## Central report integration

Write output to **Section 8: Codebase Hygiene** in `ops/reports/daily-ops-report.md`. Update Executive Summary row for "Codebase Hygiene" with the verdict. Each finding becomes an Action Item row with classification (CODE_FIX, CONFIG_FIX, etc.) for the self-healing automation to pick up.

## When to run
- **Weekly:** Before weekly risk review
- **Pre-release:** Before staging/prod deploy
- **After major refactors:** Catch orphaned code
- **New contributor onboarding:** Baseline code quality check
