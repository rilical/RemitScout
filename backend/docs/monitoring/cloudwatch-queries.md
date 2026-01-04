# CloudWatch Metrics Queries for SLO Monitoring

This document contains CloudWatch Metrics queries for monitoring Service Level Objectives (SLOs) and data health metrics. All custom metrics are published to the `RemitScout` namespace.

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
  --dimensions Name=priority_tier,Value=tier_1_alpha \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average,Maximum
```

### Via CloudWatch Insights (Logs)
For log-based metrics, use CloudWatch Logs Insights:
```
fields @timestamp, @message
| filter @message like /data_freshness/
| stats avg(freshness_minutes) by bin(5m)
```

## Freshness SLO

**SLO**: Tier 1 corridors should have p95 freshness ≤ 15 minutes

### CloudWatch Metric Query
**Metric Name**: `data_freshness_age_minutes`  
**Namespace**: `RemitScout`  
**Dimensions**: `priority_tier=tier_1_alpha`  
**Statistic**: `p95` (or `Average`, `Maximum`)  
**Period**: `5 minutes`

### CloudWatch Dashboard Widget JSON
```json
{
  "metrics": [
    ["RemitScout", "data_freshness_age_minutes", {
      "priority_tier": "tier_1_alpha"
    }, {
      "stat": "p95",
      "label": "Tier 1 Freshness (p95)"
    }]
  ],
  "period": 300,
  "view": "timeSeries",
  "stacked": false,
  "yAxis": {
    "left": {
      "min": 0,
      "max": 30
    }
  }
}
```

### CloudWatch Alarm Threshold
- **Threshold**: `15` minutes
- **Comparison**: `GreaterThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

## Quote Success Rate SLO

**SLO**: ≥ 98% success rate for Tier 1 corridors

### CloudWatch Metric Query
**Metric Name**: `quote_success_rate`  
**Namespace**: `RemitScout`  
**Dimensions**: `priority_tier=tier_1_alpha`  
**Statistic**: `Average`  
**Period**: `10 minutes`

### CloudWatch Dashboard Widget JSON
```json
{
  "metrics": [
    ["RemitScout", "quote_success_rate", {
      "priority_tier": "tier_1_alpha"
    }, {
      "stat": "Average",
      "label": "Quote Success Rate"
    }]
  ],
  "period": 600,
  "view": "timeSeries",
  "stacked": false,
  "yAxis": {
    "left": {
      "min": 0,
      "max": 1
    }
  }
}
```

### CloudWatch Alarm Threshold
- **Threshold**: `0.98` (98%)
- **Comparison**: `LessThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

## Provider Coverage SLO

**SLO**: ≥ 3 providers for Tier 1 corridors

### CloudWatch Metric Query
**Metric Name**: `provider_coverage_count`  
**Namespace**: `RemitScout`  
**Dimensions**: `priority_tier=tier_1_alpha`  
**Statistic**: `Minimum` (or `Average`)  
**Period**: `5 minutes`

### CloudWatch Dashboard Widget JSON
```json
{
  "metrics": [
    ["RemitScout", "provider_coverage_count", {
      "priority_tier": "tier_1_alpha"
    }, {
      "stat": "Minimum",
      "label": "Min Provider Coverage"
    }]
  ],
  "period": 300,
  "view": "timeSeries",
  "stacked": false,
  "yAxis": {
    "left": {
      "min": 0,
      "max": 10
    }
  }
}
```

### CloudWatch Alarm Threshold
- **Threshold**: `3` providers
- **Comparison**: `LessThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

## Gold Export Lag SLO

### Intraday Export (≤ 15 minutes)

**SLO**: Gold publisher job should complete within 15 minutes

### CloudWatch Metric Query
**Metric Name**: `gold_publisher_job_last_success_age_seconds`  
**Namespace**: `RemitScout`  
**Statistic**: `Maximum`  
**Period**: `5 minutes`

### CloudWatch Alarm Threshold
- **Threshold**: `900` seconds (15 minutes)
- **Comparison**: `GreaterThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

### Daily Export (≤ 2 hours)

**SLO**: Daily batch jobs should complete within 2 hours

### CloudWatch Metric Query
**Metric Name**: `gold_publisher_job_last_success_age_seconds`  
**Namespace**: `RemitScout`  
**Statistic**: `Maximum`  
**Period**: `10 minutes`

### CloudWatch Alarm Threshold
- **Threshold**: `7200` seconds (2 hours)
- **Comparison**: `GreaterThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

## Batch Job Health

### Job Duration (p95)

**Metric Names**:
- `gold_popular_corridors_job_duration_seconds`
- `gold_fx_rates_job_duration_seconds`
- `gold_pulse_cache_job_duration_seconds`
- `gold_publisher_job_duration_seconds`

**Namespace**: `RemitScout`  
**Statistic**: `p95` (or `Average`, `Maximum`)  
**Period**: `5 minutes`

### CloudWatch Dashboard Widget JSON (All Jobs)
```json
{
  "metrics": [
    ["RemitScout", "gold_popular_corridors_job_duration_seconds", {}, {
      "stat": "p95",
      "label": "Popular Corridors (p95)"
    }],
    ["RemitScout", "gold_fx_rates_job_duration_seconds", {}, {
      "stat": "p95",
      "label": "FX Rates (p95)"
    }],
    ["RemitScout", "gold_pulse_cache_job_duration_seconds", {}, {
      "stat": "p95",
      "label": "Pulse Cache (p95)"
    }],
    ["RemitScout", "gold_publisher_job_duration_seconds", {}, {
      "stat": "p95",
      "label": "Publisher (p95)"
    }]
  ],
  "period": 300,
  "view": "timeSeries",
  "stacked": false
}
```

### Job Failure Rate

**Metric Names**:
- `gold_popular_corridors_job_failures_total`
- `gold_fx_rates_job_failures_total`
- `gold_pulse_cache_job_failures_total`
- `gold_publisher_job_failures_total`

**Namespace**: `RemitScout`  
**Statistic**: `Sum` (count of failures)  
**Period**: `5 minutes`

### CloudWatch Alarm Threshold
- **Threshold**: `0` (any failure triggers alarm)
- **Comparison**: `GreaterThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

### Job Throughput

**Metric Names**:
- `gold_popular_corridors_job_rows_processed_total`
- `gold_fx_rates_job_rates_processed_total`
- `gold_pulse_cache_job_entries_processed_total`

**Namespace**: `RemitScout`  
**Statistic**: `Sum` (total processed)  
**Period**: `5 minutes`

**Note**: To calculate rate (items/second), use CloudWatch Math:
```
SUM([metric]) / PERIOD(metric)
```

## Lambda Function Metrics

### Lambda Errors
**Namespace**: `AWS/Lambda`  
**Metric Name**: `Errors`  
**Dimensions**: `FunctionName=<function-name>`  
**Statistic**: `Sum`

### Lambda Duration
**Namespace**: `AWS/Lambda`  
**Metric Name**: `Duration`  
**Dimensions**: `FunctionName=<function-name>`  
**Statistic**: `p95`, `p99`, `Average`

### Lambda Throttles
**Namespace**: `AWS/Lambda`  
**Metric Name**: `Throttles`  
**Dimensions**: `FunctionName=<function-name>`  
**Statistic**: `Sum`

## ECS Service Metrics

### ECS CPU Utilization
**Namespace**: `AWS/ECS`  
**Metric Name**: `CPUUtilization`  
**Dimensions**: 
- `ServiceName=<service-name>`
- `ClusterName=<cluster-name>`

**Statistic**: `Average`, `Maximum`

### ECS Memory Utilization
**Namespace**: `AWS/ECS`  
**Metric Name**: `MemoryUtilization`  
**Dimensions**: 
- `ServiceName=<service-name>`
- `ClusterName=<cluster-name>`

**Statistic**: `Average`, `Maximum`

## RDS/Aurora Metrics

### Database CPU
**Namespace**: `AWS/RDS`  
**Metric Name**: `CPUUtilization`  
**Dimensions**: `DBClusterIdentifier=<cluster-id>`

### Database Connections
**Namespace**: `AWS/RDS`  
**Metric Name**: `DatabaseConnections`  
**Dimensions**: `DBClusterIdentifier=<cluster-id>`

## ElastiCache/Redis Metrics

### Redis CPU
**Namespace**: `AWS/ElastiCache`  
**Metric Name**: `CPUUtilization`  
**Dimensions**: `ReplicationGroupId=<replication-group-id>`

### Redis Memory
**Namespace**: `AWS/ElastiCache`  
**Metric Name**: `DatabaseMemoryUsagePercentage`  
**Dimensions**: `ReplicationGroupId=<replication-group-id>`

## SQS Queue Metrics

### Queue Depth
**Namespace**: `AWS/SQS`  
**Metric Name**: `ApproximateNumberOfMessagesVisible`  
**Dimensions**: `QueueName=<queue-name>`

### DLQ Depth
**Namespace**: `AWS/SQS`  
**Metric Name**: `ApproximateNumberOfMessagesVisible`  
**Dimensions**: `QueueName=<queue-name>-dlq`

## Custom Metric Publishing

Custom metrics are published via `backend/shared/cloudwatch-metrics.ts`:

```typescript
import { recordCloudWatchMetric } from './shared/cloudwatch-metrics'

recordCloudWatchMetric({
  name: 'data_freshness_age_minutes',
  value: 12.5,
  unit: 'None',
  dimensions: {
    priority_tier: 'tier_1_alpha',
    corridor_id: 'USD-EUR',
  },
})
```

## Metric Naming Conventions

- **Custom Metrics**: Use snake_case (e.g., `data_freshness_age_minutes`)
- **AWS Metrics**: Use AWS standard names (e.g., `CPUUtilization`)
- **Dimensions**: Use lowercase with underscores (e.g., `priority_tier`, `corridor_id`)
- **Namespace**: Always `RemitScout` for custom metrics

## Best Practices

1. **Period Selection**: Use 5-minute periods for most metrics, 1-minute for high-frequency alerts
2. **Statistic Selection**: 
   - Use `p95` or `p99` for latency/freshness SLOs
   - Use `Average` for rates and percentages
   - Use `Sum` for counts and totals
   - Use `Minimum`/`Maximum` for bounds checking
3. **Alarm Evaluation**: Use 1-2 evaluation periods for critical alerts, 3+ for warning alerts
4. **Missing Data**: Use `TreatMissingData: NOT_BREACHING` for optional metrics, `BREACHING` for required metrics


