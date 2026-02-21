# Feature Flag Inventory

**Owner:** Engineering Lead
**Last reviewed:** 2026-02-21
**Review cadence:** Monthly

---

## Overview

RemitScout uses a database-backed feature flag system (`system_feature_flag` table) with Redis
caching, plus build-time flags via Nuxt runtime config. This document is the authoritative
registry of all active flags.

---

## Database Feature Flags (Runtime)

Managed via admin API (`/api/v1/admin/feature-flags`). Changes take effect within the cache
TTL (default 60s). Audit trail stored in `system_feature_flag_audit`.

| Flag Key | Purpose | Default | Owner | Retirement Target |
|----------|---------|---------|-------|-------------------|
| *(populated from database at deploy time)* | | | | |

> **Note:** Database flags are dynamically created via the admin panel. Run
> `SELECT key, enabled, description FROM system_feature_flag ORDER BY key;` to get the
> current inventory.

---

## Frontend Build-Time Flags

Defined in `frontend/utils/constants.ts` as `FEATURE_FLAGS`. Require a redeploy to change.

| Flag | Env Var | Default | Purpose | Owner | Retirement Target |
|------|---------|---------|---------|-------|-------------------|
| `PULSE_ENABLED` | `NUXT_PUBLIC_PULSE_ENABLED` | `false` | Enables the Pulse market overview page | Product | GA launch |
| `ENTERPRISE_ENABLED` | `NUXT_PUBLIC_ENTERPRISE_ENABLED` | `false` | Enables enterprise/B2B features in the frontend | Product | GA launch |

---

## Infrastructure / CDK Flags

Defined as CDK context or stack options. Changed at deploy time.

| Flag | Location | Default | Purpose | Owner |
|------|----------|---------|---------|-------|
| `wafEnableBotControl` | `api.ts` ApiOptions | `true` (prod) | Enables AWS WAF Bot Control managed rule | Platform |
| `enableCloudFront` | `api.ts` ApiOptions | `true` (prod) | Enables CloudFront distribution for Plane A | Platform |
| `enableWaf` | `api.ts` ApiOptions | `true` (prod/staging) | Enables WAF on CloudFront | Platform |
| `enablePlaneAJwtAuth` | `api.ts` ApiOptions | `true` (prod/staging) | Enforces JWT auth on Plane A protected routes | Platform |
| `enablePlaneCIamAuth` | `api.ts` ApiOptions | `true` (prod/staging) | Enforces IAM auth on Plane C | Platform |

---

## Queue Mode Flags

Control SQS queue behavior per environment. Set via environment variables or CDK options.

| Flag | Values | Default | Purpose |
|------|--------|---------|---------|
| `QUOTE_REFRESH_QUEUE_MODE` | `queue` / `inline` / `off` | `queue` | B2C quote refresh dispatch mode |
| `FX_RATE_REFRESH_QUEUE_MODE` | `queue` / `inline` / `off` | `queue` | FX rate refresh dispatch mode |
| `EXPORT_JOB_QUEUE_MODE` | `queue` / `inline` / `off` | `queue` | Export job dispatch mode |
| `GOLD_LIVE_QUEUE_MODE` | `queue` / `inline` / `off` | `queue` | Gold live publish dispatch mode |

---

## Flag Lifecycle

1. **Proposal:** Engineer proposes flag with purpose and retirement date
2. **Creation:** Flag added to database or code with `enabled: false`
3. **Rollout:** Gradually enable (e.g., staging -> prod)
4. **Retirement:** Once feature is stable, remove flag and hardcode behavior
5. **Cleanup:** Remove dead code paths and update this document

### Retirement Process
- Flags older than 6 months without a retirement date should be reviewed
- Remove the flag, the conditional code paths, and update this inventory
- File a cleanup ticket if code removal is non-trivial

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-02-21 | Initial version | Engineering |
