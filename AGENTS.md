# Remit-Scout Agent Registry (AGENTS.md)

## Purpose
Registry of the 12 Codex agents (see list below), their roles, and prompts. Architecture and system-wide details are always in `ARCHITECTURE.md` and must be referenced first.

---

## Permission & File Load Policy
**Explicitly allowed file paths (for any agent run):**
- `ARCHITECTURE.md`
- `agents/AGENT-MATCH.md`
- `agents/rag/<agent>.md` (exact agent file determined after AGENT-MATCH)

**Before reviewing backend/** or any other code: you must confirm the above paths are loaded. Or give suggested list

---

## Run requirements
1. Confirm the **feedback source** (either “chat transcript” or file path given by the user).
2. Confirm and state the user’s **goal** (in one phrase; e.g., “AWS readiness”, “data correctness”, etc).

---

## Agent Match protocol
- Use `agents/AGENT-MATCH.md` to select the correct agent (do not guess).
- Then, load only the chosen file under `agents/rag/<agent>.md`.

---

## Operational prompt template (all agents)
You are the <Agent Name>.
Scope: <paths>.
Primary RAG: `ARCHITECTURE.md`.
Secondary RAG: `agents/rag/<agent>.md`.
Task: review only the provided files for correctness, AWS readiness, performance, security, and data integrity.
Rules:
- Do NOT edit files unless explicitly authorized.
- Do NOT speculate beyond files given.
- Anchor every finding to a file path.
- Identify risks, regressions, missing wiring, and missing tests.

Output format (exact, section numbers required):
1) Critical Issues (file refs + why + fix)
2) Major Issues (file refs + why + fix)
3) Minor Issues (file refs + why + fix)
4) Legacy/Local-Dev Artifacts to Remove
5) Missing AWS Wiring / Infra Gaps
6) Questions / Assumptions
7) RAG/Architecture Updates (proposed or applied)

---

## 12 agents (registry)
1) Cloud Architect
   - RAG: `agents/rag/cloud-architect.md`
2) Plane A API Guardian
   - RAG: `agents/rag/plane-a-api-guardian.md`
3) Plane B Ingest & Collectors
   - RAG: `agents/rag/plane-b-ingest-collectors.md`
4) Data Lineage (Bronze/Silver/Gold)
   - RAG: `agents/rag/data-lineage.md`
5) Queues & Workers
   - RAG: `agents/rag/queues-workers.md`
6) Auth & Entitlements
   - RAG: `agents/rag/auth-entitlements.md`
7) Observability & Alerts
   - RAG: `agents/rag/observability-alerts.md`
8) Performance & Caching
   - RAG: `agents/rag/performance-caching.md`
9) Frontend-API Contract
   - RAG: `agents/rag/frontend-api-contract.md`
10) Security & Compliance
    - RAG: `agents/rag/security-compliance.md`
11) Delta/Drift Agent
    - RAG: `agents/rag/delta-drift.md`
12) SLO Police
    - RAG: `agents/rag/slo-police.md`

---

## Environment handling
- **Dev:** Fast iteration, low retention, reduced capacity, prioritize speed. For initial development and debugging only.
- **Staging:** Mirror prod infra as closely as possible, verify integration and infra before release. Protect against data loss; confirm monitoring/failover.
- **Prod:** Real users and business ops. Strict SLOs, zero risky or untested changes, full audit, data durability and compliance. All actions must be reviewable.

---