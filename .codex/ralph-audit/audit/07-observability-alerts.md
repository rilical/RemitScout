# Observability & Alerts Deep Audit Findings

Audit Date: 2026-02-28T21:45:00Z
Files Examined: 25
Total Findings: 14

## Summary by Severity
- Critical: 2
- High: 4
- Medium: 5
- Low: 3

## Remediation Status (FIX-RS-004+)

| Finding | Status | Evidence |
|---|---|---|
| #1 Cross-plane tracing metrics never emitted | fixed | `backend/shared/cross-plane-fetch.ts`, `backend/scripts/gold-live-worker.ts`, `infrastructure/cdk/lib/monitoring.ts` |
| #2 Smart alerts/corridor refresh lacked failure signals | fixed | `backend/scripts/smart-alerts-job.ts`, `backend/scripts/alert-corridor-refresh-job.ts`, `infrastructure/cdk/lib/monitoring.ts` |
| #3 Probe metric failures swallowed at debug level | fixed | `backend/scripts/lib/probe-utils.ts` |
| #4 Worker metric failures swallowed at debug level | fixed | `backend/shared/worker-metrics.ts` |
| #5 Sentry unset failed silently in protected envs | fixed | `backend/shared/error-tracker.ts` |
| #6 New Relic personal email default | fixed | `ops/newrelic/sync-notifications-workflows.mjs` |
| #7 Evidence output silent drop when path unset/missing | fixed | `backend/scripts/lib/evidence.ts` |
| #8 Raw console logging in alert corridor refresh | fixed | `backend/scripts/alert-corridor-refresh-job.ts` |
| #9 Tracing sample-rate state reset race | fixed | `backend/shared/tracing.ts` |
| #10 New Relic verify-signals retry/backoff gap | fixed | `ops/newrelic/verify-signals.mjs` |
| #11 Ops-alerts worker missing queue depth metrics | fixed | `backend/scripts/ops-alerts-queue-worker.ts` |
| #12 Embedded Python/unquoted shell expansion | fixed | `ops/observe-dev.sh` |
| #13 Escaped-quote corruption in watch script | fixed | `ops/watch/dev-b2b-tier2-watch.sh` |
| #14 Bootstrap skip path lacked explicit marker | fixed | `ops/newrelic/bootstrap-all.mjs` |

---

## Findings

### [CRITICAL] Finding #1: Cross-plane tracing metrics never emitted -- alarms and dashboards are dead

**File:** `infrastructure/cdk/lib/monitoring.ts`
**Lines:** 1165-1202
**Category:** `observability-gap`

**Description:**
CloudWatch alarms are defined for `cross_plane_hop_duration_ms` and `cross_plane_error_amplification` in the `RemitScout/Tracing` namespace. However, a search across the entire `backend/` tree returns zero files that emit these metrics. The New Relic dashboard explicitly acknowledges this with markdown widgets stating "Cross-Plane Hop (Not Instrumented)" and "Cross-Plane Error Amplification (Not Instrumented)" at four separate locations. Despite this, the CDK still creates real CloudWatch alarms against these phantom metrics. Because `treatMissingData` is `NOT_BREACHING`, these alarms will silently stay in OK state forever, providing a false sense of security that cross-plane latency and error amplification are being monitored.

**Code:**
```ts
// infrastructure/cdk/lib/monitoring.ts:1165-1183
const crossPlaneHopLatencyAlarm = new Alarm(scope, 'CrossPlaneHopLatencyAlarm', {
    alarmName: `remit-scout-${options.envName}-cross-plane-hop-latency-high`,
    metric: new Metric({
      namespace: 'RemitScout/Tracing',
      metricName: 'cross_plane_hop_duration_ms',
      ...
    }),
    threshold: crossPlaneHopLatencyThreshold,
    treatMissingData: TreatMissingData.NOT_BREACHING, // Never breaches because metric never exists
  })
```

```js
// ops/newrelic/bootstrap-dashboards.mjs:231
widgetMarkdown(
  'Cross-Plane Hop (Not Instrumented)',
  'Cross-plane hop custom metric is not currently emitted in this profile...',
  ...
),
```

**Why this matters:**
Cross-plane errors between Plane A (API) and Plane B (data collection) could cascade silently. The alarm infrastructure exists to catch exactly this scenario, but no code ever publishes the metric. This is a monitoring blind spot that masks latency degradation between architectural planes.

---

### [CRITICAL] Finding #2: smart-alerts-job and alert-corridor-refresh-job have no CloudWatch metrics, no Sentry, no batch-job alarm coverage

**File:** `backend/scripts/smart-alerts-job.ts`
**Lines:** 381-461
**File:** `backend/scripts/alert-corridor-refresh-job.ts`
**Lines:** 399-586
**Category:** `silent-failure`

**Description:**
Both the `smart-alerts-job` and `alert-corridor-refresh-job` are critical scheduled Lambda jobs that compute user-facing alert signals and refresh corridor data for alert evaluation. Neither job calls `recordBatchJobMetric()` (from `shared/worker-metrics.ts`) nor `initErrorTracking()` (from `shared/error-tracker.ts`). The `smart-alerts-job` is also not in the `batchJobNames` list in `monitoring.ts` (lines 829-841), so no CloudWatch alarm exists for its failures. The `alert-corridor-refresh-job` uses raw `console.log`/`console.error` in its `require.main` block instead of the structured logger, bypassing log aggregation and New Relic forwarding.

**Code:**
```ts
// backend/scripts/smart-alerts-job.ts:452-461
if (require.main === module) {
  runSmartAlertsJob()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('job_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      process.exit(1)
    })
}
// No recordBatchJobMetric('smart-alerts-job', 'job_complete', ...)
// No initErrorTracking('smart-alerts-job')
```

```ts
// backend/scripts/alert-corridor-refresh-job.ts:577-585
if (require.main === module) {
  runAlertCorridorRefreshJob()
    .then(result => {
      console.log('Alert corridor refresh complete:', result)  // raw console, not structured logger
      process.exit(0)
    })
    .catch(error => {
      console.error('Alert corridor refresh failed:', error)   // raw console, not structured logger
      process.exit(1)
    })
}
```

**Why this matters:**
If `smart-alerts-job` fails, no CloudWatch alarm fires and no Sentry event is captured. Users would stop receiving smart alerts with zero automated notification to ops. The corridor refresh job would silently degrade alert data freshness for non-macro corridors. These are money-path jobs: users pay for alerts and rely on them for remittance timing decisions.

---

### [HIGH] Finding #3: Probe metric failures are silently swallowed at debug level

**File:** `backend/scripts/lib/probe-utils.ts`
**Lines:** 112-118
**Category:** `silent-failure`

**Description:**
When CloudWatch metric publishing fails in `publishProbeMetrics`, the error is logged at `debug` level with the comment "Silently fail metrics - don't break probe execution." In production, `LOG_LEVEL` defaults to `info`, meaning these failures are completely invisible. If CloudWatch permissions are misconfigured or the region is wrong, all probe metrics would stop flowing with no indication in logs, dashboards, or alarms.

**Code:**
```ts
// backend/scripts/lib/probe-utils.ts:112-118
} catch (error: unknown) {
    // Silently fail metrics - don't break probe execution
    logger.debug('probe_metrics_failed', {
      provider_id: providerId,
      error: formatError(error).message,
    })
  }
```

**Why this matters:**
Probe metrics (`probe_result`, `probe_run_total`, etc.) are the foundation for provider health alarms and the probe heartbeat alarm. If metric emission silently fails, provider outages would go undetected. The `probe_heartbeat` alarm has `TreatMissingData: BREACHING` which would eventually fire, but only after 15+ minutes and only if the probe itself ran but emitted nothing -- a race condition with the silent catch.

---

### [HIGH] Finding #4: Worker metrics silently swallowed at debug level across all workers

**File:** `backend/shared/worker-metrics.ts`
**Lines:** 62-69
**Category:** `silent-failure`

**Description:**
All four metric recording functions (`recordWorkerMetric`, `recordBatchJobMetric`, `recordQueueDepthMetric`, `recordDLQMessageCount`) catch CloudWatch errors and log them at `debug` level only. In production, debug logs are suppressed, meaning systematic metric pipeline failures (e.g., IAM permission drift, service quotas exceeded) would be completely invisible.

**Code:**
```ts
// backend/shared/worker-metrics.ts:62-69
} catch (error: unknown) {
    // Silently fail metrics - don't break worker operations
    logger.debug('worker_metric_failed', {
      worker_name: workerName,
      operation,
      error: formatError(error).message,
    })
  }
```

**Why this matters:**
This pattern is repeated in every metric recording function (lines 62, 131, 165, 203). If the CloudWatch client fails globally (e.g., credentials expire, PutMetricData throttled), all worker metrics, batch job metrics, queue depth metrics, and DLQ counts silently stop flowing. Every alarm that depends on custom metrics (`RemitScout/Workers`, `RemitScout/BatchJobs`, `RemitScout/Queues` namespaces) becomes blind. With `TreatMissingData: NOT_BREACHING` on most alarms, no alert fires for the metric gap itself.

---

### [HIGH] Finding #5: Sentry error tracking degrades silently when SENTRY_DSN is unset

**File:** `backend/shared/error-tracker.ts`
**Lines:** 99-110, 168-171
**Category:** `observability-gap`

**Description:**
When `SENTRY_DSN` is not configured, `initErrorTracking` logs a warning and returns. All subsequent calls to `captureError`, `captureExceptionWithContext`, `captureMessage`, etc. check `if (!initialized) { return }` and silently no-op. There is no metric emitted, no periodic reminder, and no health check that validates Sentry connectivity. An environment where `SENTRY_DSN` is accidentally removed from secrets would lose all error tracking with only a single startup warning log.

**Code:**
```ts
// backend/shared/error-tracker.ts:99-110
export const initErrorTracking = async (serviceName?: string): Promise<void> => {
  const dsn = process.env.SENTRY_DSN
  ...
  if (!dsn) {
    logger.warn('error_tracking_disabled', {
      reason: 'SENTRY_DSN not set',
    })
    return
  }
```

```ts
// backend/shared/error-tracker.ts:168-171
export const captureError = async (...): Promise<void> => {
  if (!initialized) {
    return  // silently discards all errors
  }
```

**Why this matters:**
Sentry is the last-resort error capture mechanism. If it silently degrades, runtime exceptions in production are lost. The ops-alerts-queue-worker and alert-evaluation-worker both call `initErrorTracking()`, but if the DSN secret is rotated or deleted, the only signal is a single `warn` log line at startup that gets buried in high-volume log streams.

---

### [HIGH] Finding #6: New Relic alert notification hardcoded to personal email address

**File:** `ops/newrelic/sync-notifications-workflows.mjs`
**Lines:** 11, 17
**Category:** `will-break`

**Description:**
The default New Relic alert notification email is hardcoded to `austrilic@gmail.com`. While `NEW_RELIC_ALERT_EMAIL` can override this, the default is a personal Gmail address rather than a team distribution list or PagerDuty integration. If the environment variable is not set during bootstrap, all New Relic incident notifications for both STAGING and PROD go to a single personal inbox.

**Code:**
```js
// ops/newrelic/sync-notifications-workflows.mjs:11,17
// * - NEW_RELIC_ALERT_EMAIL (default: austrilic@gmail.com)
const NEW_RELIC_ALERT_EMAIL = (process.env.NEW_RELIC_ALERT_EMAIL || 'austrilic@gmail.com').trim()
```

**Why this matters:**
Alert notifications are a critical incident response mechanism. Routing them to a single personal email creates a single point of failure. If that person is unavailable, on vacation, or the email goes to spam, production incidents go unnoticed. This should be a team alias, Slack webhook, or PagerDuty integration.

---

### [MEDIUM] Finding #7: Evidence output silently drops when EVIDENCE_OUTPUT_FILE is unset

**File:** `backend/scripts/lib/evidence.ts`
**Lines:** 150-162
**Category:** `observability-gap`

**Description:**
The `writeEvidenceResult` function only writes to a file when `EVIDENCE_OUTPUT_FILE` is set. When unset, the evidence result is only written to stdout. In CI/CD or Lambda environments where stdout may be truncated or not captured, evidence data can be lost. There is no warning log when the env var is absent, and no metric tracking how many evidence runs completed successfully vs. failed to persist.

**Code:**
```ts
// backend/scripts/lib/evidence.ts:150-162
export const writeEvidenceResult = (input: EvidenceResult): EvidenceResult => {
  const normalized = normalizeEvidenceResult(input)
  const json = JSON.stringify(normalized, null, 2)

  const outFile = String(process.env.EVIDENCE_OUTPUT_FILE || '').trim()
  if (outFile) {
    const resolved = path.isAbsolute(outFile) ? outFile : path.join(process.cwd(), outFile)
    fs.writeFileSync(resolved, json + '\n', 'utf8')
  }

  process.stdout.write(json + '\n')
  return normalized
}
```

**Why this matters:**
Evidence packs are the audit trail for agent-driven operations. If evidence is only written to stdout and the calling process does not capture stdout to a durable store, the evidence is lost. No metric or alert fires for missing evidence artifacts.

---

### [MEDIUM] Finding #8: Alert corridor refresh job uses raw console output, bypassing structured logging pipeline

**File:** `backend/scripts/alert-corridor-refresh-job.ts`
**Lines:** 576-586
**Category:** `observability-gap`

**Description:**
When run as a standalone script (`require.main === module`), the alert-corridor-refresh-job uses `console.log` and `console.error` instead of the structured `createLogger` instance. These raw console calls bypass the JSON structured logging format, trace ID correlation, New Relic log forwarding, and sensitive field redaction. In contrast, the internal `runAlertCorridorRefreshJob` function correctly uses the structured logger.

**Code:**
```ts
// backend/scripts/alert-corridor-refresh-job.ts:576-586
if (require.main === module) {
  runAlertCorridorRefreshJob()
    .then(result => {
      console.log('Alert corridor refresh complete:', result)   // bypasses structured logger
      process.exit(0)
    })
    .catch(error => {
      console.error('Alert corridor refresh failed:', error)    // bypasses structured logger
      process.exit(1)
    })
}
```

**Why this matters:**
When this job runs as a Lambda function (via `alert-corridor-refresh-lambda.ts`), the Lambda wrapper likely calls `runAlertCorridorRefreshJob` directly, so the structured logger is used. But when run as a standalone ECS task or locally, the `require.main` path uses raw console which produces unstructured output that New Relic log parsers may not correctly ingest, making job failures harder to detect through log-based alerting.

---

### [MEDIUM] Finding #9: Tracing sample rate logic has a reset race that can lose error rate data

**File:** `backend/shared/tracing.ts`
**Lines:** 400-421
**Category:** `broken-logic`

**Description:**
The `shouldSampleTrace` function uses global mutable counters (`totalSpans`, `errorSpans`) to compute an error rate and adjust sampling. When `totalSpans > ERROR_RATE_WINDOW (100)`, the rate is calculated and then both counters are reset to 0. In a concurrent environment (multiple async operations), this reset creates a window where error rate is computed from a partial or stale sample, and immediately-following trace decisions use `errorRate = 0` until 100 more spans accumulate.

**Code:**
```ts
// backend/shared/tracing.ts:400-421
const shouldSampleTrace = (): boolean => {
  const sampleRate = resolveTraceSampleRate()
  if (Number.isFinite(sampleRate) && sampleRate >= 0 && sampleRate <= 1) {
    return Math.random() < sampleRate
  }

  if (totalSpans > ERROR_RATE_WINDOW) {
    errorRate = errorSpans / totalSpans
    totalSpans = 0    // reset
    errorSpans = 0    // reset -- next 100 decisions use stale errorRate
  }

  if (errorRate > 0.1) {
    return true       // always sample during errors
  }
  if (errorRate > 0.05) {
    return Math.random() < 0.5
  }
  return Math.random() < 0.1
}
```

**Why this matters:**
When `TRACE_SAMPLE_RATE` is not explicitly set (fallback path), the error-rate-adaptive sampling logic kicks in. The counter reset means that right after a high-error burst triggers 100% sampling, the counters reset and the next ~100 spans use the cached `errorRate` from the previous window. If the error burst ends quickly, the system continues to over-sample. If a new error burst starts, the first 100 spans under-sample. This is not dangerous but causes inconsistent trace coverage during incidents.

---

### [MEDIUM] Finding #10: New Relic verify-signals has no retry or backoff on NerdGraph API calls

**File:** `ops/newrelic/verify-signals.mjs`
**Lines:** 66-85
**Category:** `observability-gap`

**Description:**
The `gql` function in `verify-signals.mjs` (and all other New Relic scripts) makes a single HTTP request with no timeout, retry, or backoff. NerdGraph API calls can transiently fail (rate limits, 503, network hiccups). A transient failure during CI signal verification would cause a false-negative gate failure, blocking deployments.

**Code:**
```js
// ops/newrelic/verify-signals.mjs:66-85
const gql = async (query, variables = {}) => {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-Key': NEW_RELIC_USER_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`NerdGraph request failed: HTTP ${response.status}`)
  }
  // No retry, no timeout, no backoff
  ...
}
```

**Why this matters:**
The `verify-signals.mjs` script is used as a deployment gate. A transient NerdGraph failure would cause `process.exit(1)` and block a deploy. The `bootstrap-all.mjs` orchestrator runs tasks sequentially, so a transient failure in any of the 5 bootstrap scripts (dashboards, alerts, cloud links, workloads, notifications) aborts the entire bootstrap with no retry.

---

### [MEDIUM] Finding #11: Ops alerts queue worker does not record queue depth metrics

**File:** `backend/scripts/ops-alerts-queue-worker.ts`
**Lines:** 108-119
**Category:** `missing-alert`

**Description:**
The `alert-evaluation-worker` records queue depth metrics via `recordQueueDepthMetric` (line 111 of alert-evaluation-worker.ts), but the `ops-alerts-queue-worker` does not call `recordQueueDepthMetric` or `getQueueDepth` anywhere in its processing loop. This means the custom `RemitScout/Queues` queue depth metric for the ops-alerts queue is never emitted, relying solely on native AWS SQS CloudWatch metrics.

**Code:**
```ts
// backend/scripts/alert-evaluation-worker.ts:109-111 (has it)
const queueDepth = await getQueueDepth(queueUrl)
const queueName = resolveQueueName(queueUrl)
await recordQueueDepthMetric(queueName, queueDepth)

// backend/scripts/ops-alerts-queue-worker.ts:108-119 (missing)
logger.info('ops_alerts_worker_start', { batch_size: batchSize })
while (!shutdown.isShuttingDown()) {
  await applyJitter(logger, 'ops_alerts_queue_loop', loopJitterMs)
  const { messages, error: receiveError } = await receiveJsonMessages<OpsAlertsQueueMessage>(queueUrl, batchSize)
  // No getQueueDepth / recordQueueDepthMetric call
```

**Why this matters:**
Without custom queue depth metrics, the ops-alerts queue depth is only visible through native AWS SQS CloudWatch metrics. While those metrics exist, the custom `RemitScout/Queues` namespace is what the New Relic dashboard queries for unified queue health views. The ops-alerts queue will show a data gap in the "Queue Depth" widgets on the New Relic dashboard.

---

### [LOW] Finding #12: Observation session script uses embedded Python with unquoted shell expansion

**File:** `ops/observe-dev.sh`
**Lines:** 29-33
**Category:** `slop`

**Description:**
The `observe-dev.sh` script uses inline Python heredocs to parse JSON from `$SESSION_FILE`. The Python heredocs use `$SESSION_FILE` without escaping in the Python string, relying on shell expansion before Python sees it. If the path contains spaces or special characters, the Python `open()` call will fail silently (the `|| true` patterns elsewhere would mask this).

**Code:**
```bash
# ops/observe-dev.sh:29-33
BASE_URL="$(python3 - <<PY
import json
with open("$SESSION_FILE","r") as f:
  print(json.load(f).get("baseUrl","").strip())
PY
)"
```

**Why this matters:**
The current `SESSION_FILE` path (`ops/observation-session.json`) does not contain spaces, so this works today. But if the pattern is copied to a path with spaces, or if the repo is cloned into a directory with spaces, the observation script would fail to parse the session file and skip base URL resolution silently, causing health checks to be skipped.

---

### [LOW] Finding #13: dev-b2b-tier2-watch.sh has escaped quote corruption in plane_a_probe function

**File:** `ops/watch/dev-b2b-tier2-watch.sh`
**Lines:** 84-98
**Category:** `broken-logic`

**Description:**
The `plane_a_probe` function contains backslash-escaped double quotes within double-quoted shell variables (e.g., `\"$url\"`, `\"$resp\"`). This is a quoting error: inside `$(...)` command substitutions with double quotes, the backslash escapes produce literal backslashes before the variable names, causing the curl and printf commands to receive malformed arguments. The function would either fail or produce incorrect HTTP status detection.

**Code:**
```bash
# ops/watch/dev-b2b-tier2-watch.sh:84-98
plane_a_probe() {
  local label="$1"
  local url="$2"
  local resp status
  resp="$(curl -sS --max-time 15 -w $'\\n__HTTP_STATUS:%{http_code}__\\n' \"$url\" 2>/dev/null || true)"
  status="$(printf '%s' \"$resp\" | awk -F'__HTTP_STATUS:' 'NF>1{print $2}' | tr -d '_' | tr -d '\\n' | tail -n 1)"
  if [[ -z \"${status}\" ]]; then
    status=\"000\"
  fi
  if printf '%s' \"$resp\" | rg -q 'quotes_unavailable|collecting'; then
    echo \"${label}=status_${status}_collecting\"
  else
    echo \"${label}=status_${status}_ok\"
  fi
}
```

**Why this matters:**
This watch script is used for manual ops observation sessions. The quoting errors mean the Plane A health probes (healthz, readyz, providers endpoints) in the watch loop either fail silently or produce garbled output, making the 24-tick observation loop unreliable for detecting API issues during dev observation windows.

---

### [LOW] Finding #14: Bootstrap-all.mjs conditionally skips Cloud links without clear log marker for ops audit

**File:** `ops/newrelic/bootstrap-all.mjs`
**Lines:** 31-37
**Category:** `observability-gap`

**Description:**
The `bootstrap-all.mjs` script conditionally skips the Cloud links step if `NEW_RELIC_STAGING_AWS_ROLE_ARN` and `NEW_RELIC_PROD_AWS_ROLE_ARN` are not both set. It prints a message to console but does not exit non-zero or set any output variable that a CI gate could detect. A deployment pipeline using `bootstrap-all.mjs` could silently skip AWS Cloud link configuration with no failure signal, leaving New Relic AWS metric integrations un-configured.

**Code:**
```js
// ops/newrelic/bootstrap-all.mjs:31-37
if (process.env.NEW_RELIC_STAGING_AWS_ROLE_ARN && process.env.NEW_RELIC_PROD_AWS_ROLE_ARN) {
  tasks.push({ label: 'Cloud links', script: 'sync-cloud-links.mjs' })
} else {
  console.log(
    'Skipping Cloud links (set NEW_RELIC_STAGING_AWS_ROLE_ARN and NEW_RELIC_PROD_AWS_ROLE_ARN to enable)',
  )
}
```

**Why this matters:**
Without Cloud links, New Relic cannot pull AWS metrics for API Gateway, SQS, RDS, ElastiCache, etc. The entire "Platform Capacity" dashboard page in New Relic would be empty. The script exits 0 even when this critical configuration step is skipped, so CI would report success.
