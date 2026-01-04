# Remit-Scout AWS CDK Infrastructure

This directory contains the AWS CDK infrastructure code for the Remit-Scout application. It defines all AWS resources including VPC, databases, compute, APIs, frontend, and CI/CD pipelines.

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Node.js** 20+ and **pnpm** installed
3. **AWS CDK CLI** installed: `npm install -g aws-cdk`
4. **CDK Bootstrap** completed for your account/region:
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

## Quick Start

```bash
# Install dependencies
pnpm install

# Set AWS account and region
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1

# Synthesize CloudFormation template
./scripts/synth.sh dev

# Deploy to dev environment
./scripts/deploy.sh dev latest
```

## Environment Setup

### Required Environment Variables

```bash
export CDK_DEFAULT_ACCOUNT=123456789012  # Your AWS account ID
export CDK_DEFAULT_REGION=us-east-1      # Your AWS region
```

### Context Variables

Context variables can be set via:
1. **Command line**: `-c key=value`
2. **cdk.json**: Add to `context` object
3. **Environment variables**: Some variables fall back to env vars

## Context Variables Reference

### Required Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `env` | string | Environment name (dev, staging, prod) | `dev` |

### Core Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `backendImageTag` | string | `latest` | ECR image tag for backend Docker image |
| `stackVersion` | string | `1.0.0` | Stack version for tracking deployments |

### Database Configuration

#### Plane A Database

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `planeADbSecretArn` | string | Auto-generated | ARN of Secrets Manager secret for Plane A DB |
| `planeADbSecretJsonKey` | string | - | JSON key in secret (e.g., `DATABASE_URL_PLANE_A`) |
| `planeADbSsmName` | string | - | SSM Parameter Store path (e.g., `/remit-scout/dev/plane-a-db-url`) |

#### Plane B Database

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `planeBDbSecretArn` | string | Auto-generated | ARN of Secrets Manager secret for Plane B DB |
| `planeBDbSsmName` | string | - | SSM Parameter Store path (e.g., `/remit-scout/dev/plane-b-db-url`) |

#### Plane C Database

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `planeCDbSecretArn` | string | Auto-generated | ARN of Secrets Manager secret for Plane C DB |
| `planeCDbSecretJsonKey` | string | - | JSON key in secret (e.g., `DATABASE_URL_PLANE_C`) |
| `planeCDbSsmName` | string | - | SSM Parameter Store path (e.g., `/remit-scout/dev/plane-c-db-url`) |

**Note**: If secret ARNs are not provided, the stack uses `remit-scout/{env}/database/master` and builds `DATABASE_URL` at runtime.

### Redis Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `redisSecretArn` | string | - | ARN of Secrets Manager secret for Redis |
| `redisSecretJsonKey` | string | - | JSON key in secret (e.g., `REDIS_URL`) |
| `redisSsmName` | string | - | SSM Parameter Store path (e.g., `/remit-scout/dev/redis-url`) |

### Proxy Configuration

#### Residential Proxy

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `proxyResidentialSecretArn` | string | - | ARN of Secrets Manager secret for residential proxy |
| `proxyResidentialSecretJsonKey` | string | - | JSON key in secret |
| `proxyResidentialSsmName` | string | - | SSM Parameter Store path |
| `proxyResidentialUrl` | string | - | Residential proxy URL |

#### Datacenter Proxy

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `proxyDatacenterSecretArn` | string | - | ARN of Secrets Manager secret for datacenter proxy |
| `proxyDatacenterSecretJsonKey` | string | - | JSON key in secret |
| `proxyDatacenterSsmName` | string | - | SSM Parameter Store path |
| `proxyDatacenterUrl` | string | - | Datacenter proxy URL |

### Queue Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `planeBIngestFanoutMode` | string | `off` (dev), `queue` (prod) | Ingest fanout queue mode: `off`, `queue`, `shadow` |
| `planeBNotificationsMode` | string | `off` (dev), `queue` (prod) | Notifications queue mode: `off`, `queue`, `shadow` |
| `planeBOpsAlertsMode` | string | `off` (dev), `queue` (prod) | Ops alerts queue mode: `off`, `queue`, `shadow` |
| `planeBB2cQueueInSweep` | boolean | - | Enable B2C queue in sweep |

### Storage Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `bronzePrefix` | string | `bronze` | S3 prefix for bronze storage |

### API Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `planeCBaseUrl` | string | - | Base URL for Plane C API |

### CloudFront & WAF Configuration

| Variable | Type | Description |
|----------|------|-------------|
| `enableCloudFront` | boolean | Enable CloudFront distribution for Plane A API |
| `enableWaf` | boolean | Enable WAF for Plane A API |
| `wafAllowListIps` | string[] | List of IP addresses to allow in WAF |
| `wafBlockListIps` | string[] | List of IP addresses to block in WAF |
| `wafEnableBotControl` | boolean | Enable AWS WAF bot control |

### Authentication Configuration

#### Plane A JWT Auth

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `enablePlaneAJwtAuth` | boolean | Enable JWT authentication for Plane A |
| `planeAJwtIssuer` | string | JWT issuer URL | `https://xxx.supabase.co/auth/v1` |
| `planeAJwtAudiences` | string[] | JWT audience values | `["authenticated", "https://remit-scout.com"]` |

#### Plane C IAM Auth

| Variable | Type | Description |
|----------|------|-------------|
| `enablePlaneCIamAuth` | boolean | Enable IAM authentication for Plane C |
| `disablePlaneCExecuteEndpoint` | boolean | Disable execute endpoint for Plane C |

### Throttling Configuration

| Variable | Type | Description |
|----------|------|-------------|
| `planeAThrottleRate` | number | Throttle rate for Plane A API (requests per second) |
| `planeAThrottleBurst` | number | Throttle burst for Plane A API |
| `planeCThrottleRate` | number | Throttle rate for Plane C API (requests per second) |
| `planeCThrottleBurst` | number | Throttle burst for Plane C API |

### Observability Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `otelLambdaLayerArn` | string | ARN of OpenTelemetry Lambda layer | `arn:aws:lambda:region:account:layer:otel:1` |

### CI/CD Pipeline Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `pipelineConnectionArn` | string | ARN of CodeStar Connections connection | `arn:aws:codestar-connections:region:account:connection/xxx` |
| `pipelineRepoOwner` | string | GitHub repository owner | `remit-scout` |
| `pipelineRepoName` | string | GitHub repository name | `remit-scout` |
| `pipelineRepoBranch` | string | `main` | GitHub repository branch |
| `pipelineEnableDeploy` | boolean | Enable deployment stage in pipeline |

### Custom Domain Configuration

#### Plane A API Domain

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `planeADomainName` | string | Custom domain name for Plane A API | `api.remit-scout.com` |
| `planeACertificateArn` | string | ACM certificate ARN | `arn:aws:acm:region:account:certificate/xxx` |
| `planeAHostedZoneId` | string | Route53 hosted zone ID | `Z1234567890ABC` |
| `planeAHostedZoneName` | string | Route53 hosted zone name | `remit-scout.com` |

#### Frontend Domain

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `frontendDomainName` | string | Custom domain name for frontend | `remit-scout.com` |
| `frontendCertificateArn` | string | ACM certificate ARN | `arn:aws:acm:region:account:certificate/xxx` |
| `frontendHostedZoneId` | string | Route53 hosted zone ID | `Z1234567890ABC` |
| `frontendHostedZoneName` | string | Route53 hosted zone name | `remit-scout.com` |

**Note**: Custom domain configuration is optional but recommended for production.

### Alerting Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `slackWebhookUrl` | string | Slack webhook URL for alert notifications | `https://hooks.slack.com/services/...` |
| `pagerDutyIntegrationKey` | string | PagerDuty integration key for critical alerts | `xxx` |

**Note**: Alerting configuration is optional. If not provided, alarms will still be created but won't send notifications.

## Usage Examples

### Development Environment

```bash
# Synthesize
pnpm cdk synth -c env=dev

# Deploy
pnpm cdk deploy -c env=dev -c backendImageTag=latest
```

### Staging Environment

```bash
# With custom domain
pnpm cdk deploy \
  -c env=staging \
  -c backendImageTag=v1.2.3 \
  -c planeADomainName=api-staging.remit-scout.com \
  -c planeACertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/xxx \
  -c planeAHostedZoneId=Z1234567890ABC \
  -c planeAHostedZoneName=remit-scout.com
```

### Production Environment

```bash
# Full production deployment with all features
pnpm cdk deploy \
  -c env=prod \
  -c backendImageTag=v1.2.3 \
  -c enableCloudFront=true \
  -c enableWaf=true \
  -c enablePlaneAJwtAuth=true \
  -c planeAJwtIssuer=https://xxx.supabase.co/auth/v1 \
  -c planeADomainName=api.remit-scout.com \
  -c planeACertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/xxx \
  -c planeAHostedZoneId=Z1234567890ABC \
  -c planeAHostedZoneName=remit-scout.com \
  -c frontendDomainName=remit-scout.com \
  -c frontendCertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/yyy \
  -c frontendHostedZoneId=Z1234567890ABC \
  -c frontendHostedZoneName=remit-scout.com \
  -c slackWebhookUrl=https://hooks.slack.com/services/... \
  -c pagerDutyIntegrationKey=xxx \
  --require-approval never
```

## Deployment Scripts

### Synthesis Script

```bash
./scripts/synth.sh [env] [backendImageTag]
```

Example:
```bash
./scripts/synth.sh dev latest
```

### Deployment Script

```bash
./scripts/deploy.sh [env] [backendImageTag] [approval]
```

Example:
```bash
./scripts/deploy.sh dev latest never
```

The deployment script:
- Validates AWS account and region are set
- Validates context variables
- Prompts for confirmation in production
- Deploys the stack

## Context Validation

The CDK app validates context variables against `cdk.context.schema.json`. Validation errors will prevent deployment.

### Validation Rules

1. **Required variables** must be present
2. **Type checking**: Variables must match their schema types
3. **Enum validation**: Variables with enum values must be one of the allowed values
4. **Production warnings**: Production environment should have custom domain configuration

### Viewing Validation Errors

```bash
pnpm cdk synth -c env=dev
```

Validation errors are displayed before synthesis.

## File Structure

```
cdk/
├── bin/
│   └── app.ts              # CDK app entry point
├── lib/
│   ├── remit-scout-stack.ts    # Main stack
│   ├── context-validator.ts    # Context validation
│   ├── api.ts                  # API Gateway resources
│   ├── frontend.ts             # Frontend resources
│   ├── database.ts             # Database resources
│   ├── cache.ts                # Redis resources
│   ├── compute.ts              # ECS resources
│   ├── storage.ts              # S3 resources
│   ├── queues.ts               # SQS resources
│   └── ...                     # Other resources
├── scripts/
│   ├── synth.sh                # Synthesis script
│   └── deploy.sh               # Deployment script
├── cdk.json                    # CDK configuration
├── cdk.context.json            # CDK context cache (committed)
├── cdk.context.schema.json    # Context variable schema
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Common Tasks

### View Stack Diff

```bash
pnpm cdk diff -c env=dev
```

### Destroy Stack

```bash
pnpm cdk destroy -c env=dev
```

### List Stacks

```bash
pnpm cdk list -c env=dev
```

### Watch Mode

```bash
pnpm cdk watch -c env=dev
```

## Troubleshooting

### Context Validation Errors

If you see context validation errors:
1. Check `cdk.context.schema.json` for allowed values
2. Verify variable types match the schema
3. Ensure required variables are set

### Missing Account/Region

If you see "CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION must be set":
```bash
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=$(aws configure get region)
```

### Bootstrap Issues

If you see bootstrap errors:
```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

## Best Practices

1. **Always validate before deploying**: Use `synth.sh` to validate context
2. **Use version tags**: Set `backendImageTag` to specific versions, not `latest`
3. **Custom domains for production**: Always configure custom domains for prod
4. **Review diffs**: Use `cdk diff` before deploying
5. **Use deployment scripts**: Use provided scripts for consistent deployments
6. **Keep context.json**: Commit `cdk.context.json` for reproducible builds

## Security Notes

- Never commit secrets or credentials
- Use Secrets Manager or SSM Parameter Store for sensitive values
- Review IAM permissions before deploying
- Enable WAF for production APIs
- Use HTTPS-only (enforced by CloudFront)

## Support

For issues or questions:
1. Check the validation errors in synthesis output
2. Review the context schema: `cdk.context.schema.json`
3. Check AWS CDK documentation
4. Review stack-specific documentation in `lib/` directory
