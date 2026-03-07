# CI/CD Data Safety Hardening — Design

**Date:** 2026-03-04
**Status:** COMPLETED (implemented 2026-03-04)
**Scope:** Approach A — Essential protections only (CDK changes)

## Problem

Several data stores lack protection against accidental overwrites or deletion:

- **Exports bucket** (`remit-scout-exports-{env}`): `versioned: false` — overwritten gold indices are gone forever
- **User assets bucket** (`remit-scout-user-assets-{env}`): `versioned: false` — overwritten user uploads are gone forever
- **Audit logs bucket** (`remit-scout-audit-logs-{env}`): `versioned: false` — tampered audit trail undetectable
- **Redis (ElastiCache)**: no snapshot retention — cache loss requires full recompute
- **KMS DataEncryptionKey**: no explicit pending deletion window — accidental key deletion makes bronze + audit data unreadable

## Changes

### 1. Enable S3 versioning on 3 buckets (`storage.ts`)

| Bucket | `versioned` | Noncurrent version expiry |
|--------|-------------|--------------------------|
| `exportsBucket` | `true` | 30 days |
| `userAssetsBucket` | `true` | 30 days |
| `auditLogsBucket` | `true` | 90 days (compliance) |

Noncurrent version expiration controls storage costs by auto-deleting old versions after the retention window.

### 2. Add Redis snapshot retention (`cache.ts`)

Add `snapshotRetentionLimit: 1` to prod/staging replication groups. Provides one daily automatic snapshot. Dev remains at 0.

### 3. Set KMS key pending deletion window (`storage.ts`)

Add `pendingWindow: Duration.days(30)` to the `DataEncryptionKey`. Ensures 30-day cancellation window before key material is destroyed.

## What's NOT Changing

- Bronze bucket: already versioned + KMS encrypted (no changes needed)
- Aurora database: already has deletion protection, 14-day backups, restore testing
- Deployment workflow: no changes to deploy.yml
- No cross-region replication (deferred to Approach B, pre-B2B launch)
- No S3 Object Lock (deferred to Approach C, enterprise phase)

## Risk Assessment

All changes are additive and non-breaking:
- Enabling versioning on existing buckets is safe (doesn't affect existing objects)
- Adding snapshot retention is a config change (no data movement)
- KMS pending window is a safety net (doesn't change current key behavior)
- New Relic already monitors these services — no extra observability config needed

## Files Modified

- `infrastructure/cdk/lib/storage.ts` — versioning + noncurrent lifecycle + KMS pending window
- `infrastructure/cdk/lib/cache.ts` — Redis snapshot retention
