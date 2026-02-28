---
entrypoints:
  - ".remit-scout/README.md"
  - ".remit-scout/skills/catalog.yaml"
  - ".remit-scout/reason-codes/catalog.yaml"
  - ".remit-scout/providers/catalog.json"
  - ".remit-scout/schema/prd.schema.json"
  - ".remit-scout/schema/plan.schema.json"
  - ".remit-scout/schema/run.schema.json"
evidence_skills:
  - "evidence.provider_health.github_actions"
  - "evidence.queue_backlog.github_actions"
  - "evidence.exports_health.github_actions"
  - "evidence.freshness_slo.github_actions"
common_reason_codes:
  - "evidence.error"
---
# IssueOps Contracts + Catalogs (.remit-scout) (AGENTS)

What this directory is:
Repo-native, durable contracts and registries that make automation deterministic.

Entrypoints:
- `.remit-scout/skills/catalog.yaml`
- `.remit-scout/reason-codes/catalog.yaml`
- `.remit-scout/providers/catalog.json`
- `.remit-scout/schema/*.schema.json`

Common failure modes:
- Skill/workflow drift: workflow inputs renamed but catalog not updated.
- Evidence drift: scripts emit unregistered reason codes.
- Provider drift: provider folders and catalog disagree.

Evidence skills to run:
- Any `evidence.*.github_actions` skill (see `.remit-scout/skills/catalog.yaml`).

Do-not-break rules:
- Treat these files as APIs; CI enforces consistency.
- Keep evidence blobs out of git; store pointers (Actions artifacts/S3/etc).

