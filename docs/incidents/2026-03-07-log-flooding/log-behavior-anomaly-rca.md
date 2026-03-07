# Log Behavior Anomaly - Root Cause Analysis

**Date**: 2026-03-07  
**Branch**: `cursor/log-behavior-anomaly-0ece`  
**Incident Time**: 03:09:22-23 EST  
**Impact**: #logs Slack channel flooded with 20+ identical block alerts

## Summary

The #logs Slack channel was flooded with 20+ "Block alert" messages within 1-2 seconds, all from the paysend provider hitting captcha blocks across different corridors. This created noise and made it difficult to identify actual operational issues.

## What Happened

At 03:09:22-23 EST, the paysend provider hit captcha blocks on 20+ corridors simultaneously:
- All alerts showed `HTTP: 497`, `Reason: keyword_captcha`
- Each corridor (e.g., FI-NZ-EUR-NZD, IT-DM-EUR-XCD, ES-JP-EUR-JPY) generated a separate Slack message
- All messages arrived within 1-2 seconds
- Example alert fingerprints show distinct corridors but identical failure pattern

## Root Cause

### 1. **No Alert Deduplication**
**File**: `backend/plane-b/src/collectors/alert-routing.ts` (lines 114-207)

The `notifyBlockAlert()` function sends each alert individually to Slack with no deduplication logic:

```typescript
export const notifyBlockAlert = async (
  pool: Pool,
  alertId: string,
  options: { force?: boolean } = {},
) => {
  // ...loads alert from DB...
  
  if (slackConfigured) {
    try {
      await sendSlackAlert(text)  // ← Sends immediately, no dedup check
      results.slack = 'sent'
    } catch (error: unknown) {
      // ...error handling...
    }
  }
}
```

**Issues**:
- No check for recent similar alerts
- No Redis-based tracking of sent alerts
- No fingerprint-based deduplication window

### 2. **No Rate Limiting**
**File**: `backend/plane-b/src/collectors/alert-routing.ts` (lines 168-181)

Each Slack webhook call is independent with no rate limiting:

```typescript
const sendSlackAlert = async (text: string) => {
  const webhookUrl = config.alerts.slackWebhookUrl
  if (!webhookUrl) return false

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(webhookUrl, {  // ← No rate limit check
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: `:rotating_light: Block alert\n${text}`,
      }),
      signal: controller.signal,
    })
    // ...
  }
}
```

**Issues**:
- No max-alerts-per-minute limit
- No backoff or throttling
- No circuit breaker for Slack webhook failures

### 3. **No Alert Aggregation**
**File**: `backend/plane-b/src/collectors/alert-routing.ts` (lines 50-68)

Alerts are formatted and sent individually:

```typescript
const buildAlertText = (event: OpsAlertRecord, payload: OpsAlertPayload) => {
  const payinMethod = payload.payin_method ?? 'n/a'
  const payoutMethod = payload.payout_method ?? 'n/a'
  const collectorType = payload.collector_type ?? 'n/a'
  const traceId = payload.trace_id ?? event.request_id ?? 'n/a'
  const fingerprint = payload.request_fingerprint ?? 'n/a'
  return [
    `Provider block detected (${event.provider_id ?? 'unknown'}).`,
    `Corridor: ${event.corridor_id ?? 'unknown'}`,
    `Amount bucket: ${event.amount_bucket ?? 'n/a'}`,
    `Payin/Payout: ${payinMethod} -> ${payoutMethod}`,
    `HTTP: ${event.http_status ?? 'n/a'}`,
    `Reason: ${event.block_reason ?? 'unknown'}`,
    `Collector: ${collectorType}`,
    `Trace: ${traceId}`,
    `Fingerprint: ${fingerprint}`,
    `Alert ID: ${event.alert_id}`,
  ].join('\n')
}
```

**Issues**:
- No batching of related alerts (same provider + reason)
- No summary format like "paysend blocked on 20 corridors due to keyword_captcha"
- Each corridor gets full detail message

### 4. **Block Detection Trigger**
**File**: `backend/plane-b/src/collectors/block-detection.ts` (lines 11-25, 53-67)

The `detectBlock()` function scans response bodies for keywords including "captcha":

```typescript
const blockKeywords = [
  'captcha',  // ← Triggers on this keyword
  'access denied',
  'bot',
  'challenge',
  // ...
]

for (const keyword of blockKeywords) {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`\\b${escapedKeyword}\\b`, 'i')
  if (pattern.test(lowered)) {
    const reason = `keyword_${keyword.replace(/\s+/g, '_')}`
    return { blocked: true, reason }  // ← Returns "keyword_captcha"
  }
}
```

When paysend returned captcha pages across 20+ corridors, each triggered:
1. Block detection → `keyword_captcha`
2. Alert creation via `insertOpsAlert()`
3. Alert notification via `notifyBlockAlert()`
4. Individual Slack message

## Contributing Factors

### Paysend Collector Flow
**File**: `backend/plane-b/src/providers/paysend/collector.ts` (lines 455-501)

```typescript
const blockResult = detectBlock(fetchResult.status, fetchResult.bodyText)
if (blockResult.blocked) {
  const reason = blockResult.reason ?? 'blocked'
  const rateLimited = isRateLimit(blockResult.reason ?? null)
  blockCount += 1
  if (rateLimited) {
    rateLimitCount += 1
    applyRateLimitPenalty()
  }
  
  // ...insert ops alert...
  const alertId = await insertOpsAlert(pool, {
    providerId,
    corridorId,
    amountBucket,
    payinMethod,
    payoutMethod,
    httpStatus: fetchResult.status,
    blockReason: reason,
    bronzeObjectKey,
    collectorType,
    traceId,
    requestFingerprint,
  })
  
  const shouldAlert = !rateLimited || rateLimitRetries >= Math.max(rateLimitMaxRetries, 0)
  if (shouldAlert && alertId) {
    await notifyBlockAlert(pool, alertId)  // ← Called for each corridor
  }
}
```

**Why it flooded**:
- Paysend returned captcha responses for multiple corridors concurrently
- Each corridor block triggered `notifyBlockAlert()`
- `keyword_captcha` is not treated as a rate limit, so `shouldAlert` was true
- All alerts sent simultaneously

## Proposed Solutions

### 1. **Add Alert Deduplication** (High Priority)

Create a deduplication layer using Redis:

```typescript
// backend/plane-b/src/collectors/alert-deduplication.ts
import { getRedisClient } from '../../../shared/redis'

const DEDUP_WINDOW_SECONDS = 300 // 5 minutes

export const shouldSendAlert = async (
  providerId: string,
  blockReason: string,
): Promise<boolean> => {
  const redis = await getRedisClient()
  const key = `alert:dedup:${providerId}:${blockReason}`
  
  const exists = await redis.get(key)
  if (exists) {
    return false // Skip - similar alert sent recently
  }
  
  await redis.setex(key, DEDUP_WINDOW_SECONDS, '1')
  return true
}
```

Update `notifyBlockAlert()`:

```typescript
export const notifyBlockAlert = async (
  pool: Pool,
  alertId: string,
  options: { force?: boolean } = {},
) => {
  // ...existing validation...
  
  const event = await loadOpsAlertEvent(pool, alertId)
  if (!event) {
    logger.warn('alert_missing', { alert_id: alertId })
    return
  }
  
  // Add deduplication check
  if (!options.force) {
    const shouldSend = await shouldSendAlert(
      event.provider_id ?? 'unknown',
      event.block_reason ?? 'unknown',
    )
    if (!shouldSend) {
      logger.info('alert_deduplicated', {
        alert_id: event.alert_id,
        provider_id: event.provider_id,
        reason: event.block_reason,
      })
      return
    }
  }
  
  // ...existing slack/email logic...
}
```

### 2. **Add Alert Aggregation** (High Priority)

Batch similar alerts and send summaries:

```typescript
// backend/plane-b/src/collectors/alert-aggregation.ts
import { getRedisClient } from '../../../shared/redis'

const AGGREGATION_WINDOW_SECONDS = 60 // 1 minute

export const aggregateAlert = async (
  providerId: string,
  blockReason: string,
  corridorId: string,
): Promise<{ shouldSend: boolean; count: number; corridors: string[] }> => {
  const redis = await getRedisClient()
  const key = `alert:aggregate:${providerId}:${blockReason}`
  
  // Add corridor to set
  await redis.sadd(`${key}:corridors`, corridorId)
  await redis.expire(`${key}:corridors`, AGGREGATION_WINDOW_SECONDS)
  
  // Increment count
  const count = await redis.incr(key)
  await redis.expire(key, AGGREGATION_WINDOW_SECONDS)
  
  // Get all corridors
  const corridors = await redis.smembers(`${key}:corridors`)
  
  // Send aggregate alert if:
  // - First alert (count === 1), or
  // - Every 10 alerts, or
  // - At end of window (handled by scheduled job)
  const shouldSend = count === 1 || count % 10 === 0
  
  return { shouldSend, count, corridors }
}
```

Update alert text builder:

```typescript
const buildAggregateAlertText = (
  providerId: string,
  blockReason: string,
  httpStatus: number | null,
  count: number,
  corridors: string[],
) => {
  if (count === 1) {
    // Single alert - use existing format
    return buildAlertText(event, payload)
  }
  
  // Aggregate format
  const corridorList = corridors.slice(0, 5).join(', ')
  const remaining = corridors.length > 5 ? ` (+${corridors.length - 5} more)` : ''
  
  return [
    `⚠️ Provider block detected (${providerId})`,
    `Count: ${count} corridors`,
    `Corridors: ${corridorList}${remaining}`,
    `HTTP: ${httpStatus ?? 'n/a'}`,
    `Reason: ${blockReason}`,
    `Time window: last 60 seconds`,
  ].join('\n')
}
```

### 3. **Add Rate Limiting** (Medium Priority)

Implement per-provider alert rate limits:

```typescript
// backend/shared/config.ts
export const config = {
  // ...
  alerts: {
    // ...
    maxAlertsPerProviderPerMinute: 5,
    rateLimitEnabled: true,
  },
}
```

```typescript
// backend/plane-b/src/collectors/alert-rate-limiter.ts
import { getRedisClient } from '../../../shared/redis'
import { config } from '../../../shared/config'

export const checkAlertRateLimit = async (
  providerId: string,
): Promise<{ allowed: boolean; remaining: number }> => {
  if (!config.alerts.rateLimitEnabled) {
    return { allowed: true, remaining: -1 }
  }
  
  const redis = await getRedisClient()
  const key = `alert:ratelimit:${providerId}`
  const max = config.alerts.maxAlertsPerProviderPerMinute
  
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, 60) // 1 minute window
  }
  
  const allowed = count <= max
  const remaining = Math.max(0, max - count)
  
  return { allowed, remaining }
}
```

### 4. **Add Alert Summarization Job** (Low Priority)

Create a scheduled job to send periodic summaries:

```typescript
// backend/scripts/alert-summary-worker.ts
// Runs every 5 minutes, sends summaries of aggregated alerts
```

## Immediate Mitigation

For immediate relief without code changes:

1. **Adjust Slack Webhook Rate Limits**: Configure webhook to be less noisy
2. **Filter Alerts in Slack**: Create a channel filter/mute for block alerts
3. **Pause Paysend Collector**: If captcha blocks persist, temporarily disable paysend

## Testing Plan

1. **Unit Tests**: Test deduplication, aggregation, and rate limiting logic
2. **Integration Tests**: Simulate 20+ concurrent blocks and verify only 1-2 Slack messages sent
3. **Load Tests**: Verify Redis performance under high alert volume
4. **Manual Tests**: Trigger captcha blocks and verify aggregated messages

## Metrics to Monitor

After implementing fixes:

1. **Alert Deduplication Rate**: `alert_deduplicated` log count
2. **Alert Aggregation Count**: Average corridors per aggregate alert
3. **Slack Message Volume**: Messages/minute to #logs channel
4. **Redis Performance**: GET/SET latency for alert keys

## References

- Alert routing: `backend/plane-b/src/collectors/alert-routing.ts`
- Block detection: `backend/plane-b/src/collectors/block-detection.ts`
- Paysend collector: `backend/plane-b/src/providers/paysend/collector.ts`
- Ops alert repository: `backend/plane-b/src/repositories/implementations/ops-alert-repository.ts`
