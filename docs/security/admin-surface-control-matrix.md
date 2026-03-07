# Admin Surface Control Matrix

Purpose:
- inventory the Plane A admin surface used by the Nuxt admin console and Plane A admin-session bootstrap;
- make guard, allowlist, MFA, IP-allowlist, and smoke coverage expectations explicit;
- give CI/review a stable source of truth alongside route-matrix tests.

Primary evidence:
- `backend/tests/admin-surface-matrix.test.ts`
- `backend/tests/admin-surface-route-coverage.test.ts`
- `backend/tests/ip-allowlist.test.ts`
- `backend/tests/index-corrections-route.test.ts`
- `backend/tests/sessions-route.test.ts`
- `frontend/tests/unit/admin-pages-metadata.test.ts`
- `frontend/tests/unit/pages/admin-*.test.ts`
- `frontend/tests/e2e/admin-surface.spec.ts`
- `.github/workflows/staging-go-live-readiness.yml`
- `.github/workflows/deploy.yml`

Audit closeout:
- `docs/security/admin-surface-audit-findings.md`

## Backend Surface

| Surface | Guard / bootstrap | Role floor | Allowlist | MFA | Admin IP allowlist | Audit-log expectation | Coverage | Staging smoke |
|---|---|---|---|---|---|---|---|---|
| `/api/v1/sessions/admin/exchange` | Supabase JWT + `resolveAdminAccess()` | `admin` | yes | yes | no | no | `backend/tests/sessions-route.test.ts` | yes |
| `/api/v1/sessions/admin/refresh` | refresh-token family + admin-session verifier | prior admin session | yes | preserved | no | no | `backend/tests/sessions-route.test.ts` | yes |
| `/api/v1/admin/users`, `/api/v1/admin/plans` | `requireAdmin` | `admin` | yes | yes | yes | read-only | route matrix + admin route tests | `/admin/plans` yes |
| `/api/v1/admin/plans/grant`, `/api/v1/admin/plans/revoke`, `/api/v1/admin/users/role` | `requireSuperAdmin` | `super_admin` | yes | yes | yes | yes | `backend/tests/admin-route.test.ts` + route matrix | grant/revoke yes |
| `/api/v1/admin/discovery/scans*`, `/api/v1/admin/discovery/pending-reviews`, approve/dismiss | `requireAdmin` | `admin` | yes | yes | yes | mutation routes yes | `backend/tests/admin-surface-route-coverage.test.ts` + route matrix | no |
| `/api/v1/admin/feature-flags*` | `requireAdmin` | `admin` | yes | yes | yes | yes | `backend/tests/admin-feature-flags-route.test.ts` + route matrix | no |
| `/api/v1/admin/institutional/clients*` | `requireAdmin` | `admin` | yes | yes | yes | yes | `backend/tests/admin-institutional-route.test.ts` + metadata/page tests | no |
| `/api/v1/admin/newsletter/*` | `requireAdmin` | `admin` | yes | yes | yes | send/create yes | `backend/tests/admin-surface-route-coverage.test.ts` + route matrix | no |
| `/api/v1/admin/ads*` | `requireAdmin` | `admin` | yes | yes | yes | yes on writes | route matrix | no |
| `/api/v1/ops/<provider>/health`, `/api/v1/ops/providers/health` | `requireAdmin` | `admin` | yes | yes | yes | read-only | provider-health tests + route matrix | indirect via observer summary/provider health checks |
| `/api/v1/ops/b2b-sweep-status`, `/api/v1/ops/indices/health`, `/api/v1/ops/observer/summary`, `/api/v1/ops/api-keys/stale`, `/api/v1/ops/providers/explain` | `requireAdmin` | `admin` | yes | yes | yes | read-only | `backend/tests/admin-surface-route-coverage.test.ts` + route matrix | observer summary yes |
| `/api/v1/ops/db/ensure-alert-notification-attempts`, `/api/v1/ops/alerts/evaluate` | `requireSuperAdmin` | `super_admin` | yes | yes | yes | yes | `backend/tests/admin-surface-route-coverage.test.ts` + route matrix | no |
| `/api/v1/ops/gold/exports/cdp-daily*` | `requireAdmin` | `admin` | yes | yes | yes | download access only | `backend/tests/ops-gold-exports-route.test.ts` + route matrix | no |
| `/api/v1/ops/modules/*`, `/api/v1/ops/agents/*`, `/api/v1/ops/stress/*`, `/api/v1/ops/quality/*`, `/api/v1/ops/gold/corrections`, `/api/v1/ops/services/health` | `requireAdmin` | `admin` | yes | yes | yes | mutations yes on stress overrides | `backend/tests/admin-surface-route-coverage.test.ts` + route matrix | no |
| `/api/v1/audit/logs*` | `requireAdmin` | `admin` | yes | yes | yes | read-only | `backend/tests/audit-route.test.ts` + route matrix | yes |
| `/api/v1/analytics/*`, `/api/v1/telemetry/analytics` | `requireAdmin` | `admin` | yes | yes | yes | read-only | route matrix + auth coverage | no |
| `/api/v1/indices/corrections*` | `requireAdmin` | `admin` | yes | yes | yes | yes on create/approve | route matrix + `backend/tests/index-corrections-route.test.ts` + `backend/tests/ip-allowlist.test.ts` | no |

Notes:
- `/api/v1/audit/my-activity` is authenticated user activity, not part of the privileged admin surface.
- `allowlist=yes` means admin access is still subject to `PLANE_A_ADMIN_EMAILS` / `PLANE_A_ADMIN_EMAIL_DOMAINS` when configured.
- `Admin IP allowlist=yes` means the Plane A pre-handler at `backend/plane-a/src/plugins/ip-allowlist.ts` blocks the route unless the caller IP is included in `ADMIN_IP_ALLOWLIST` (or its explicit fallback sources).

## Frontend Admin Pages

All `/admin/**` pages must use `middleware: ['auth', 'admin']` and `layout: 'admin'`, and rely on `/api/v1/me` for current server truth.
After the page passes `/me`, privileged admin console requests must prefer the short-lived Plane A admin session token from
`/api/v1/sessions/admin/exchange` or `/api/v1/sessions/admin/refresh`; `/api/v1/me` and the bootstrap routes themselves continue to use the primary Supabase session.

| Page | Purpose | Backend dependencies | Coverage |
|---|---|---|---|
| `/admin` | overview shell | admin layout + observer/ops cards | admin layout tests + metadata test |
| `/admin/observer` | ops center + provider health | `/ops/*`, `/me` | `frontend/tests/unit/pages/admin-observer.test.ts` + `frontend/tests/e2e/admin-surface.spec.ts` (remote) |
| `/admin/audit` | audit console | `/audit/logs*` via `useAudit()` | `frontend/tests/unit/pages/admin-audit.test.ts` |
| `/admin/enterprise` | enterprise grant/revoke | `/admin/plans*` | `frontend/tests/unit/pages/admin-enterprise.test.ts` + `frontend/tests/e2e/admin-surface.spec.ts` (remote) |
| `/admin/institutional` | B2B client lifecycle | `/admin/institutional/*` | `frontend/tests/unit/pages/admin-institutional.test.ts` |
| `/admin/ads`, `/admin/analytics`, `/admin/agents`, `/admin/data-quality`, `/admin/delivery-progress`, `/admin/feature-flags`, `/admin/gold-exports`, `/admin/incidents`, `/admin/modules`, `/admin/newsletter`, `/admin/stress` | remaining admin console pages | page-specific `/admin/*`, `/ops/*`, `/analytics/*` | `frontend/tests/unit/admin-pages-metadata.test.ts` + admin layout/bootstrap tests |

## Thread 1 Reconciliation Matrix

| Surface | Expected access | Actual access | Backend guard | Frontend gate | Error code | Fix |
|---|---|---|---|---|---|---|
| `/api/v1/sessions/admin/exchange`, `/api/v1/sessions/admin/refresh` | admin only, prior admin session only on refresh | matches expected after hardening | `resolveAdminAccess()` on exchange; refresh revalidates current admin access before issuing a new token | admin layout bootstraps via `useAdminSession()` after `/me` | `missing_authorization_header`, `mfa_required`, `admin_allowlist_denied`, `admin_allowlist_required_but_unconfigured`, `invalid_refresh_token`, `refresh_replay_detected` | refresh path now fails closed when admin role or allowlist access is removed |
| `/api/v1/admin/**`, `/api/v1/ops/**`, `/api/v1/audit/**`, `/api/v1/analytics/**`, `/api/v1/telemetry/analytics`, `/api/v1/indices/corrections*` | admin or super-admin only | matches expected after hardening | `requireAdmin()` / `requireSuperAdmin()` plus admin IP allowlist | no direct consumer UI except `/admin/**` console pages | `revoked_token`, `mfa_required`, `admin_allowlist_denied`, `admin_allowlist_required_but_unconfigured`, `super_admin_required`, `admin_ip_not_allowlisted` | `requireSuperAdmin()` now uses the same shared admin resolver and revoked-token check as `requireAdmin()` |
| `/admin/**` pages | admin only | matches expected after hardening | page-specific admin routes from rows above | `middleware: ['auth', 'admin']`, `layout: 'admin'`, admin layout session bootstrap | `revoked_token`, `mfa_required`, `admin_allowlist_denied`, `admin_ip_not_allowlisted`, `super_admin_required` | privileged admin console requests now prefer the Plane A admin token, and shared admin error mapping is applied across the audited pages |

## Workflow Gates

| Workflow | Evidence | Pass condition |
|---|---|---|
| `staging-go-live-readiness.yml` | Omar entitlement smoke + admin surface smoke artifacts + Playwright admin UI smoke artifacts | Omar resolves to `super_admin` + enterprise, runner IP is allowlisted, admin session exchange succeeds, `/ops/observer/summary` and `/audit/logs` read, enterprise grant/revoke on `support@remit-scout.com` succeeds, and the staged admin UI can sign in, open observer, and complete the same reversible grant/revoke flow |
| `deploy.yml` (staging path) | Omar entitlement smoke + admin surface smoke artifacts + Playwright admin UI smoke artifacts | same as readiness, on the deployed staging stack before post-deploy promotion checks continue |

## Operational Caveat

GitHub-hosted runners are outside the Plane A admin IP allowlist unless explicitly included. The staging admin smoke therefore fails closed until the runner egress IP falls within `ADMIN_IP_ALLOWLIST` / `WAF_ADMIN_ALLOWLIST_IPS`. That is intentional: the smoke proves real admin reachability, it does not bypass the network control.
