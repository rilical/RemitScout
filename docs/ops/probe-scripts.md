# Provider Probe Scripts

## Purpose
Health check scripts that verify provider API connectivity and cache TTL logic.

## Usage

### Individual Provider Probe
```bash
pnpm -C backend probe:remitly
```

### All Provider Probes
```bash
pnpm -C backend probe:all
```

### Cache TTL Probe
```bash
pnpm -C backend probe:cache-ttl
```

## Environment Variables

- `PROBE_TIMEOUT_MS`: Maximum execution time in milliseconds (default: 300000 = 5 min)
- `PROBE_RETRIES`: Number of retry attempts on failure (default: 0)
- `PROBE_OUTPUT_FORMAT`: Output format - `json` (default) or `text`
- `CACHE_TTL_TEST_CORRIDORS`: Comma-separated list of corridors for cache TTL probe

## Exit Codes

- `0`: Probe succeeded
- `1`: Probe failed or timeout

## Output

Probes output structured JSON to stdout for CI/CD integration:

```json
{
  "success": true,
  "providerId": "remitly",
  "corridorsTested": 0,
  "corridorsSucceeded": 0,
  "corridorsFailed": 0,
  "durationMs": 45230
}
```

## Provider-Specific Configuration

Each provider probe now uses its own rate limits from `plane-b/src/providers/{provider}/limits.ts`:

- **Remitly**: `httpLimits.rpm = 6`, `perCorridorRpm = 2`
- **Wise**: `httpLimits.rpm = 30`, `perCorridorRpm = 2`
- **XE**: `httpLimits.rpm = 6`, `perCorridorRpm = 2`
- **WorldRemit**: `httpLimits.rpm = 6`, `perCorridorRpm = 2`
- **Western Union**: `httpLimits.rpm = 6`, `perCorridorRpm = 2`

## Features

### Timeout Protection
All probes now have a configurable timeout (default 5 minutes) to prevent hanging indefinitely.

### Graceful Shutdown
Probes handle SIGTERM and SIGINT signals for graceful shutdown in containerized environments.

### Retry Logic
Optional retry logic (configurable via `PROBE_RETRIES`) with exponential backoff for transient failures.

### Structured Output
JSON output format enables easy integration with monitoring systems and CI/CD pipelines.

### Consistent Payment Methods
All provider probes use `bank_transfer` as the payin method for consistency.

## CI/CD Integration

The probes are integrated into GitHub Actions workflow (`.github/workflows/probe-health-checks.yml`):

- Runs automatically every 6 hours
- Runs on push to main branch if probe scripts or providers change
- Can be triggered manually via `workflow_dispatch`
- Runs all provider probes in parallel matrix strategy
- Uploads probe results as artifacts

## Monitoring Integration

Probes output structured JSON that can be consumed by:

- **Monitoring systems**: Prometheus exporters, Datadog, New Relic
- **Alerting**: PagerDuty, Slack, email notifications
- **Logging**: Centralized log aggregation (ELK, Splunk)
- **Dashboards**: Grafana, custom health dashboards

## Troubleshooting

### Probe Timeout
If a probe times out, check:
- Provider API status
- Network connectivity
- Rate limiting issues
- Database connection pool exhaustion

### Probe Failure
If a probe fails:
1. Check logs for specific error messages
2. Verify provider API is accessible
3. Check database connection
4. Review rate limit configuration

### False Positives
If probes fail due to transient issues:
- Increase `PROBE_RETRIES` environment variable
- Adjust timeout via `PROBE_TIMEOUT_MS`
- Review provider rate limit settings

## Sprint 4 Enhancements (Future)

- Prometheus metrics export
- Real-time alerting integration (PagerDuty, Slack)
- Historical probe result storage
- Probe result dashboard
- Auto-remediation on probe failures



