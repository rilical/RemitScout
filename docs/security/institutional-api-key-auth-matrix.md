# Institutional API-Key Auth Matrix

Last updated: 2026-03-05

## Credential classes

| Credential | Provisioned from | Intended audience | Notes |
|---|---|---|---|
| Bearer JWT | Supabase user auth | Human user sessions | Plan and entitlement checks remain the source of truth when `X-API-Key` is absent. |
| Retail user API key | `/api/v1/me/api-keys` | Enterprise user automation | Scoped to `indices:read`, `corridors:read`, and `exports:read`. Never inherits access to public or institutional-only routes. |
| Institutional API key | Admin institutional client management | Contracted B2B consumers | Scoped separately from retail keys, corridor-aware, usage-metered, and blocked when the client is inactive. |

## Deterministic failure codes

| Condition | Status | Code |
|---|---|---|
| Unknown retail or institutional API key | `401` | `invalid_api_key` |
| Revoked retail API key | `401` | `revoked_api_key` |
| Valid API key on a route without explicit API-key policy | `403` | `api_key_route_not_allowed` |
| Institutional client suspended, revoked, or contract-expired | `403` | `institutional_inactive` |
| API key missing the route scope | `403` | `insufficient_scope` |
| Institutional client not allowed for the corridor | `403` | `corridor_not_allowed` |

## Route matrix

| Route family | Bearer JWT | Retail user API key | Institutional API key | Required API-key scope | Governance notes |
|---|---|---|---|---|---|
| `/api/v1/indices/series` | Yes | Yes | Yes | `indices:read` | Reads only from `gold_export.*`; institutional corridor allowlist applies when an institutional key is used. |
| `/api/v1/indices/latest` | Yes | Yes | Yes | `indices:read` | Same payload parity across bearer, retail key, and institutional key for the same allowed corridor. |
| `/api/v1/indices/corridors` | Yes | Yes | Yes | `indices:read` | No retail-plan fallback when an institutional key is presented. |
| `/api/v1/indices/triangulated/:corridorId` | Yes | Yes | Yes | `indices:read` | Institutional corridor allowlist enforced before data access. |
| `/api/v1/history/corridor` | Yes | Yes | No | `corridors:read` | Retail-only API-key path; stays on `gold_export.*` and preserves suppression fields. |
| `/api/v1/exports`, `/api/v1/exports/:id`, `/api/v1/exports/:id/download` | Yes | Yes | No | `exports:read` | Retail-only API-key path; institutional delivery remains out-of-band. |
| `/api/v1/usage` | No | No | Yes | `indices:read` | Institutional-only route; usage logging and rate enforcement apply on every request. |
| `/api/v1/corridors/:corridorId/coverage` | Yes | No | Yes | `corridors:read` | Coverage counts include only active `allowed_b2b` providers from `silver.rights_matrix`. |
| Public quote/provider/rates/geo surfaces | Public or bearer only | No | No | N/A | Any presented API key is authoritative and rejected with `api_key_route_not_allowed` unless the route explicitly opts in. |

## Governance invariants

- `X-API-Key` is authoritative when present. The request does not fall back to bearer auth or anonymous/public handling.
- Institutional API-key access is never broader than bearer enterprise access for the same B2B resource.
- Retail user API keys do not gain access to institutional-only routes, and institutional keys do not gain access to retail export/history pull routes.
- B2B reads continue to honor Gold suppression fields and rights-matrix filtering.

## Mixed-logic audit notes

- Fixed: [`/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/plane-a/src/app.ts`](/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/plane-a/src/app.ts) previously applied account-route bearer auth ahead of retail API-key reads on `/history/*` and `/exports*`.
- Fixed: [`/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/plane-a/src/routes/exports.service.ts`](/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/plane-a/src/routes/exports.service.ts) previously tagged retail API-key export requests as `institutional`.
- Fixed: [`/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/plane-a/src/routes/corridor-coverage.ts`](/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/plane-a/src/routes/corridor-coverage.ts) previously counted providers without enforcing active `allowed_b2b` rights-matrix filters.
- Remaining audited route mix points: none identified in the institutional/API-key scope covered by this remediation pass.
