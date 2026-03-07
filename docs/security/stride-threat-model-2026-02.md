# STRIDE Threat Model - 2026-02 (Staging)

## Metadata
- Date opened: 2026-02-20
- Environment: staging
- Method: Claude-assisted STRIDE + operator review
- Sources:
  - `ARCHITECTURE.md`
  - `docs/architecture/security.md`
  - `docs/security/auth-bypass-paths.md`
  - `docs/security/route-validation-audit.md`

Scoring rule: `risk = likelihood * impact` (1-25).

## STRIDE Threat Record (Top 10)
This table is the canonical artifact for prioritized threats and test mapping.

| threat_id | stride | component | boundary | scenario | likelihood | impact | risk | test_to_run | result | next_action |
|---|---|---|---|---|---:|---:|---:|---|---|---|
| T-001 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | TBD | not-run | pending session output |
| T-002 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | TBD | not-run | pending session output |
| T-003 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | TBD | not-run | pending session output |
| T-004 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | TBD | not-run | pending session output |
| T-005 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | TBD | not-run | pending session output |
| T-006 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | TBD | not-run | pending session output |
| T-007 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | TBD | not-run | pending session output |
| T-008 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | TBD | not-run | pending session output |
| T-009 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | TBD | not-run | pending session output |
| T-010 | TBD | TBD | TBD | TBD | 0 | 0 | 0 | TBD | not-run | pending session output |

## Test type mapping rule
- `Burp manual`: endpoint-focused request/response abuse and auth checks.
- `API test`: scripted assertions for auth/validation/entitlement behavior.
- `infra/config check`: IAM, secret, routing, WAF/rate-limit, and deployment posture checks.

## Review checklist
- [ ] Exactly 10 threats ranked by `risk` descending.
- [ ] Every threat includes one runnable test.
- [ ] Every threat maps to one test type.
- [ ] Results synced into findings register when test outcome is `fail`.

