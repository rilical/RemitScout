# Remit-Scout Runbooks (Agent-Friendly)

## Purpose
This file is the canonical, repo-native runbook index for Remit-Scout operational triage.

Design goals:
- Keep investigation steps **bounded** and **evidence-first**.
- Prefer **reason-coded evidence packs** over raw logs.
- Always tie work back to a Case under `.remit-scout/cases/<case_id>/`.

## Start here (system map)
- Architecture + invariants: `ARCHITECTURE.md`
- IssueOps contracts: `.remit-scout/README.md`
- Ops report contracts: `ops/reports/README.md`
- Monitoring/alarms wiring: `infrastructure/cdk/lib/monitoring.ts`
- Schedules/probes wiring: `infrastructure/cdk/lib/scheduled-jobs.ts`

## Evidence-first playbooks (recommended)

### 1) Provider scraping failures (403/429/captcha/no quotes)
Goal: determine whether the provider is blocked, rate-limited, circuit-open, or simply not collecting.

Preferred evidence:
- Skill: `evidence.provider_health.github_actions`
- Skill: `probe.provider.github_actions` (if provider supports GH probes)
- Script (local fallback): `pnpm -C backend exec tsx scripts/evidence/provider-health-evidence.ts`

Next steps:
- If health corridors are stale/missing: run corridor forensics against a representative corridor:
  - Skill: `forensics.corridor_provider.local`

### 2) Queue backlog / DLQ nonzero
Goal: determine whether a queue is stuck and whether DLQ implies data loss.

Preferred evidence:
- Skill: `evidence.queue_backlog.github_actions`
- Script (local fallback): `pnpm -C backend exec tsx scripts/evidence/queue-backlog-evidence.ts`

Next steps:
- If DLQ > 0: treat as Sev1/Sev2 depending on env; escalate and capture DLQ send errors and worker health.

### 3) API latency / 5xx
Goal: determine whether Plane A/C is slow or failing, with numeric p95 and error/timeout rates.

Preferred evidence:
- Skill: `evidence.http_latency.github_actions`
- Script (local fallback): `pnpm -C backend exec tsx scripts/evidence/http-latency-evidence.ts`

## Notes
- Evidence artifacts should be uploaded as GitHub Actions artifacts by default.
- Large blobs (logs, traces) should be referenced by pointer, not pasted into Case contracts.

## On-call + Status Page References
- Escalation policy: PagerDuty primary + secondary rotation (configured via SNS integration in CDK).
- External uptime monitor: CDK synthetics alarms (uptime-synthetic workflow has been archived to `.github/workflows-archive/`).
- Public status updates: maintain customer-facing status page links in incident comms templates.
- Reference: `docs/ops/status-page-and-escalation.md`.
