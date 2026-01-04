# ⚠️ DEPRECATED: Kubernetes Configuration Files

**Status**: These Kubernetes configuration files are deprecated and no longer used in production.

**Migration Date**: AWS-native migration completed. All workloads now run on AWS (ECS Fargate, Lambda, EventBridge).

## Migration Status

All scheduled jobs and services have been migrated to AWS:

- ✅ **b2c-refresh-worker**: Migrated to ECS Fargate task triggered by EventBridge (every 2 minutes)
- ✅ **b2c-retry-failed**: Migrated to Lambda function triggered by EventBridge (every 15 minutes)
- ✅ **stoplist-auto-resume**: Migrated to Lambda function triggered by EventBridge (daily at 02:00 UTC)

## AWS Equivalents

### Scheduled Jobs
- **EventBridge Rules**: `infrastructure/cdk/lib/scheduled-jobs.ts`
- **Lambda Functions**: `backend/scripts/aws/*-lambda.ts`
- **ECS Tasks**: `infrastructure/cdk/lib/ecs-tasks.ts`

### Monitoring
- **CloudWatch Dashboards**: `infrastructure/cdk/lib/monitoring.ts`
- **CloudWatch Alarms**: Replaces Prometheus alerts
- **SNS Topics**: For alert notifications

### Configuration
- **Secrets Manager**: Replaces K8s secrets
- **SSM Parameter Store**: Replaces ConfigMaps
- **ECS Task Definitions**: Replaces K8s deployments

## Why These Files Are Kept

These files are retained for:
1. **Reference**: Historical record of previous infrastructure
2. **Rollback**: Emergency rollback procedures (if needed)
3. **Documentation**: Understanding the migration path

## Do Not Use

⚠️ **DO NOT** apply these K8s manifests to any cluster. They are not maintained and may reference outdated configurations.

## Migration Documentation

For complete migration details, see:
- `docs/aws/migration-from-k8s.md` - Full migration guide
- `docs/aws/aws-native-migration-gap-analysis.md` - Technical gap analysis
- `infrastructure/cdk/README.md` - CDK infrastructure documentation

## Questions?

Contact the platform team or refer to the AWS-native documentation in `docs/aws/`.


