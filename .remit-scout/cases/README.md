# IssueOps Cases (`.remit-scout/cases/`)

## Purpose
This folder holds **durable Case artifacts** that make operational work auditable and automation-friendly.

Each Case is a directory: `.remit-scout/cases/<case_id>/` containing:
- `prd.yaml` (what happened, severity, suspected components)
- `plan.yaml` (ordered skills to run + guardrails)
- `runs/run-<timestamp>.json` (evidence + outcomes, produced by executors)

## Creating a new case
1. Pick a `case_id` (stable, URL-safe; example: `case-20260218-wise-probe-fail`).
2. Create `.remit-scout/cases/<case_id>/prd.yaml` using `.remit-scout/templates/prd.template.yaml`.
3. Create `.remit-scout/cases/<case_id>/plan.yaml` using `.remit-scout/templates/plan.template.yaml`.
4. Executors (GitHub Actions, AWS jobs, local runners) write run artifacts under:
   `.remit-scout/cases/<case_id>/runs/`.

## CI gate
If you change anything under `.remit-scout/`, CI validates:
- templates
- schemas
- skills catalog
- provider catalog basic sanity
- any case folders that exist

