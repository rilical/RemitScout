# IssueOps Cases (`.remit-scout/cases/`)

## Purpose
This folder holds **durable Case artifacts** that make operational work auditable and automation-friendly.

Each Case is a directory: `.remit-scout/cases/<case_id>/` containing:
- `prd.yaml` (what happened, severity, suspected components)
- `plan.yaml` (ordered skills to run + guardrails)
- `runs/run-<timestamp>.json` (evidence + outcomes, produced by executors; includes required `decision_record`)

Case lifecycle index:
- `.remit-scout/cases/index.json` tracks lifecycle status per case (`open`, `blocked`, `closed`) and last update time.

## Creating a new case
1. Pick a deterministic `case_id` (stable + URL-safe; recommended shape: `case-<env>-<domain>-<subject>-<fingerprint>`).
2. Create `.remit-scout/cases/<case_id>/prd.yaml` using `.remit-scout/templates/prd.template.yaml`.
3. Create `.remit-scout/cases/<case_id>/plan.yaml` using `.remit-scout/templates/plan.template.yaml`.
4. Executors (GitHub Actions, AWS jobs, local runners) write run artifacts under:
   `.remit-scout/cases/<case_id>/runs/`.
5. Add/update the corresponding lifecycle row in `.remit-scout/cases/index.json`.

## CI gate
If you change anything under `.remit-scout/`, CI validates:
- templates
- schemas
- skills catalog
- provider catalog basic sanity
- any case folders that exist
