---
description: Execute coordinated implementation and validation workflow.
agent: agentic-orchestrator
subtask: true
---

Run this as a full implementation loop:

1) Clarify goal and success criteria in one sentence.
2) Invoke `code-reviewer` to validate architecture/plane boundaries and regression risk.
3) Invoke `coding-engineer` to implement scoped changes.
4) If provider or normalizer work is involved, invoke `provider-integrator`.
5) Invoke `testing-engineer` and collect verification results.
6) If deployment/runbook work is involved, invoke `ops-runbook`.
7) Return:
   - final patch summary
   - changed file references
   - validation outcome
   - next best actions
