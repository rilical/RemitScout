# Security Findings Register - 2026-02 (Staging)

This register tracks all confirmed findings from Burp manual validation and STRIDE-driven test execution.

## Status taxonomy
- `open`: confirmed issue, remediation not yet completed.
- `mitigated`: remediation deployed and validated.
- `accepted`: risk accepted with documented owner approval.

## Security Finding Record
Required fields:
- `id`
- `date`
- `endpoint`
- `actor`
- `threat_type`
- `evidence_link`
- `likelihood`
- `impact`
- `risk`
- `status` (`open|mitigated|accepted`)
- `owner`
- `fix_by`

| id | date | endpoint | actor | threat_type | evidence_link | likelihood | impact | risk | status | owner | fix_by |
|---|---|---|---|---|---|---:|---:|---:|---|---|---|
| F-001 | 2026-02-20 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | open | TBD | TBD |
| F-002 | 2026-02-20 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | open | TBD | TBD |
| F-003 | 2026-02-20 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | open | TBD | TBD |
| F-004 | 2026-02-20 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | open | TBD | TBD |
| F-005 | 2026-02-20 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | open | TBD | TBD |

## Usage notes
- Add one row per confirmed finding.
- Set `risk = likelihood * impact` (1-25).
- Link evidence to sanitized artifacts only (no live credentials/tokens).
- Keep this file updated as remediation status changes.

