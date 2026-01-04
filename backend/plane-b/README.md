# Plane B - Ingestion and Collection Service

Plane B is responsible for collecting quote data from money transfer providers and storing it in the database and S3 bronze storage.

## Health Server Configuration

The health server provides endpoints for ECS health checks and monitoring.

### Configuration

- **Port**: Configurable via `HEALTH_PORT` environment variable (default: `8080`)
- **Enable/Disable**: Set `PLANE_B_HEALTH_ENABLED=0` to disable (default: enabled)

### Endpoints

#### `GET /healthz` (Liveness Probe)

Returns `200 OK` if the service is running. Does not check dependencies.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-03T12:00:00.000Z"
}
```

**ECS Configuration**:
```yaml
healthCheck:
  command: ["CMD-SHELL", "curl -f http://localhost:8080/healthz || exit 1"]
  interval: 30
  timeout: 5
  retries: 3
  startPeriod: 60
```

#### `GET /readyz` (Readiness Probe)

Returns `200 OK` if the service is ready to accept traffic. Checks database and Redis connectivity.

**Response** (ready):
```json
{
  "status": "ready",
  "dependencies": {
    "database": "ok",
    "redis": "ok"
  },
  "timestamp": "2025-01-03T12:00:00.000Z"
}
```

**Response** (not ready):
```json
{
  "status": "not_ready",
  "dependencies": {
    "database": "unreachable",
    "redis": "unreachable"
  },
  "timestamp": "2025-01-03T12:00:00.000Z"
}
```

**ECS Configuration**:
```yaml
healthCheck:
  command: ["CMD-SHELL", "curl -f http://localhost:8080/readyz || exit 1"]
  interval: 10
  timeout: 5
  retries: 3
  startPeriod: 30
```

#### `GET /metrics` (Prometheus Metrics)

Returns Prometheus-formatted metrics for data health and collector performance.

**Response**: Prometheus text format

### ECS Task Definition Example

```json
{
  "containerDefinitions": [
    {
      "name": "plane-b",
      "image": "remit-scout/plane-b:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "HEALTH_PORT",
          "value": "8080"
        },
        {
          "name": "PLANE_B_HEALTH_ENABLED",
          "value": "1"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/healthz || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

## Redis/ElastiCache Connectivity

### Configuration

- **Connection String**: `REDIS_URL` environment variable
- **Health Check**: Included in `/readyz` endpoint
- **Fallback**: Local token buckets used if Redis unavailable

### VPC Configuration

For ElastiCache, ensure:

1. **Security Group**: Allow inbound TCP on port 6379 from ECS task security group
2. **Subnet Group**: ElastiCache subnet group must include ECS task subnets
3. **VPC**: ECS tasks and ElastiCache must be in the same VPC

**Example Security Group Rule**:
```json
{
  "Type": "ingress",
  "FromPort": 6379,
  "ToPort": 6379,
  "Protocol": "tcp",
  "SourceSecurityGroupId": "sg-ecs-tasks"
}
```

### Fallback Strategy

If Redis is unavailable:

1. **Token Buckets**: Fall back to local in-memory buckets (75% of configured RPM)
2. **Rate Limiting**: Per-instance (not distributed)
3. **Logging**: Warning logged on first fallback per bucket key

### Monitoring

- **Health Check**: `/readyz` endpoint checks Redis connectivity
- **Metrics**: Redis connection status logged in health check response
- **Alerts**: Monitor `/readyz` endpoint for Redis failures

## Proxy Configuration

Proxy URLs can be configured via environment variables, Secrets Manager, or SSM Parameter Store.

### Environment Variables (Legacy)

```bash
PROXY_RESIDENTIAL_URL=http://proxy.example.com:8080
PROXY_DATACENTER_URL=http://proxy2.example.com:8080
```

### Secrets Manager (Recommended)

Store proxy URLs in AWS Secrets Manager:

```json
{
  "url": "http://proxy.example.com:8080"
}
```

**Environment Variables**:
```bash
PROXY_RESIDENTIAL_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:proxy-residential
PROXY_DATACENTER_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:proxy-datacenter
```

### SSM Parameter Store

Store proxy URLs in SSM Parameter Store:

**Environment Variables**:
```bash
PROXY_RESIDENTIAL_SSM_NAME=/remit-scout/proxy/residential-url
PROXY_DATACENTER_SSM_NAME=/remit-scout/proxy/datacenter-url
```

### Resolution Order

1. Environment variable (`PROXY_RESIDENTIAL_URL` / `PROXY_DATACENTER_URL`)
2. Secrets Manager (if `PROXY_*_SECRET_ARN` set)
3. SSM Parameter Store (if `PROXY_*_SSM_NAME` set)

### Validation

Proxy URLs are validated to ensure they are valid HTTP/HTTPS URLs. Invalid URLs are logged and ignored.

## SQS Queue Configuration

### Queues

1. **Quote Refresh Queue**: `QUOTE_REFRESH_QUEUE_URL`
   - **DLQ**: `QUOTE_REFRESH_DLQ_URL`
   - **Mode**: `QUOTE_REFRESH_MODE` (`queue` or `db`)

2. **Ops Alerts Queue**: `OPS_ALERTS_QUEUE_URL`
   - **Mode**: `OPS_ALERTS_MODE` (`queue` or `direct`)

3. **Ingest Fanout Queue**: `INGEST_FANOUT_QUEUE_URL`
   - **Mode**: `INGEST_FANOUT_MODE` (`queue`, `direct`, or `off`)

4. **Notifications Queue**: `NOTIFICATIONS_QUEUE_URL`
   - **Mode**: `NOTIFICATIONS_MODE` (`queue` or `direct`)

### Dead Letter Queue (DLQ) Setup

Configure DLQ for critical queues:

1. **Create DLQ**: Create SQS queue for dead letters
2. **Configure Redrive**: Set `maxReceiveCount` on source queue
3. **Set DLQ URL**: Configure `QUOTE_REFRESH_DLQ_URL`

**Example**:
```json
{
  "RedrivePolicy": {
    "deadLetterTargetArn": "arn:aws:sqs:us-east-1:123456789012:quote-refresh-dlq",
    "maxReceiveCount": 3
  }
}
```

### Queue Depth Monitoring

Monitor queue depth to detect processing backlogs:

- **Metric**: `ApproximateNumberOfMessages`
- **Alert**: Set CloudWatch alarm for high queue depth
- **Action**: Scale ECS tasks or investigate processing delays

## S3 Bronze Storage

### Configuration

- **Bucket**: `BRONZE_S3_BUCKET` environment variable
- **Prefix**: `BRONZE_S3_PREFIX` (default: `bronze`)

### Permissions

ECS task role must have:

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:PutObjectAcl"
  ],
  "Resource": "arn:aws:s3:::bronze-bucket/*"
}
```

### Lifecycle Policies

Configure S3 lifecycle policies to manage old data:

```json
{
  "Rules": [
    {
      "Id": "DeleteOldBronze",
      "Status": "Enabled",
      "Expiration": {
        "Days": 90
      },
      "Filter": {
        "Prefix": "bronze/"
      }
    }
  ]
}
```

### Write Failure Alerting

Monitor S3 write failures:

- **Metric**: CloudWatch metric for S3 PutObject failures
- **Alert**: CloudWatch alarm for high failure rate
- **Logs**: All S3 write failures logged with context

## Long-Running Process Optimization

### Sweep Types and Expected Runtime

1. **Tier 1 (Alpha)**: ~1-5 minutes per provider
   - **Interval**: 60 seconds
   - **Corridors**: High-priority corridors only

2. **Tier 2 (Reference)**: ~10-30 minutes per provider
   - **Interval**: 3600 seconds (1 hour)
   - **Corridors**: Medium-priority corridors

3. **Tier 3 (Discovery)**: ~30-120 minutes per provider
   - **Interval**: 86400 seconds (24 hours)
   - **Corridors**: All supported corridors

### Progress Logging

Long sweeps log progress:

- **Start**: Log sweep start with provider, tier, corridor count
- **Progress**: Log every 10% completion
- **Completion**: Log duration and results

### ECS Task Timeout

Ensure ECS task timeout is sufficient:

- **Recommended**: 4 hours (14400 seconds)
- **Minimum**: 2 hours (7200 seconds) for Tier 3 sweeps

**Task Definition**:
```json
{
  "stopTimeout": 14400
}
```

## Error Handling

All errors are handled consistently using utilities from `backend/shared/utils/error-handling.ts`:

- **Type Safety**: All errors use `unknown` type
- **Formatting**: `formatError()` for consistent error messages
- **Logging**: All errors logged with context

## AWS Configuration Validation

Validate AWS service configuration on startup:

```typescript
import { validateAwsConfig } from '../../shared/aws-config-validator'

const results = await validateAwsConfig({
  skipS3: false,
  skipSQS: false,
  skipRedis: false,
})
```

**Disable Validation**:
Set `SKIP_AWS_CONFIG_VALIDATION=1` to skip validation on startup.

## Memory Management

### Token Bucket Cleanup

Local token buckets are automatically cleaned up:

- **TTL**: 60 minutes (`LOCAL_BUCKET_TTL_MS`)
- **Cleanup Interval**: 5 minutes (`CLEANUP_INTERVAL_MS`)
- **LRU Eviction**: Unused buckets removed after TTL

No manual cleanup required - the cleanup interval runs automatically.

## Related Documentation

- **Error Handling**: `backend/shared/utils/error-handling.ts`
- **AWS Params**: `backend/shared/aws-params.ts`
- **AWS Config Validator**: `backend/shared/aws-config-validator.ts`
- **Bronze Storage**: `backend/shared/bronze-storage.ts`


