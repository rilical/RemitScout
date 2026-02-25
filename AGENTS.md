---
entrypoints:
  - "ARCHITECTURE.md"
  - "agents/AGENT-MATCH.md"
  - "docs/runbooks/agent-deploy-promotion-checklist.md"
  - ".remit-scout/AGENTS.md"
  - "ops/brain/README.md"
  - "backend/scripts/brain/brain.ts"
  - "backend/scripts/frontdesk/slack-frontdesk.ts"
evidence_skills:
  - "evidence.provider_health.github_actions"
  - "evidence.queue_backlog.github_actions"
  - "evidence.http_latency.github_actions"
  - "evidence.exports_health.github_actions"
  - "evidence.freshness_slo.github_actions"
common_reason_codes:
  - "evidence.error"
---
# Remit-Scout Agent Registry (AGENTS)

Primary source of truth:
- System invariants and plane boundaries are in `ARCHITECTURE.md`.

Required load order (before touching code):
1. `ARCHITECTURE.md`
1. `agents/AGENT-MATCH.md`
1. `docs/runbooks/agent-deploy-promotion-checklist.md` (mandatory for any deploy/promotion work)
1. `agents/rag/<agent>.md` (selected by AGENT-MATCH)

Run requirements:
1. Confirm the feedback source (chat transcript or file path).
1. Confirm the user goal (one phrase).

Agent match protocol:
- Use `agents/AGENT-MATCH.md` to choose the correct agent doc.
- Do not guess; if ambiguous, ask for the domain (providers, queues, indices, exports, pulse, infra drift).

Operational prompt template (all agents):
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

Agent registry:
| # | Agent | RAG doc |
|---:|---|---|
| 1 | Cloud Architect | `agents/rag/cloud-architect.md` |
| 2 | Plane A API Guardian | `agents/rag/plane-a-api-guardian.md` |
| 3 | Plane B Ingest & Collectors | `agents/rag/plane-b-ingest-collectors.md` |
| 4 | Data Lineage (Bronze/Silver/Gold) | `agents/rag/data-lineage.md` |
| 5 | Queues & Workers | `agents/rag/queues-workers.md` |
| 6 | Auth & Entitlements | `agents/rag/auth-entitlements.md` |
| 7 | Observability & Alerts | `agents/rag/observability-alerts.md` |
| 8 | Performance & Caching | `agents/rag/performance-caching.md` |
| 9 | Frontend-API Contract | `agents/rag/frontend-api-contract.md` |
| 10 | Security & Compliance | `agents/rag/security-compliance.md` |
| 11 | Delta/Drift Agent | `agents/rag/delta-drift.md` |
| 12 | SLO Police | `agents/rag/slo-police.md` |
| 13 | Infrastructure Sentinel | `agents/rag/infra-sentinel.md` |
| 14 | Provider Onboarding | `agents/rag/provider-onboarding.md` |
| 15 | Data Quality Sentinel | `agents/rag/data-quality-sentinel.md` |

Environment handling:
- Dev: speed > rigor; debug only.
- Staging: mirror prod; verify wiring + alarms.
- Prod: read-only evidence by default; all changes audited and reviewable.

OpsPause invariants:
- Pause must disable producer schedules and prevent scheduled backlog growth.
- Resume may purge only explicit non-DLQ volatile queues before worker restore.
- Pause/resume flows must validate expected EventBridge + ECS state and report drift.
