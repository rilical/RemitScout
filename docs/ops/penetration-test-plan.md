# Penetration Test Plan

## Objective
Run an external penetration assessment before public launch and remediate all critical/high findings.

## Window
- Target execution week: `2026-03-09`.
- Re-test window: within 10 business days after remediation.

## Scope
- Public Plane A API (`/api/v1/*`)
- Plane C internal auth boundary
- Auth/session flows, billing checkout/webhooks, rate limiting controls
- WAF/admin path protections
- SSR/frontend attack surface for sensitive routes

## Out of Scope
- Third-party provider APIs outside Remit-Scout ownership
- Denial-of-service volume attacks above approved test profile

## Deliverables
- Executive summary
- Full technical findings with CVSS and reproduction
- Remediation recommendations
- Re-test attestation

## Remediation SLA
- Critical: 72 hours
- High: 7 days
- Medium: 30 days
- Low: next planned hardening cycle

## Ownership
- Security owner: Platform/SRE
- Engineering owner: Plane A + shared platform leads
- Compliance approver: Legal/compliance lead

