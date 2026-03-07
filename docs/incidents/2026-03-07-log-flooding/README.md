# Incident: Log Flooding from Provider Block Alerts

**Date**: 2026-03-07 03:09:22-23 EST  
**Duration**: Ongoing (spam pattern)  
**Severity**: P3 (Operational noise, no customer impact)  
**Status**: Root cause identified, mitigation options documented

## Summary

The #logs Slack channel was flooded with 20+ duplicate block alert messages within 1-2 seconds when the paysend provider hit captcha blocks across multiple corridors simultaneously. This created operational noise and made it difficult to identify genuine issues.

## Impact

- **User Impact**: None (internal ops channel only)
- **Ops Impact**: High noise-to-signal ratio in #logs channel
- **Future Risk**: Any provider hitting blocks on multiple corridors will cause similar spam

## Root Cause

No deduplication, rate limiting, or aggregation logic in the ops alert routing system:

1. Each provider block detection triggers individual `insertOpsAlert()` + `notifyBlockAlert()` calls
2. `notifyBlockAlert()` sends each alert immediately to Slack with no dedup check
3. When paysend hit captcha on 20+ corridors, each generated a separate Slack message

**Code location**: `backend/plane-b/src/collectors/alert-routing.ts` (lines 114-207)

## Documentation

- **Full RCA**: [log-behavior-anomaly-rca.md](./log-behavior-anomaly-rca.md)
- **Quick Fix Guide**: [QUICK-FIX.md](./QUICK-FIX.md)
- **Flow Diagrams**: [alert-flow-diagram.md](./alert-flow-diagram.md)

## Resolution Options

### Option 1: Enable Queue Mode (Immediate, No Code Changes)

```bash
PLANE_B_OPS_ALERT_QUEUE_MODE=queue
```

**Effort**: 0 minutes (config change only)  
**Benefit**: Natural rate limiting via SQS batch processing  
**Status**: Recommended for immediate deployment

### Option 2: Add Redis Deduplication (Short-term)

Add deduplication by `provider_id + block_reason` with 5-minute window.

**Effort**: ~1 hour dev + testing  
**LOC**: ~15 lines  
**Benefit**: 95% reduction in duplicate alerts  
**Status**: Recommended for week 1

### Option 3: Full Aggregation (Long-term)

Batch similar alerts into summary messages.

**Effort**: ~3 hours dev + testing  
**LOC**: ~100 lines  
**Benefit**: Best UX, actionable insights  
**Status**: Recommended for week 2-3

## Timeline

- **2026-03-07 03:09:22-23 EST**: Initial spam incident (20+ paysend captcha alerts)
- **2026-03-07 12:58:44 EST**: User escalated to investigate
- **2026-03-07 13:05:00 EST**: Root cause identified, analysis complete
- **2026-03-07 13:06:49 EST**: Slack summary posted to #logs thread

## Follow-up Actions

- [ ] Deploy queue mode to staging (config change)
- [ ] Verify queue mode reduces spam in staging
- [ ] Deploy queue mode to prod
- [ ] Implement Redis deduplication (week 1)
- [ ] Implement full aggregation (week 2-3)
- [ ] Add unit tests for deduplication logic
- [ ] Add integration test simulating 20+ concurrent blocks
- [ ] Update monitoring: track `alert_deduplicated` log count

## Related Issues

- Similar pattern could occur with any provider (wise, remitly, etc.)
- Other alert types (not just blocks) may have similar lack of deduplication

## Lessons Learned

1. **Alert systems need deduplication** - Always add dedup for any multi-instance alert
2. **Queue mode is underutilized** - Existing queue mode config could have prevented this
3. **Correlated failures need aggregation** - Single provider failing on multiple corridors should generate 1 summary, not N individual alerts
