# Prometheus Queries for SLO Monitoring

This document contains PromQL queries for monitoring Service Level Objectives (SLOs) and data health metrics.

## Freshness SLO

**SLO**: Tier 1 corridors should have p95 freshness ≤ 15 minutes

```promql
histogram_quantile(0.95, 
  data_freshness_age_minutes{priority_tier="tier_1_alpha"}
) <= 15
```

**Alternative**: Get actual p95 value
```promql
histogram_quantile(0.95, 
  data_freshness_age_minutes{priority_tier="tier_1_alpha"}
)
```

## Quote Success Rate SLO

**SLO**: ≥ 98% success rate for Tier 1 corridors

```promql
avg(quote_success_rate{priority_tier="tier_1_alpha"}) >= 0.98
```

**Alternative**: Get actual average success rate
```promql
avg(quote_success_rate{priority_tier="tier_1_alpha"})
```

## Provider Coverage SLO

**SLO**: ≥ 3 providers for Tier 1 corridors

```promql
min(provider_coverage_count{priority_tier="tier_1_alpha"}) >= 3
```

**Alternative**: Get minimum coverage
```promql
min(provider_coverage_count{priority_tier="tier_1_alpha"})
```

## Gold Export Lag SLO

### Intraday Export (≤ 15 minutes)

**SLO**: Gold publisher job should complete within 15 minutes

```promql
(time() - gold_publisher_job_last_success_timestamp) / 60 <= 15
```

**Alternative**: Get actual lag in minutes
```promql
(time() - gold_publisher_job_last_success_timestamp) / 60
```

### Daily Export (≤ 2 hours)

**SLO**: Daily batch jobs should complete within 2 hours

```promql
(time() - gold_publisher_job_last_success_timestamp) / 3600 <= 2
```

## Batch Job Health

### Job Duration (p95)

```promql
histogram_quantile(0.95, gold_popular_corridors_job_duration_seconds)
histogram_quantile(0.95, gold_fx_rates_job_duration_seconds)
histogram_quantile(0.95, gold_pulse_cache_job_duration_seconds)
histogram_quantile(0.95, gold_publisher_job_duration_seconds)
```

### Job Failure Rate

```promql
rate(gold_popular_corridors_job_failures_total[5m])
rate(gold_fx_rates_job_failures_total[5m])
rate(gold_pulse_cache_job_failures_total[5m])
rate(gold_publisher_job_failures_total[5m])
```

### Job Throughput

```promql
rate(gold_popular_corridors_job_rows_processed_total[5m])
rate(gold_fx_rates_job_rates_processed_total[5m])
rate(gold_pulse_cache_job_entries_processed_total[5m])
```



