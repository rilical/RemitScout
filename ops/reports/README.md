# Ops Reports (`ops/reports/`)

## Purpose
This directory is the canonical place for human and machine-readable operational reporting.

Design goals:
- **One durable place** to look for system health (humans and agents).
- **Stable keys + reason codes** in JSON for automations.
- **Append-only-ish** in markdown for human audit trails.

## Files
- `daily-ops-report.md`
  - Human-readable daily report (can be appended by skills and agents).
- `daily-ops-report.json`
  - Machine-readable status and action items.
  - Intended consumers: the 24/7 brain, CI gates, and self-healing workflows.

## Conventions
- Prefer explicit `reason_code` values in JSON action items (stable identifiers).
- Keep JSON low-cardinality: avoid corridor-by-corridor dumps; link to evidence instead.
- If a skill produces heavy evidence (logs, traces), store it as an artifact and reference it by URL/checksum.

