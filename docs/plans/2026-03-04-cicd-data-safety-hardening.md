# CI/CD Data Safety Hardening Implementation Plan

> **Status: COMPLETED** — Implemented in commit `2c96fe68` (2026-03-04). S3 versioning, Redis snapshots, and KMS deletion window are now deployed.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Protect S3 buckets, Redis cache, and KMS keys from accidental data loss before production launch.

**Architecture:** CDK-only changes — enable versioning on 3 S3 buckets with noncurrent version expiry, add Redis snapshot retention for prod/staging, and set explicit KMS key pending deletion window.

**Tech Stack:** AWS CDK (TypeScript), S3, ElastiCache, KMS

---

### Task 1: Enable versioning + noncurrent expiry on exports bucket

**Files:**
- Modify: `infrastructure/cdk/lib/storage.ts:116-167`

**Step 1: Enable versioning on exports bucket**

In `storage.ts`, change `exportsBucket` definition:

```typescript
const exportsBucket = new Bucket(scope, 'ExportsBucket', {
    bucketName: `remit-scout-exports-${options.envName}`,
    versioned: true,  // Changed from false
    encryption: BucketEncryption.S3_MANAGED,
    // ... rest unchanged
```

**Step 2: Add noncurrent version expiry lifecycle rule**

Add a new lifecycle rule to the `exportsBucket` lifecycle rules array (after the existing `parquet/` rule, before the `abortIncompleteMultipartUploadAfter` rule):

```typescript
      {
        noncurrentVersionExpiration: Duration.days(30),
      },
```

**Step 3: Verify CDK synth passes**

Run: `cd infrastructure/cdk && npx cdk synth --quiet 2>&1 | tail -5`
Expected: No errors

**Step 4: Commit**

```bash
git add infrastructure/cdk/lib/storage.ts
git commit -m "fix(cdk): enable versioning on exports bucket with 30d noncurrent expiry"
```

---

### Task 2: Enable versioning + noncurrent expiry on user assets bucket

**Files:**
- Modify: `infrastructure/cdk/lib/storage.ts:169-183`

**Step 1: Enable versioning on user assets bucket**

```typescript
  const userAssetsBucket = new Bucket(scope, 'UserAssetsBucket', {
    bucketName: `remit-scout-user-assets-${options.envName}`,
    versioned: true,  // Changed from false
    // ... rest unchanged
```

**Step 2: Add noncurrent version expiry lifecycle rule**

Add to the existing lifecycle rules array:

```typescript
    lifecycleRules: [
      {
        expiration: Duration.days(365),
        abortIncompleteMultipartUploadAfter: Duration.days(7),
      },
      {
        noncurrentVersionExpiration: Duration.days(30),
      },
    ],
```

**Step 3: Verify CDK synth passes**

Run: `cd infrastructure/cdk && npx cdk synth --quiet 2>&1 | tail -5`
Expected: No errors

**Step 4: Commit**

```bash
git add infrastructure/cdk/lib/storage.ts
git commit -m "fix(cdk): enable versioning on user-assets bucket with 30d noncurrent expiry"
```

---

### Task 3: Enable versioning + noncurrent expiry on audit logs bucket

**Files:**
- Modify: `infrastructure/cdk/lib/storage.ts:185-210`

**Step 1: Enable versioning on audit logs bucket**

```typescript
  const auditLogsBucket = new Bucket(scope, 'AuditLogsBucket', {
    bucketName: `remit-scout-audit-logs-${options.envName}`,
    versioned: true,  // Changed from false
    // ... rest unchanged
```

**Step 2: Add noncurrent version expiry lifecycle rule (90 days for compliance)**

Add to the existing lifecycle rules array:

```typescript
    lifecycleRules: [
      {
        transitions: [
          {
            storageClass: StorageClass.GLACIER,
            transitionAfter: Duration.days(90),
          },
          {
            storageClass: StorageClass.DEEP_ARCHIVE,
            transitionAfter: Duration.days(365),
          },
        ],
        abortIncompleteMultipartUploadAfter: Duration.days(7),
      },
      {
        noncurrentVersionExpiration: Duration.days(90),
      },
    ],
```

**Step 3: Verify CDK synth passes**

Run: `cd infrastructure/cdk && npx cdk synth --quiet 2>&1 | tail -5`
Expected: No errors

**Step 4: Commit**

```bash
git add infrastructure/cdk/lib/storage.ts
git commit -m "fix(cdk): enable versioning on audit-logs bucket with 90d noncurrent expiry"
```

---

### Task 4: Add Redis snapshot retention for prod/staging

**Files:**
- Modify: `infrastructure/cdk/lib/cache.ts:52-72`

**Step 1: Add snapshotRetentionLimit to replication group**

Add `snapshotRetentionLimit` and `snapshotWindow` to the `CfnReplicationGroup` properties:

```typescript
  const replicationGroup = new CfnReplicationGroup(
    scope,
    authEnabled ? 'RedisReplicationGroupAuth' : 'RedisReplicationGroup',
    {
    replicationGroupDescription: `Remit-Scout Redis (${options.envName})`,
    cacheNodeType: isProd ? 'cache.t4g.small' : 'cache.t4g.micro',
    engine: 'redis',
    engineVersion: '7.1',
    numNodeGroups: 1,
    replicasPerNodeGroup: isProd ? 1 : undefined,
    automaticFailoverEnabled: isProd,
    multiAzEnabled: isProd,
    atRestEncryptionEnabled: true,
    transitEncryptionEnabled: true,
    cacheSubnetGroupName: subnetGroup.ref,
    securityGroupIds: [options.redisSecurityGroup.securityGroupId],
    autoMinorVersionUpgrade: true,
    snapshotRetentionLimit: isProtectedEnv ? 1 : 0,
    snapshotWindow: isProtectedEnv ? '03:00-04:00' : undefined,
    // Auth token must be enabled for protected environments.
    authToken: authEnabled ? redisAuthToken.toString() : undefined,
  })
```

**Step 2: Verify CDK synth passes**

Run: `cd infrastructure/cdk && npx cdk synth --quiet 2>&1 | tail -5`
Expected: No errors

**Step 3: Commit**

```bash
git add infrastructure/cdk/lib/cache.ts
git commit -m "fix(cdk): add Redis daily snapshot retention for prod/staging"
```

---

### Task 5: Set KMS key pending deletion window

**Files:**
- Modify: `infrastructure/cdk/lib/storage.ts:82-87`

**Step 1: Add pendingWindow to DataEncryptionKey**

```typescript
  const dataEncryptionKey = new Key(scope, 'DataEncryptionKey', {
    alias: `remit-scout-${options.envName}-data`,
    description: `RemitScout ${options.envName} data encryption key (bronze + audit-logs)`,
    enableKeyRotation: true,
    pendingWindow: Duration.days(30),
    removalPolicy: isProtectedEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
```

**Step 2: Verify CDK synth passes**

Run: `cd infrastructure/cdk && npx cdk synth --quiet 2>&1 | tail -5`
Expected: No errors

**Step 3: Commit**

```bash
git add infrastructure/cdk/lib/storage.ts
git commit -m "fix(cdk): set 30-day KMS key pending deletion window"
```

---

### Task 6: Final verification — CDK diff

**Step 1: Run full CDK synth**

Run: `cd infrastructure/cdk && npx cdk synth --quiet`
Expected: Clean synthesis, no errors

**Step 2: Verify all changes are correct**

Run: `cd infrastructure/cdk && npx cdk diff 2>&1 | head -80` (if AWS creds available)
Expected: Shows versioning enabled on 3 buckets, snapshot retention on Redis, pending window on KMS key

**Step 3: Run backend type check to ensure no regressions**

Run: `cd backend && pnpm build`
Expected: Clean build
