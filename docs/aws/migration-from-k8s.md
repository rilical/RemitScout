# Migration from Kubernetes to AWS

This document explains the deprecation of Kubernetes infrastructure and the migration to AWS-native services.

## Overview

Remit-Scout has migrated from Kubernetes (K8s) to AWS-native infrastructure. All workloads now run on:
- **ECS Fargate** for long-running services
- **Lambda** for serverless functions and scheduled jobs
- **EventBridge** for cron scheduling
- **CloudWatch** for monitoring and alerting

## Migration Status

✅ **Complete**: All services and scheduled jobs have been migrated to AWS.

## What Changed

### Scheduled Jobs

| K8s CronJob | AWS Equivalent | Schedule | Location |
|------------|----------------|----------|----------|
| `b2c-refresh-worker` | ECS Fargate Task + EventBridge | Every 2 minutes | `infrastructure/cdk/lib/scheduled-jobs.ts` |
| `b2c-retry-failed` | Lambda + EventBridge | Every 15 minutes | `infrastructure/cdk/lib/scheduled-jobs.ts` |
| `stoplist-auto-resume` | Lambda + EventBridge | Daily at 02:00 UTC | `infrastructure/cdk/lib/scheduled-jobs.ts` |
| `gold-*` jobs | Lambda + EventBridge | Various | `infrastructure/cdk/lib/scheduled-jobs.ts` |

### Services

| K8s Deployment | AWS Equivalent | Location |
|---------------|----------------|----------|
| Plane B Ingestion | ECS Fargate Service | `infrastructure/cdk/lib/ecs-services.ts` |
| Queue Workers | ECS Fargate Services | `infrastructure/cdk/lib/ecs-services.ts` |
| Plane A API | Lambda + API Gateway | `infrastructure/cdk/lib/api.ts` |
| Plane C API | Lambda + API Gateway | `infrastructure/cdk/lib/api.ts` |

### Monitoring

| K8s/Prometheus | AWS Equivalent | Location |
|----------------|----------------|----------|
| Prometheus Metrics | CloudWatch Custom Metrics | `backend/shared/cloudwatch-metrics.ts` |
| Grafana Dashboards | CloudWatch Dashboards | `infrastructure/cdk/lib/monitoring.ts` |
| Alertmanager Rules | CloudWatch Alarms | `infrastructure/cdk/lib/monitoring.ts` |
| Prometheus Queries | CloudWatch Metrics Queries | `backend/docs/monitoring/cloudwatch-queries.md` |

### Configuration

| K8s | AWS Equivalent | Location |
|-----|----------------|----------|
| Secrets | Secrets Manager | `infrastructure/cdk/lib/*.ts` |
| ConfigMaps | SSM Parameter Store | `infrastructure/cdk/lib/*.ts` |
| Service Accounts | IAM Roles | `infrastructure/cdk/lib/iam.ts` |

## Schedule Reconciliation

### b2c-refresh-worker

- **K8s**: Every 2 minutes (`*/2 * * * *`)
- **AWS**: Every 2 minutes (`Schedule.rate(Duration.minutes(2))`)
- **Status**: ✅ Matches

### stoplist-auto-resume

- **K8s**: Daily at 02:00 UTC (`0 2 * * *`)
- **AWS**: Daily at 02:00 UTC (`Schedule.cron({ minute: '0', hour: '2' })`)
- **Status**: ✅ Matches

### b2c-retry-failed

- **K8s**: Every 15 minutes (`*/15 * * * *`)
- **AWS**: Every 15 minutes (`Schedule.rate(Duration.minutes(15))`)
- **Status**: ✅ Matches

## Deprecated Files

The following K8s files are deprecated and should not be used:

- `backend/k8s/b2c-refresh-worker-cronjob.yaml`
- `backend/k8s/stoplist-auto-resume-cronjob.yaml`
- `k8s/alertmanager-config.yaml`
- `k8s/prometheus-alert-rules.yaml`
- `k8s/grafana-dashboards-configmap.yaml`

See `backend/k8s/DEPRECATED.md` for details.

## Monitoring Migration

### Prometheus → CloudWatch

All Prometheus metrics have been migrated to CloudWatch custom metrics:

- **Namespace**: `RemitScout`
- **Metric Names**: Same as Prometheus (snake_case)
- **Dimensions**: Same as Prometheus labels

### Grafana → CloudWatch Dashboards

CloudWatch Dashboards are automatically created by CDK:
- **Dashboard Name**: `remit-scout-{env}`
- **Location**: CloudWatch → Dashboards
- **Definition**: `infrastructure/cdk/lib/monitoring.ts`

### Alertmanager → CloudWatch Alarms

All Prometheus alerts have been converted to CloudWatch Alarms:
- **SNS Topic**: `remit-scout-{env}-cloudwatch-alerts`
- **Alarms**: Defined in `infrastructure/cdk/lib/monitoring.ts`

## Accessing CloudWatch Metrics

### Via AWS Console

1. Navigate to **CloudWatch** → **Metrics** → **All metrics**
2. Select namespace: **RemitScout**
3. Filter by metric name or dimensions

### Via AWS CLI

```bash
aws cloudwatch list-metrics --namespace RemitScout
aws cloudwatch get-metric-statistics \
  --namespace RemitScout \
  --metric-name data_freshness_age_minutes \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average,Maximum
```

### Documentation

- **CloudWatch Queries**: `backend/docs/monitoring/cloudwatch-queries.md`
- **CloudWatch Dashboards**: `backend/docs/monitoring/grafana-dashboards.md` (updated)
- **Prometheus Queries** (legacy): `backend/docs/monitoring/prometheus-queries.md` (deprecated)

## Database Migrations

Database migrations now run in AWS:

- **CodeBuild**: Pre-deployment step
- **ECS Task**: One-off task execution
- **Lambda**: For lightweight migrations

See `docs/aws/database-migrations.md` for details.

## Dockerfile

The Dockerfile uses Node.js 18, matching Lambda runtime `NODEJS_18_X`:

```dockerfile
FROM node:18-alpine AS runner
```

**ECR Build Process**:
1. Build image: `docker build -f backend/Dockerfile -t remit-scout-backend:latest .`
2. Tag for ECR: `docker tag remit-scout-backend:latest <ecr-repo>/remit-scout-backend:<tag>`
3. Push to ECR: `docker push <ecr-repo>/remit-scout-backend:<tag>`

ECR repositories are created by CDK in `infrastructure/cdk/lib/registry.ts`.

## CDK Context Variables

CDK uses context variables for configuration:

### Database Secrets

- `planeADbSecretArn` - Secrets Manager ARN for Plane A DB
- `planeBDbSecretArn` - Secrets Manager ARN for Plane B DB
- `planeCDbSecretArn` - Secrets Manager ARN for Plane C DB
- `planeBDbSsmName` - SSM Parameter Store path (alternative)
- `planeCDbSsmName` - SSM Parameter Store path (alternative)

### Redis Secrets

- `redisSecretArn` - Secrets Manager ARN for Redis
- `redisSsmName` - SSM Parameter Store path (alternative)

### Other Configuration

- `envName` - Environment name (dev, staging, prod)
- `backendImageTag` - Docker image tag for ECS services
- `otelLambdaLayerArn` - OpenTelemetry Lambda layer ARN

See `docs/aws/env-vars.md` for complete list.

## Rollback Procedure

If you need to rollback to K8s (not recommended):

1. **Do NOT** apply deprecated K8s manifests directly
2. Review `backend/k8s/DEPRECATED.md` for migration notes
3. Update K8s manifests with current configuration
4. Verify all schedules match AWS configuration
5. Update monitoring to use Prometheus/Grafana

**Note**: Rollback is complex and not supported. Contact the platform team for assistance.

## Benefits of AWS Migration

1. **Reduced Operational Overhead**: No K8s cluster management
2. **Cost Optimization**: Pay only for what you use (Lambda, Fargate)
3. **Native Integration**: Better integration with AWS services
4. **Scalability**: Auto-scaling with Lambda and ECS
5. **Monitoring**: Unified CloudWatch monitoring
6. **Security**: IAM-based access control, Secrets Manager

## Support

For questions or issues:
1. Check `docs/aws/` for AWS-specific documentation
2. Review `infrastructure/cdk/README.md` for CDK setup
3. Contact the platform team

## Related Documentation

- **AWS Console Runbook**: `docs/aws/aws-console-runbook.md`
- **AWS Ops Checklist**: `docs/aws/aws-ops-checklist.md`
- **Migration Gap Analysis**: `docs/aws/aws-native-migration-gap-analysis.md`
- **Database Migrations**: `docs/aws/database-migrations.md`
- **CDK Infrastructure**: `infrastructure/cdk/README.md`


