# CloudWatch Dashboard Configuration

**⚠️ MIGRATION NOTE**: This document has been updated for AWS-native deployment. Grafana/Prometheus dashboards are deprecated. All monitoring now uses **CloudWatch Dashboards** defined in `infrastructure/cdk/lib/monitoring.ts`.

## CloudWatch Dashboards

CloudWatch Dashboards are automatically created by CDK and named: `remit-scout-{env}` (e.g., `remit-scout-prod`).

### Accessing Dashboards

1. **AWS Console**: CloudWatch → Dashboards → `remit-scout-{env}`
2. **AWS CLI**: `aws cloudwatch get-dashboard --dashboard-name remit-scout-{env}`
3. **CDK**: Defined in `infrastructure/cdk/lib/monitoring.ts`

### Dashboard Widgets

The CDK creates the following widgets:
- SQS Queue Depth
- SQS DLQ Depth
- Lambda Errors
- API Gateway Latency (p95)
- ECS CPU Utilization
- ECS Memory Utilization
- Aurora CPU & Connections
- Redis CPU

### Custom Metrics

Custom metrics are published to the `RemitScout` namespace. See `cloudwatch-queries.md` for query examples.

---

## Legacy Grafana Dashboard Configuration (Deprecated)

<details>
<summary>Click to expand legacy Grafana configuration (for reference only)</summary>

This section describes the previous Grafana dashboard structure. **Do not use** - it is provided for reference only.

## Dashboard: Data Health SLO

### Panel 1: Tier 1 Freshness (p95) - Single Stat

**Title**: Tier 1 Freshness (p95)

**Query**:
```promql
histogram_quantile(0.95, data_freshness_age_minutes{priority_tier="tier_1_alpha"})
```

**Visualization**: Stat (Single Stat)
**Unit**: Minutes
**Thresholds**:
- Green: < 15
- Yellow: 15-20
- Red: > 20

**Description**: Shows p95 data freshness for Tier 1 corridors. Should be < 15 minutes.

---

### Panel 2: Quote Success Rate - Gauge

**Title**: Quote Success Rate (%)

**Query**:
```promql
avg(quote_success_rate{priority_tier="tier_1_alpha"}) * 100
```

**Visualization**: Gauge
**Unit**: Percent (0-100)
**Thresholds**:
- Green: > 98
- Yellow: 95-98
- Red: < 95

**Description**: Average quote success rate for Tier 1 corridors. Target: ≥ 98%.

---

### Panel 3: Provider Coverage - Table

**Title**: Provider Coverage by Corridor

**Query**:
```promql
provider_coverage_count{priority_tier="tier_1_alpha"}
```

**Visualization**: Table
**Columns**:
- `corridor_id` (Label)
- `amount_bucket` (Label)
- `Value` (Provider Count)

**Description**: Shows provider coverage count per corridor and amount bucket.

---

### Panel 4: Freshness Trend - Time Series

**Title**: Freshness Trend (Last 24h)

**Query**:
```promql
data_freshness_age_minutes{priority_tier="tier_1_alpha"}
```

**Visualization**: Time Series
**Unit**: Minutes
**Legend**: `{{corridor_id}} - {{provider_id}}`

**Description**: Time series showing freshness age over the last 24 hours, grouped by corridor and provider.

---

## Dashboard: Batch Job Health

### Panel 1: Job Last Success Time - Table

**Title**: Last Success Timestamp

**Query**:
```promql
gold_popular_corridors_job_last_success_timestamp
gold_fx_rates_job_last_success_timestamp
gold_pulse_cache_job_last_success_timestamp
gold_publisher_job_last_success_timestamp
```

**Visualization**: Table
**Format**: Time Series
**Columns**:
- `__name__` (Metric Name)
- `Value` (Unix Timestamp, formatted as time)

**Description**: Shows the last successful execution time for each batch job.

---

### Panel 2: Job Duration (p95) - Bar Gauge

**Title**: Job Duration (p95)

**Query**:
```promql
histogram_quantile(0.95, gold_popular_corridors_job_duration_seconds)
histogram_quantile(0.95, gold_fx_rates_job_duration_seconds)
histogram_quantile(0.95, gold_pulse_cache_job_duration_seconds)
histogram_quantile(0.95, gold_publisher_job_duration_seconds)
```

**Visualization**: Bar Gauge
**Unit**: Seconds
**Thresholds**:
- Green: < 60
- Yellow: 60-300
- Red: > 300

**Description**: p95 execution duration for each batch job.

---

### Panel 3: Job Failures - Time Series

**Title**: Job Failures Over Time

**Query**:
```promql
rate(gold_popular_corridors_job_failures_total[5m])
rate(gold_fx_rates_job_failures_total[5m])
rate(gold_pulse_cache_job_failures_total[5m])
rate(gold_publisher_job_failures_total[5m])
```

**Visualization**: Time Series
**Unit**: Failures/sec
**Legend**: `{{__name__}}`

**Description**: Failure rate over time for each batch job.

---

### Panel 4: Job Throughput - Time Series

**Title**: Job Throughput

**Query**:
```promql
rate(gold_popular_corridors_job_rows_processed_total[5m])
rate(gold_fx_rates_job_rates_processed_total[5m])
rate(gold_pulse_cache_job_entries_processed_total[5m])
```

**Visualization**: Time Series
**Unit**: Items/sec
**Legend**: `{{__name__}}`

**Description**: Processing throughput for batch jobs.

---

## Dashboard Variables (Optional)

Add these variables to enable filtering:

- **`job_name`**: `gold_popular_corridors_job`, `gold_fx_rates_job`, `gold_pulse_cache_job`, `gold_publisher_job`
- **`priority_tier`**: `tier_1_alpha`, `tier_2_reference`, `tier_3_discovery`
- **`corridor_id`**: Label values from `data_freshness_age_minutes`

</details>

## CloudWatch Dashboard Customization

To add custom widgets to the CloudWatch Dashboard, edit `infrastructure/cdk/lib/monitoring.ts`:

```typescript
const customWidget = new GraphWidget({
  title: 'Custom Metric',
  left: [
    new Metric({
      namespace: 'RemitScout',
      metricName: 'your_metric_name',
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
  ],
})

dashboard.addWidgets(customWidget)
```

After updating, redeploy the CDK stack:
```bash
cd infrastructure/cdk
npm run cdk deploy
```

## Monitoring Documentation

- **CloudWatch Queries**: `cloudwatch-queries.md` - Complete query reference
- **CloudWatch Alarms**: Defined in `infrastructure/cdk/lib/monitoring.ts`
- **SLO Tracking**: See `backend/shared/slo-tracker.ts` for metric publishing
- **Custom Metrics**: See `backend/shared/cloudwatch-metrics.ts` for publishing API

## Accessing Custom Metrics

All custom metrics are in the `RemitScout` namespace:

1. **AWS Console**: CloudWatch → Metrics → All metrics → RemitScout
2. **Metric Names**:
   - `data_freshness_age_minutes`
   - `quote_success_rate`
   - `provider_coverage_count`
   - `gold_*_job_*` (batch job metrics)

See `cloudwatch-queries.md` for detailed query examples.

