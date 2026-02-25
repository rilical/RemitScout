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

## 4a) SOC 2 Commercial Readiness

- Enterprise API/key surface is present in product and legal docs, so SOC 2 posture is now explicitly treated as a launch prerequisite before paid institutional onboarding.
- Current interface policy:
  - `COMPLIANCE_SOC2_TYPE_II_STATUS` is tracked (`in_progress` by default).
  - `COMPLIANCE_SOC2_TYPE_II_REPORT_STATE` governs external statement transitions (`in_progress|audited|expired|revoked`).
  - `COMPLIANCE_SOC2_TYPE_II_REPORT_DATE`, `COMPLIANCE_SOC2_TYPE_II_EXPIRES_ON`, and `COMPLIANCE_SOC2_TYPE_II_REPORT_URL` are available for procurement evidence handling.
- Deployment gates now block production promotion when enterprise mode is enabled and `COMPLIANCE_SOC2_TYPE_II_REPORT_STATE` is not `audited`.
- Status: **Blocked for enterprise production sale without audited report state.**

## 5) Security Validation Summary

- WAF managed rules + rate limits configured.
- CI security checks use zero-cost tooling: CodeQL, Trivy filesystem scan, pnpm audit, Semgrep, and secret scanning.
- DAST coverage on staging is configured with hard-fail medium+ policy:
  - OWASP ZAP baseline unauthenticated (nightly + manual)
  - OWASP ZAP API authenticated (nightly + manual)
  - OWASP ZAP full authenticated (manual only)
  - Nuclei unauthenticated/authenticated (nightly + manual)
- DAST configuration:
  - Staging target: `ZAP_TARGET_URL` (or manual dispatch `target_url`)
  - Required auth secret for authenticated scans: `DAST_AUTH_BEARER_TOKEN`
  - Optional auth header variable: `DAST_AUTH_HEADER_NAME` (defaults to `Authorization`)
- Manual security artifacts prepared:
  - Burp runbook: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/burp-manual-security-session.md`
  - STRIDE session brief: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/stride-session-brief.md`
  - STRIDE model artifact: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/stride-threat-model-2026-02.md`
  - Findings register: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/security-findings-register-2026-02.md`
- Pentest operator assets:
  - Playbook: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/pentest-playbook.md`
  - Prompt pack: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/pentest-prompts.md`
- Status: **Pending scan execution evidence attachment and triage report completion**.

## Final Decision

- Launch decision: **Not signed yet**
- Current blockers (2026-02-11):
  - Staging/prod stacks are not deployed yet in `us-east-1`.
  - SES accounts are still in sandbox mode (`ProductionAccessEnabled=false`), so non-verified recipients are blocked.
  - Pentest + DAST workflows are in place; execution evidence must be attached in:
    - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/security-findings-register-2026-02.md`
    - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/stride-threat-model-2026-02.md`
- Required approvers:
  - Security:
  - Platform:
  - Engineering:
  - Product/Operations:
