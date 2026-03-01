# Infrastructure & Deploy Deep Audit Findings

Audit Date: 2026-02-28T19:42:00Z
Files Examined: 58
Total Findings: 16

## Summary by Severity
- Critical: 2
- High: 5
- Medium: 6
- Low: 3

## Remediation Status (FIX-RS-004+)

| Finding | Status | Evidence |
|---|---|---|
| #1 Committed CDK synth snapshots | fixed | `infrastructure/cdk/.gitignore`, removal of `infrastructure/cdk/cdk.out*`, CI guard `backend/scripts/ci/guard-generated-artifacts.ts` |
| #2 Pipeline `sts:AssumeRole` wildcard | fixed | `infrastructure/cdk/lib/pipeline.ts` |
| #3 OpsPause wildcard IAM scope | fixed | `infrastructure/cdk/lib/iam.ts` |
| #4 Redis AUTH token not applied | fixed | `infrastructure/cdk/lib/cache.ts` |
| #5 Synthetics overly broad IAM scope | fixed | `infrastructure/cdk/lib/synthetics.ts` |
| #6 Synthetics code interpolation injection risk | fixed | `infrastructure/cdk/lib/synthetics.ts` |
| #7 OIDC deploy policy not env-scoped | fixed | `infrastructure/cdk/lib/github-actions-oidc.ts` |
| #8 DB/Redis SG unrestricted egress | fixed | `infrastructure/cdk/lib/vpc.ts` |
| #9 Staging deletion protection determinism | fixed | `infrastructure/cdk/lib/database.ts` |
| #10 ECR tags mutable in staging/prod | fixed | `infrastructure/cdk/lib/registry.ts` |
| #11 Local docker-compose missing auth defaults | fixed | `docker-compose.yml` |
| #12 Privileged build project scope | already_fixed_with_evidence | `infrastructure/cdk/lib/pipeline.ts` (isolated build project for Docker buildx only) |
| #13 Missing prod domain context only warning | fixed | `infrastructure/cdk/lib/context-validator.ts` |
| #14 Blanket `--require-approval never` in prod paths | fixed | `.github/workflows/deploy.yml`, `.github/workflows/rollback.yml`, `.github/workflows/rollback-drill.yml` |
| #15 Prod tag trigger too broad | fixed | `.github/workflows/deploy.yml`, `infrastructure/cdk/lib/github-actions-oidc.ts`, `infrastructure/iam/github-actions-oidc-roles.yml` |
| #16 Staging removal-policy inconsistency | fixed | `infrastructure/cdk/lib/storage.ts`, `infrastructure/cdk/lib/database.ts`, `infrastructure/cdk/lib/cache.ts` |

---

## Findings

### [CRITICAL] Finding #1: CDK synth output snapshots staged for commit -- contain full CloudFormation templates with resource ARNs and account structure

**File:** `infrastructure/cdk/cdk.out.deploy.*/`
**Lines:** N/A (entire directory trees)
**Category:** `security`

**Description:**
Nine separate `cdk.out.deploy.*` directories and one `cdk.out.staging-refactor` directory are staged for commit (status `A` in git). These contain complete CloudFormation template JSON files that expose the full AWS resource topology: account IDs, subnet IDs, security group IDs, secret ARNs, ECS cluster names, Lambda function ARNs, database identifiers, VPC structure, and IAM role ARNs. The `.gitignore` only covers `cdk.out/` and `infrastructure/cdk/cdk.out/`, but these timestamped snapshot directories use different names (`cdk.out.deploy.1772215058`, etc.) and bypass the ignore rules.

**Code:**
```
# From git status (staged files):
A  infrastructure/cdk/cdk.out.deploy.1772215058/remit-scout-staging.template.json
A  infrastructure/cdk/cdk.out.deploy.1772215058/remitscoutstagingFoundation58FDB525.nested.template.json
A  infrastructure/cdk/cdk.out.deploy.1772215058/remitscoutstagingRuntimeB9C8C534.nested.template.json
... (9 snapshot directories, ~80+ files total)
A  infrastructure/cdk/cdk.out.staging-refactor/remit-scout-staging.template.json
A  infrastructure/cdk/cdk.out.staging-refactor/resource-mappings.json
A  infrastructure/cdk/cdk.out.staging-refactor/stack-definitions.json
```

**Why this matters:**
Committing synthesized CloudFormation templates to a repository exposes the entire infrastructure blueprint to anyone with repo access. The templates contain the actual account ID, VPC CIDR blocks, security group IDs, database cluster identifiers, secret ARNs, and IAM role ARNs. An attacker with read access to the repo gets a complete roadmap of the staging environment. The `.gitignore` must be updated to cover `cdk.out.*` glob patterns and these directories must be removed from the staging area before merging.

---

### [CRITICAL] Finding #2: Pipeline deploy project granted `sts:AssumeRole` on all resources (`*`)

**File:** `infrastructure/cdk/lib/pipeline.ts`
**Lines:** 313-318
**Category:** `security`

**Description:**
The CodeBuild deploy project is granted `sts:AssumeRole` with `resources: ['*']`, meaning it can assume ANY IAM role in the account (and cross-account if trust policies exist). This is the most dangerous IAM over-permission possible -- it effectively makes the deploy project an account-level admin.

**Code:**
```ts
    deployProject.addToRolePolicy(
      new PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: ['*'],
      }),
    )
```

**Why this matters:**
If the CodeBuild deploy job is compromised (supply chain attack, dependency hijack, malicious PR merge), the attacker can assume any role in the AWS account including admin roles, cross-account roles, and CDK bootstrap roles. This should be scoped to the specific CDK execution roles (`arn:aws:iam::*:role/cdk-hnb659fds-*`).

---

### [HIGH] Finding #3: OpsPause Lambda role has wildcard resource permissions for ECS tasks, EventBridge rules, RDS, and ElastiCache

**File:** `infrastructure/cdk/lib/iam.ts`
**Lines:** 188-212
**Category:** `security`

**Description:**
The `opsPauseLambdaRole` has multiple IAM policy statements with `resources: ['*']` for high-impact actions including `ecs:StopTask`, `events:DisableRule`, `events:EnableRule`, `rds:StopDBCluster`, `rds:StartDBCluster`, `elasticache:DeleteReplicationGroup`, and `elasticache:CreateReplicationGroup`. While the ECS service and SSM permissions are properly scoped to the environment, the task-level, EventBridge, RDS, and ElastiCache permissions are global.

**Code:**
```ts
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: ['ecs:ListTasks', 'ecs:DescribeTasks', 'ecs:StopTask'],
    resources: ['*'],
  }))
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: ['events:DisableRule', 'events:EnableRule', 'events:ListRules'],
    resources: ['*'],
  }))
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: ['rds:StartDBCluster', 'rds:StopDBCluster', 'rds:DescribeDBClusters'],
    resources: ['*'],
  }))
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: [
      'elasticache:CreateReplicationGroup',
      'elasticache:DeleteReplicationGroup',
      'elasticache:DescribeReplicationGroups',
      'elasticache:DescribeCacheSubnetGroups',
    ],
    resources: ['*'],
  }))
```

**Why this matters:**
If the ops-pause Lambda is invoked with malicious parameters or its code is tampered with, it could stop any ECS task in the account (not just remit-scout tasks), disable any EventBridge rule, stop any RDS cluster, or delete any ElastiCache replication group. In a multi-tenant or multi-service account, this is a blast-radius amplifier. These should be scoped using resource-level ARN patterns with the `remit-scout-{envName}` naming convention.

---

### [HIGH] Finding #4: Redis AUTH token is generated but never applied to the replication group

**File:** `infrastructure/cdk/lib/cache.ts`
**Lines:** 27-64
**Category:** `security`

**Description:**
A Redis AUTH secret is generated and stored in Secrets Manager, but the `AuthToken` property is explicitly NOT set on the `CfnReplicationGroup`. The code comment explains that CloudFormation treats `AuthToken` as immutable and causes `UPDATE_ROLLBACK_FAILED`, but the net effect is that the Redis cluster is running without authentication. Any workload in the VPC with network access to the Redis security group can read/write all cached data without credentials.

**Code:**
```ts
  const redisAuthSecret = new Secret(scope, 'RedisAuthSecret', {
    secretName: `remit-scout/${options.envName}/redis-auth`,
    generateSecretString: {
      passwordLength: 48,
      excludePunctuation: true,
      includeSpace: false,
    },
  })

  const replicationGroup = new CfnReplicationGroup(scope, 'RedisReplicationGroup', {
    // ...
    transitEncryptionEnabled: true,
    // Do not set AuthToken in-place on existing replication groups.
    // CloudFormation treats this path as immutable for our existing stacks and enters
    // UPDATE_ROLLBACK_FAILED. Auth enablement must be handled as an explicit replacement migration.
  })
```

**Why this matters:**
Without AUTH, any service or compromised container that can reach the Redis endpoint on port 6379 can read all cached quote data, session state, or any other cached information. Transit encryption (TLS) protects against network sniffing but does not prevent unauthorized connections from within the VPC. This is a defense-in-depth gap that should be resolved through a planned replacement migration.

---

### [HIGH] Finding #5: Synthetics canary role has overly broad IAM permissions including `s3:ListAllMyBuckets` on `*`

**File:** `infrastructure/cdk/lib/synthetics.ts`
**Lines:** 151-164
**Category:** `security`

**Description:**
The Synthetics execution role is granted `s3:ListAllMyBuckets` and `s3:GetBucketLocation` on `resources: ['*']`, along with `xray:PutTraceSegments`, `logs:CreateLogGroup`, `logs:CreateLogStream`, and `logs:PutLogEvents` on `resources: ['*']`. While some of these are required to be `*` by AWS API design, `s3:ListAllMyBuckets` is unnecessary for synthetics canaries and exposes the full bucket inventory of the account.

**Code:**
```ts
  syntheticsRole.addToPolicy(
    new PolicyStatement({
      actions: [
        's3:PutObject',
        's3:GetBucketLocation',
        's3:ListAllMyBuckets',
        'xray:PutTraceSegments',
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }),
  )
```

**Why this matters:**
`s3:ListAllMyBuckets` allows the canary to enumerate every S3 bucket in the account. If a canary is compromised (e.g., through a code injection in the inline script that uses string interpolation for URLs), the attacker gains visibility into all bucket names, which can be used for further reconnaissance. This permission should be removed or scoped to the synthetics artifacts bucket only.

---

### [HIGH] Finding #6: Synthetics canary code uses string interpolation for URL/test name -- potential code injection vector

**File:** `infrastructure/cdk/lib/synthetics.ts`
**Lines:** 26-63, 65-129
**Category:** `security`

**Description:**
The `createCanaryCode` and `createIndicesCanaryCode` functions use JavaScript template literals to inject `url` and `testName` values directly into inline JavaScript code strings. If the `planeABaseUrl` context value contains characters like `'; malicious_code(); '`, it would result in code injection in the synthesized canary Lambda.

**Code:**
```ts
const createCanaryCode = (testName: string, url: string): string => {
  return `
const synthetics = require('Synthetics');
// ...
const apiCanaryBlueprint = async function () {
  const targetUrl = '${url}';
  // ...
  await synthetics.executeHttpStep('${testName}', requestOptions, stepConfig);
};
// ...
`.trim()
}
```

**Why this matters:**
The `url` parameter is derived from `planeABaseUrl` which comes from CDK context. While CDK context is typically controlled by operators, if the value ever contains single quotes or backticks (through misconfiguration or a CI variable injection), it would break the canary code or, worse, execute arbitrary code in the canary Lambda runtime. The values should be escaped or passed as environment variables instead of interpolated into code strings.

---

### [HIGH] Finding #7: GitHub Actions OIDC roles share the same broad inline policy across dev, staging, and prod

**File:** `infrastructure/cdk/lib/github-actions-oidc.ts`
**Lines:** 49-189
**Category:** `security`

**Description:**
All three OIDC roles (dev, staging, prod) share the exact same `PolicyDocument` with identical permissions including `cloudformation:CreateStack`, `cloudformation:UpdateStack`, `ecr:BatchDeleteImage`, `iam:PassRole` on `arn:aws:iam::*:role/cdk-hnb659fds-*`, and `ecs:StopTask`. The prod role (gated by `refs/tags/v*`) has the same overpowered permissions as the dev role. There is no environment-scoped resource narrowing.

**Code:**
```ts
  // Three roles, one per promotion stage.
  new Role(scope, 'GithubActionsDeployDevRole', {
    roleName: 'remit-scout-gha-deploy-dev',
    assumedBy: makePrincipal('refs/heads/develop'),
    inlinePolicies: { DeployPermissions: policy },  // same `policy` for all three
  })
  new Role(scope, 'GithubActionsDeployStagingRole', {
    roleName: 'remit-scout-gha-deploy-staging',
    assumedBy: makePrincipal('refs/heads/main'),
    inlinePolicies: { DeployPermissions: policy },
  })
  new Role(scope, 'GithubActionsDeployProdRole', {
    roleName: 'remit-scout-gha-deploy-prod',
    assumedBy: makePrincipal('refs/tags/v*'),
    inlinePolicies: { DeployPermissions: policy },
  })
```

**Why this matters:**
The principle of least privilege requires that each environment's deploy role should only have permissions scoped to that environment's resources. Currently, anyone who pushes a `v*` tag (or a branch merge to `develop`) gets the same permissions that could affect prod resources. The `ecs:StopTask` permission on `arn:aws:ecs:*:*:task/*` means any environment's CI role can stop any ECS task in the account. Each role should have environment-specific resource ARN patterns.

---

### [MEDIUM] Finding #8: Database and Redis security groups allow unrestricted egress (`allowAllOutbound: true`)

**File:** `infrastructure/cdk/lib/vpc.ts`
**Lines:** 151-160
**Category:** `misconfiguration`

**Description:**
Both the `DatabaseSecurityGroup` and `RedisSecurityGroup` have `allowAllOutbound: true`. Database and cache clusters should not need to initiate outbound connections to arbitrary destinations. This is a defense-in-depth gap.

**Code:**
```ts
  const dbSecurityGroup = new SecurityGroup(scope, 'DatabaseSecurityGroup', {
    vpc,
    description: 'Database security group (Aurora/RDS).',
    allowAllOutbound: true,
  })
  const redisSecurityGroup = new SecurityGroup(scope, 'RedisSecurityGroup', {
    vpc,
    description: 'Redis security group (ElastiCache).',
    allowAllOutbound: true,
  })
```

**Why this matters:**
If an attacker gains access to the database or cache instance (e.g., through SQL injection or Redis command injection), unrestricted egress allows data exfiltration to any external destination. Database and cache security groups should have egress limited to VPC-internal traffic only (or specific AWS service endpoints), since these resources should never need to reach the internet.

---

### [MEDIUM] Finding #9: Staging database lacks deletion protection -- only `isProd || isStaging` guards it but `isStaging` may not be set for all paths

**File:** `infrastructure/cdk/lib/database.ts`
**Lines:** 87-94
**Category:** `deploy-risk`

**Description:**
While the code sets `deletionProtection: isProd || isStaging`, the `removalPolicy` for the database cluster, encryption key, and credentials secret is `isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY`. This means in staging, `deletionProtection` is true (good) but `removalPolicy` is `DESTROY`. If the CDK stack is deleted (e.g., during a stack replacement or manual cleanup), CloudFormation will attempt to delete the Aurora cluster. The `deletionProtection` flag should prevent this at the RDS API level, but the intent mismatch between `removalPolicy: DESTROY` and `deletionProtection: true` for staging is confusing and creates risk of data loss during stack operations.

**Code:**
```ts
    deletionProtection: isProd || isStaging,
    // ...
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
```

**Why this matters:**
In staging, if a stack update triggers resource replacement (e.g., renaming the cluster), CloudFormation will try to delete the old resource. With `removalPolicy: DESTROY`, CDK will not add `DeletionPolicy: Retain` to the CloudFormation template, meaning CloudFormation will attempt to delete the cluster. The RDS-level `deletionProtection` will cause the delete to fail, which will cause the CloudFormation update to fail. The staging database should use `RemovalPolicy.RETAIN` to match its `deletionProtection: true` setting.

---

### [MEDIUM] Finding #10: ECR image tag mutability is not enforced for staging

**File:** `infrastructure/cdk/lib/registry.ts`
**Lines:** 26-28
**Category:** `deploy-risk`

**Description:**
The ECR repository only enforces `TagMutability.IMMUTABLE` for production. Staging uses the default (mutable tags), meaning a staging image tag could be overwritten with different content after deployment. While the stack enforces `backendImageTag !== 'latest'` for non-dev environments, mutable tags in staging mean the same tag (e.g., a semver tag or commit SHA) could point to different images over time.

**Code:**
```ts
  const backendRepository = importExisting
    ? Repository.fromRepositoryName(scope, 'BackendRepositoryImported', repositoryName)
    : new Repository(scope, 'BackendRepository', {
        repositoryName,
        imageScanOnPush: true,
        imageTagMutability: isProd ? TagMutability.IMMUTABLE : undefined,
        // ...
      })
```

**Why this matters:**
Mutable tags in staging mean that if someone re-pushes an image with the same tag, a rollback to that tag will deploy different code than what was originally tested. This breaks the immutable deployment invariant that the deploy checklist requires ("Promote by immutable commit SHA"). Staging should also use `TagMutability.IMMUTABLE`.

---

### [MEDIUM] Finding #11: Docker Compose development environment has no authentication on PostgreSQL and Redis

**File:** `docker-compose.yml`
**Lines:** 1-34
**Category:** `misconfiguration`

**Description:**
The development docker-compose uses `postgres:15-alpine` with hardcoded credentials (`POSTGRES_USER: remit`, `POSTGRES_PASSWORD: remit`) and `redis:7-alpine` with no authentication at all. Both services bind to `0.0.0.0` (all interfaces) on their default ports. On a developer machine connected to a shared network, these services are accessible to anyone on the same network.

**Code:**
```yaml
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: remit
      POSTGRES_PASSWORD: remit
      POSTGRES_DB: remit
    ports:
      - "5432:5432"
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

**Why this matters:**
Developers on shared networks (co-working spaces, coffee shops, hotel wifi) expose their local database and cache to network-adjacent attackers. The ports should be bound to `127.0.0.1` only (e.g., `"127.0.0.1:5432:5432"`) and Redis should be configured with a password.

---

### [MEDIUM] Finding #12: CodeBuild build project runs with `privileged: true` mode

**File:** `infrastructure/cdk/lib/pipeline.ts`
**Lines:** 133-137
**Category:** `security`

**Description:**
The CodeBuild build project runs with `privileged: true`, which grants the build container access to the Docker daemon and elevated capabilities. While this is needed for Docker-in-Docker builds, it significantly expands the attack surface of the build environment.

**Code:**
```ts
  const buildProject = new PipelineProject(scope, 'RemitScoutBuildProject', {
    environment: {
      buildImage: LinuxBuildImage.STANDARD_7_0,
      privileged: true,
    },
```

**Why this matters:**
A privileged CodeBuild container can access the host's kernel, mount filesystems, and potentially escape the container sandbox. If a supply-chain attack injects malicious code into a dependency, the privileged build environment provides a larger attack surface. Consider using a separate, non-privileged CodeBuild project for the build steps and only using privileged mode for the Docker image build step.

---

### [MEDIUM] Finding #13: Context validation only warns (not errors) for missing production domain configuration

**File:** `infrastructure/cdk/lib/context-validator.ts`
**Lines:** 128-143
**Category:** `missing-guard`

**Description:**
When deploying to production, the context validator only emits warnings (not errors) for missing `planeADomainName`, `planeACertificateArn`, `planeAHostedZoneId`, and `planeAHostedZoneName`. These are critical for a production deployment to have a custom domain with TLS. A production deploy without these would result in a CloudFront-only deployment with an auto-generated `*.cloudfront.net` domain and no custom DNS.

**Code:**
```ts
  if (envName === 'prod') {
    const prodRequired = [
      'planeADomainName',
      'planeACertificateArn',
      'planeAHostedZoneId',
      'planeAHostedZoneName',
    ]

    for (const key of prodRequired) {
      const value = construct.node.tryGetContext(key)
      if (value === undefined) {
        warnings.push(
          `Production environment should have '${key}' set for custom domain support`,
        )
      }
    }
  }
```

**Why this matters:**
A production deployment without a custom domain means users would access the API through a raw CloudFront URL, which provides no brand identity, cannot be covered by the organization's TLS certificates, and is harder to maintain for DNS failover. These should be errors, not warnings, to prevent accidental production deployments without proper domain configuration.

---

### [LOW] Finding #14: Deploy script uses `--require-approval never` for all automated deploys including production tag pushes

**File:** `.github/workflows/deploy.yml`
**Lines:** 385, 999, 1940
**Category:** `deploy-risk`

**Description:**
All CDK deploy commands in the CI/CD workflow use `--require-approval never`, including the production deployment path triggered by tag pushes. While the workflow has a GitHub Environment protection rule requirement for `prod`, the CDK-level approval is completely bypassed. This means IAM changes, security group modifications, and other security-sensitive CloudFormation changes are auto-approved.

**Code:**
```yaml
          pnpm -C infrastructure/cdk exec -- cdk deploy \
            -c env="${ENV_NAME}" \
            -c backendImageTag="${IMAGE_TAG}" \
            --require-approval never
```

**Why this matters:**
CDK's `--require-approval` flag is a defense-in-depth mechanism that pauses deployments when IAM or security group changes are detected. By always using `never`, all infrastructure changes (including broadening IAM permissions, opening security groups, or removing encryption) are applied without human review of the CloudFormation diff. The GitHub Environment approval is a coarser gate that does not inspect the specific infrastructure changes. For production, consider using `broadening` to catch IAM escalation.

---

### [LOW] Finding #15: Prod deploy path via `v*` tag pattern could be triggered by non-release tags

**File:** `.github/workflows/deploy.yml`
**Lines:** 8-9; `infrastructure/cdk/lib/github-actions-oidc.ts` Line 186
**Category:** `deploy-risk`

**Description:**
The deploy workflow triggers on `push.tags: 'v*.*.*'` (workflow level) and the OIDC role allows `refs/tags/v*` (IAM level). The workflow trigger is scoped to `v*.*.*` (three-part semver), but the IAM trust policy allows any tag starting with `v` (e.g., `v-test`, `v-delete-all`, `very-bad`). This mismatch means the prod IAM role could be assumed by workflows triggered from non-release tags.

**Code:**
```yaml
# deploy.yml
  push:
    tags:
      - 'v*.*.*'
```
```ts
// github-actions-oidc.ts
  new Role(scope, 'GithubActionsDeployProdRole', {
    assumedBy: makePrincipal('refs/tags/v*'),
  })
```

**Why this matters:**
A developer who pushes a tag like `v-experimental` or `v1` (without the three-part semver) could trigger a workflow run that assumes the prod deploy role, even though the deploy workflow itself would not trigger. However, other workflows that use the same OIDC role could execute with prod permissions. The IAM trust policy should match the workflow trigger pattern: `refs/tags/v[0-9]*.[0-9]*.[0-9]*`.

---

### [LOW] Finding #16: Staging removal policy inconsistency -- some staging resources use DESTROY while database uses deletion protection

**File:** `infrastructure/cdk/lib/storage.ts`, `infrastructure/cdk/lib/database.ts`, `infrastructure/cdk/lib/cache.ts`
**Lines:** Multiple (see description)
**Category:** `misconfiguration`

**Description:**
There is an inconsistent removal policy pattern across staging resources. The database cluster has `deletionProtection: true` for staging but `removalPolicy: DESTROY`. S3 buckets (bronze, exports, user-assets, audit-logs) all use `removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY` which means staging buckets with potentially valuable data will be destroyed on stack deletion. The KMS encryption keys also use `DESTROY` for staging. For a staging environment that is expected to hold production-like data for validation, this is risky.

**Code:**
```ts
// storage.ts - staging buckets will be destroyed
removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,

// database.ts - staging DB has deletion protection but DESTROY removal
deletionProtection: isProd || isStaging,
removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,

// cache.ts - staging cache has no deletion protection or retention
```

**Why this matters:**
If a CDK stack replacement is triggered in staging (e.g., during a nested stack migration or major refactor), all S3 data including bronze ingestion data, export archives, and audit logs would be permanently deleted. The KMS keys would also be destroyed, making any data encrypted with them irrecoverable. Staging environments that hold validation data should consider using `RemovalPolicy.RETAIN` for critical data stores, or at minimum `RemovalPolicy.SNAPSHOT` for the database.

---
