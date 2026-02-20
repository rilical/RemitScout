# Deploy Strategy (Remit-Scout V2)

## Current Production Path
1. `ci/main` must succeed before `cd/deploy` starts from `main` for staging.
2. Staging deploy runs image build, security gates, migration, smoke, and rollback-on-smoke-failure.
3. Staging deploy now dispatches and waits for `staging/go-live-readiness` as a hard gate.
4. Production deploy (`v*.*.*` tags) now requires a successful staging readiness run for the same commit SHA.

## Rollback Criteria
- Immediate rollback trigger:
  - post-deploy smoke failure
  - deployment task/migration failure
- Alarm-based rollback recommendation:
  - `remit-scout-<env>-api-p99-latency-high`
  - `remit-scout-<env>-api-error-rate-high`
  - any DLQ depth alarm > 0 for critical queues

## Traffic Shift Semantics
- Current runtime strategy is rolling deploy with automated health/smoke rollback hooks.
- Canary-grade rollback conditions are enforced via p99/error alarms and post-deploy smoke.
- If explicit weighted canary is later required, add an ALB/CodeDeploy traffic-shift phase before full promotion.

## Branch Protection Requirement
- Repository branch protection must require:
  - `ci/pr`
  - coverage status checks from Codecov (`project` and critical flags)
  - security scanning checks (`Security Scanning`, `codeql-analysis`)

