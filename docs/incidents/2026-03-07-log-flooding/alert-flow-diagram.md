# Ops Alert Flow - Current vs Proposed

## Current Flow (Causing Spam)

```
┌─────────────────────────────────────────────────────────────────┐
│ Paysend Collector Hits Captcha on 20 Corridors Simultaneously  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │ For each corridor (20 total):           │
        │  1. detectBlock() finds "captcha"       │
        │  2. insertOpsAlert() creates DB record  │
        │  3. notifyBlockAlert() sends to Slack   │
        └─────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
          ┌─────▼──────┐            ┌──────▼─────┐
          │  Corridor  │            │ Corridor   │    ... (18 more)
          │   FI-NZ    │            │   IT-DM    │
          └─────┬──────┘            └──────┬─────┘
                │                           │
                ▼                           ▼
         ┌────────────────────────────────────────┐
         │  Individual Slack Message #1           │
         │  :rotating_light: Block alert          │
         │  Provider: paysend                     │
         │  Corridor: FI-NZ-EUR-NZD               │
         │  Reason: keyword_captcha               │
         └────────────────────────────────────────┘
         
         ┌────────────────────────────────────────┐
         │  Individual Slack Message #2           │
         │  :rotating_light: Block alert          │
         │  Provider: paysend                     │
         │  Corridor: IT-DM-EUR-XCD               │
         │  Reason: keyword_captcha               │
         └────────────────────────────────────────┘
         
         ... (18 more identical messages)
         
         ❌ PROBLEM: 20 messages in 1-2 seconds!
```

## Proposed Flow #1 - Queue Mode (Immediate Fix)

```
┌─────────────────────────────────────────────────────────────────┐
│ Paysend Collector Hits Captcha on 20 Corridors Simultaneously  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │ For each corridor (20 total):               │
        │  1. detectBlock() finds "captcha"           │
        │  2. insertOpsAlert() creates DB record      │
        │  3. notifyBlockAlert() checks mode='queue'  │
        │     → SKIP immediate send, log instead      │
        └─────────────────────────────────────────────┘
                              │
                              ▼
                   ┌────────────────────┐
                   │  SQS Queue         │
                   │  (ops-alerts)      │
                   │                    │
                   │  ┌──────────────┐  │
                   │  │ Alert 1      │  │
                   │  │ Alert 2      │  │
                   │  │ ...          │  │
                   │  │ Alert 20     │  │
                   │  └──────────────┘  │
                   └────────┬───────────┘
                            │
                            ▼
                ┌─────────────────────────┐
                │ ops-alerts-queue-worker │
                │ Batch size: 10          │
                │ Processing rate: ~1/sec │
                └────────┬────────────────┘
                         │
                         ▼
              ┌───────────────────────┐
              │ Processes 10 at once  │
              │ Natural rate limiting │
              └───────────────────────┘
              
         ✅ BENEFIT: Built-in rate limiting via queue batching
```

## Proposed Flow #2 - Deduplication (Better Fix)

```
┌─────────────────────────────────────────────────────────────────┐
│ Paysend Collector Hits Captcha on 20 Corridors Simultaneously  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │ For each corridor (20 total):               │
        │  1. detectBlock() finds "captcha"           │
        │  2. insertOpsAlert() creates DB record      │
        │  3. notifyBlockAlert() checks Redis         │
        └─────────────────────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ Redis Dedup Check   │
                   │ Key: paysend:captcha│
                   └──────┬──────────────┘
                          │
              ┌───────────┴────────────┐
              │                        │
         Alert #1                  Alerts #2-20
         (New key)                 (Key exists)
              │                        │
              ▼                        ▼
    ┌──────────────────┐    ┌────────────────────┐
    │ Set Redis key    │    │ Skip - deduplicated│
    │ TTL: 5 minutes   │    │ Log: alert_dedup   │
    │ Send to Slack    │    └────────────────────┘
    └──────────────────┘
              │
              ▼
    ┌────────────────────────────────────┐
    │  Single Slack Message              │
    │  :rotating_light: Block alert      │
    │  Provider: paysend                 │
    │  Corridor: FI-NZ-EUR-NZD (first)   │
    │  Reason: keyword_captcha           │
    └────────────────────────────────────┘
    
    ✅ BENEFIT: Only 1 message instead of 20!
    ✅ 5-min window prevents spam for similar failures
```

## Proposed Flow #3 - Aggregation (Best Fix)

```
┌─────────────────────────────────────────────────────────────────┐
│ Paysend Collector Hits Captcha on 20 Corridors Simultaneously  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │ For each corridor (20 total):               │
        │  1. detectBlock() finds "captcha"           │
        │  2. insertOpsAlert() creates DB record      │
        │  3. aggregateAlert() adds to Redis set      │
        └─────────────────────────────────────────────┘
                              │
                              ▼
            ┌──────────────────────────────────┐
            │ Redis Aggregation                │
            │ Key: aggregate:paysend:captcha   │
            │                                  │
            │ Count: 20                        │
            │ Corridors: [FI-NZ, IT-DM, ...]   │
            │ Window: 60 seconds               │
            └────────┬─────────────────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │ Send on first alert OR    │
         │ every 10 alerts OR        │
         │ end of window             │
         └────────┬──────────────────┘
                  │
                  ▼
    ┌────────────────────────────────────────┐
    │  Aggregated Slack Message              │
    │  ⚠️  Provider block detected (paysend) │
    │  Count: 20 corridors                   │
    │  Corridors: FI-NZ, IT-DM, ES-JP, ...   │
    │            (+15 more)                  │
    │  HTTP: 497                             │
    │  Reason: keyword_captcha               │
    │  Time window: last 60 seconds          │
    └────────────────────────────────────────┘
    
    ✅ BENEFIT: Clear summary of correlated failures
    ✅ Actionable - shows scope of problem
    ✅ No spam - max 1 message per provider/reason
```

## Comparison

| Approach | Messages Sent | Dev Time | Benefits |
|----------|--------------|----------|----------|
| Current | 20 | - | ❌ Spams channel |
| Queue Mode | 20 (but slower) | 0 (config only) | ✅ Natural rate limiting |
| Deduplication | 1 | ~1 hour | ✅✅ Prevents duplicates |
| Aggregation | 1 (better format) | ~3 hours | ✅✅✅ Best UX + insights |

## Recommendation

**Immediate**: Enable queue mode (no code changes)  
**Week 1**: Add deduplication (quick win)  
**Week 2-3**: Full aggregation (best long-term solution)
