# Quick Fix - Ops Alert Flooding

## Immediate Mitigation (No Code Changes Required)

### Option 1: Enable Queue Mode for Ops Alerts

Set the ops alerts queue mode to `'queue'` to defer alert processing:

```bash
# In your environment config (staging/prod)
PLANE_B_OPS_ALERT_QUEUE_MODE=queue
PLANE_B_OPS_ALERT_QUEUE_URL=<your-ops-alerts-queue-url>
```

**How it works:**
- When `mode='queue'`, alerts are written to SQS instead of being sent immediately to Slack
- The `ops-alerts-queue-worker` processes alerts from the queue
- This provides a natural rate-limiting mechanism (queue batch processing)

**Current behavior** (from `backend/plane-b/src/collectors/alert-routing.ts:124-127`):
```typescript
if (config.queues.opsAlerts.mode === 'queue' && !options.force) {
  logger.info('alert_queue_mode_skip', { alert_id: alertId })
  return  // ← Skips immediate Slack notification
}
```

### Option 2: Disable Slack Webhook Temporarily

```bash
# Remove or comment out the webhook URL
ALERT_SLACK_WEBHOOK_URL=
```

**Trade-off**: You'll lose all real-time block alerts until fixed.

### Option 3: Rate Limit at Slack Level

Configure Slack webhook rate limits or create a filter to reduce noise.

## Medium-Term Fix (Minimal Code Changes)

### Add Simple Deduplication

Add a Redis-based deduplication check in `notifyBlockAlert()`:

```typescript
// backend/plane-b/src/collectors/alert-routing.ts

import { getRedisClient } from '../../../shared/redis'

const DEDUP_WINDOW_SECONDS = 300 // 5 minutes

export const notifyBlockAlert = async (
  pool: Pool,
  alertId: string,
  options: { force?: boolean } = {},
) => {
  // ... existing validation ...

  const event = await loadOpsAlertEvent(pool, alertId)
  if (!event) {
    logger.warn('alert_missing', { alert_id: alertId })
    return
  }

  // Add deduplication check
  if (!options.force) {
    const redis = await getRedisClient()
    const dedupKey = `alert:dedup:${event.provider_id}:${event.block_reason}`
    const exists = await redis.get(dedupKey)
    
    if (exists) {
      logger.info('alert_deduplicated', {
        alert_id: event.alert_id,
        provider_id: event.provider_id,
        reason: event.block_reason,
      })
      return  // Skip - similar alert sent recently
    }
    
    await redis.setex(dedupKey, DEDUP_WINDOW_SECONDS, '1')
  }

  // ... rest of existing logic ...
}
```

**Estimated LOC**: ~15 lines  
**Testing**: Unit test + manual test with paysend captcha scenario  
**Impact**: Reduces duplicate alerts by ~95% for correlated failures

## Why This Happened

See full RCA: `.cursor/analysis/log-behavior-anomaly-rca.md`

**TL;DR:**
1. Paysend hit captcha blocks on 20+ corridors at 03:09:22-23 EST
2. Each block triggered individual Slack message (no deduplication)
3. All 20+ messages sent within 1-2 seconds
4. Root cause: No deduplication, rate limiting, or aggregation logic

**Key code locations:**
- Alert routing: `backend/plane-b/src/collectors/alert-routing.ts`
- Block detection: `backend/plane-b/src/collectors/block-detection.ts`
- Paysend collector: `backend/plane-b/src/providers/paysend/collector.ts`

## Recommended Action

**Immediate**: Enable queue mode (`PLANE_B_OPS_ALERT_QUEUE_MODE=queue`)  
**Short-term**: Add Redis deduplication (~1 hour dev time)  
**Long-term**: Implement full aggregation + batching (see RCA)
