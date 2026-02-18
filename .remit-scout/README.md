# Remit-Scout IssueOps Contracts (`.remit-scout/`)

## Purpose
This folder is the durable, repo-native source of truth for operational Cases and agent execution.

Design goals:
- **Durable artifacts**: every action ties back to a Case PRD/Plan/Run.
- **Repo-native**: contracts live with code, reviewed via PRs, validated in CI.
- **Executor-agnostic**: Slack, GitHub Actions, AWS schedules, and local automations all write the same Run artifacts.

## Layout
- `schema/`: JSON Schemas for PRD/Plan/Run and registries.
- `templates/`: starter templates for humans/agents.
- `skills/`: skill registry used by the “brain” to select actions.
- `providers/`: provider catalog used to eliminate duplicated probe/provider lists.
- `cases/<case_id>/`:
  - `prd.yaml`
  - `plan.yaml`
  - `runs/run-<timestamp>.json`

## CI Rules
- Case artifacts and registries must be schema-valid.
- Missing required fields or invalid shapes fail the PR.

