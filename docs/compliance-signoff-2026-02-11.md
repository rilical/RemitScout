# Remit-Scout Compliance Sign-Off

Date: 2026-02-11  
Scope: staging and planned production launch

## 1) PCI SAQ-A Posture (Stripe)

- Card data collection and processing delegated to Stripe-hosted flows.
- No PAN storage in Remit-Scout services.
- Stripe webhook endpoint: `/api/v1/billing/webhook`.
- Status: **Pending final evidence capture in staging/prod logs**.

## 2) GDPR/CCPA Functional Controls

- Data export endpoint validated: `/api/v1/data/export`.
- Account deletion endpoint validated: `/api/v1/account`.
- Status: **Pending final staging run evidence (request IDs + audit rows)**.

## 3) Access Control and Audit Logging

- JWT auth enabled for protected `/api/v1/*` paths.
- Admin gates enforced via allowlist/Supabase role/`silver.user_account.app_role`.
- Audit routes and event logging in place.
- Status: **Pending security review sign-off**.

## 4) Retention and Breach Basics

- CloudWatch retention configured per environment.
- WAF logging configured for CloudFront WebACL.
- Incident response contacts/runbook required for production launch packet.
- Status: **Pending security + ops approval**.

## 5) Security Validation Summary

- WAF managed rules + rate limits configured.
- CI security checks include CodeQL, Snyk, pnpm audit, secret scanning.
- OWASP ZAP baseline/full scans configured for staging URL (`ZAP_TARGET_URL`).
- Status: **Pending scan execution and triage report**.

## Final Decision

- Launch decision: **Not signed yet**
- Current blockers (2026-02-11):
  - Staging/prod stacks are not deployed yet in `us-east-1`.
  - SES accounts are still in sandbox mode (`ProductionAccessEnabled=false`), so non-verified recipients are blocked.
  - Pentest + DAST execution evidence not attached yet.
- Required approvers:
  - Security:
  - Platform:
  - Engineering:
  - Product/Operations:
