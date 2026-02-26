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
5. Use `testing-engineer` to propose/apply validation commands.
6. If operations/deploy-related, use `ops-runbook` for command sequencing.
7. Return a final action plan with file refs, severity, validation output, and next commands.
