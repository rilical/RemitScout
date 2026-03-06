# Admin Surface Audit Findings

Scope:
- Plane A routes guarded by `requireAdmin` or `requireSuperAdmin`
- `/api/v1/sessions/admin/*`
- Nuxt `/admin/**` shell and page flows
- staging readiness and staging deploy workflows that gate admin promotion

Status:
- Critical gaps closed in code and workflow on 2026-03-05
- Major gaps closed in code and workflow on 2026-03-05
- One operational caveat remains open by design: staging admin smoke requires the GitHub runner egress IP to be present in the admin IP allowlist

1) Critical Issues

- None open after remediation.
- Closed: privileged admin routes that previously had weak or indirect release evidence now have a route-matrix contract test in `backend/tests/admin-surface-matrix.test.ts` and direct coverage for previously uncovered admin/ops groups in `backend/tests/admin-surface-route-coverage.test.ts`.
- Closed: staging promotion previously proved Omar entitlement only, but not a real admin session or reversible mutation. This is now enforced by `backend/scripts/ci/admin-surface-smoke.ts`, `.github/workflows/staging-go-live-readiness.yml`, and `.github/workflows/deploy.yml`.
- Closed: the admin IP allowlist previously trusted the first `x-forwarded-for` hop, which could be spoofed if an upstream preserved caller-provided values. `backend/plane-a/src/plugins/ip-allowlist.ts` now trusts the runtime source IP for direct requests and only falls back to the last forwarded hop for CloudFront-proxied traffic, with coverage in `backend/tests/ip-allowlist.test.ts`.
- Closed: the privileged gold index-corrections path was outside the admin IP perimeter, accepted client-controlled approver identities, and wrote no immutable audit events. `backend/plane-a/src/routes/index-corrections.ts` now derives actor identity from `request.user`, writes `logAuditEvent(...)` inside the mutation path, and is covered by `backend/tests/index-corrections-route.test.ts`.
- Closed: `requireSuperAdmin()` previously bypassed the shared admin-access resolver and the Plane A revoked-token check. It now enforces the same allowlist, MFA, and revoked-session contract as `requireAdmin()`.
- Closed: admin refresh-token rotation could mint a fresh Plane A admin access token without revalidating current allowlist access. `backend/plane-a/src/services/admin-sessions.ts` now re-checks admin access during refresh and revokes the refresh family when access has been removed.

2) Major Issues

- None open after remediation.
- Closed: admin and audit handlers were collapsing typed app errors into generic `500 internal_error` responses. `backend/plane-a/src/routes/admin.ts` and `backend/plane-a/src/routes/audit.ts` now preserve `AppError` subclasses such as `ValidationError` and `NotFoundError`.
- Closed: the Nuxt admin surface relied on generic fallback error text in multiple privileged flows. `frontend/utils/adminApiErrors.ts` now normalizes `mfa_required`, `revoked_token`, `forbidden`, `user_not_found`, and `bad_request`, and the admin enterprise, institutional, observer, and audit flows surface those codes clearly.
- Closed: page-level admin coverage was too thin to act as release evidence. `frontend/tests/unit/admin-pages-metadata.test.ts` now enforces auth/admin middleware plus admin layout across `/admin/**`, and page tests cover enterprise, observer, audit, and institutional flows.
- Closed: the admin surface had no browser-level proof that sign-in, admin-session bootstrap, observer read access, and enterprise grant/revoke worked together. `frontend/tests/e2e/admin-surface.spec.ts` now covers that path for remote environments with admin credentials, and staging workflows execute it as part of readiness and deploy evidence.
- Closed: privileged admin console requests silently preferred the long-lived Supabase user token over the short-lived Plane A admin token. `frontend/composables/useApi.ts` now prefers the Plane A admin session token on privileged admin route families so revoked admin sessions fail deterministically.
- Closed: several audited admin pages still surfaced raw backend denial text instead of the shared admin error mapping. The audited analytics, feature flags, stress, ads, and newsletter pages now normalize revoked-session and allowlist failures through `frontend/utils/adminApiErrors.ts`.

3) Minor Issues

- None open after remediation.

4) Legacy/Local-Dev Artifacts to Remove

- None found in the audited admin surface changes.

5) Missing AWS Wiring / Infra Gaps

- Open operational prerequisite: the staging admin smoke is fail-closed unless the GitHub Actions runner egress IP is present in `ADMIN_IP_ALLOWLIST` or `WAF_ADMIN_ALLOWLIST_IPS`. The workflows now check this explicitly before attempting the admin smoke so a false “app failure” does not hide a network policy miss.

6) Questions / Assumptions

- Assumed scope is repo plus staging gate only. No live production validation was performed in this pass.
- Assumed `support@remit-scout.com` remains a safe reversible staging target for enterprise grant and revoke.
- Assumed `/api/v1/me` stays the canonical frontend authority for current role and entitlement truth.

7) RAG/Architecture Updates

- Applied: `ARCHITECTURE.md` now points to `docs/security/admin-surface-control-matrix.md` as the admin-surface inventory and promotion-proof source.
- Applied: `agents/rag/auth-entitlements.md` now includes the admin-session bootstrap and the staging admin-surface smoke requirement.
- Applied: `docs/runbooks/agent-deploy-promotion-checklist.md` and `docs/runbooks/staging-go-live-checklist.md` now require the admin-surface smoke artifact alongside Omar entitlement proof.
