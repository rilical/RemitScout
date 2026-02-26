---
description: Run coordinated agentic review for the current task.
agent: agentic-orchestrator
subtask: true
---

Process this request as a full coordinated workflow using these steps:

1. Clarify the request goal in one sentence.
2. Use `code-reviewer` for correctness, boundaries, and risk.
3. Use `coding-engineer` for implementation and edits.
4. If provider-related, use `provider-integrator` for implementation scope.
5. For domain-specific review, use matched specialists by domain:
   - `cloud-architect`, `plane-a-api-guardian`, `plane-b-ingest-collectors`,
   - `data-lineage`, `queues-workers`, `auth-entitlements`,
   - `observability-alerts`, `performance-caching`, `frontend-api-contract`,
   - `security-compliance`, `delta-drift`, `slo-police`,
   - `infra-sentinel`, `provider-onboarding`, `data-quality-sentinel`.
6. Use `testing-engineer` to propose/apply validation commands.
7. If operations/deploy-related, use `ops-runbook` for command sequencing.
8. Return a final action plan with file refs, severity, validation output, and next commands.
