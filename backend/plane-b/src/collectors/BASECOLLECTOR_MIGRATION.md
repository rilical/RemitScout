# BaseCollector Migration Guide

This guide explains how to migrate provider collectors to use the new `BaseCollector` abstract class.

## Overview

The `BaseCollector` class extracts ~70% of common collector logic, leaving only provider-specific fetch/parse methods to implement.

## Before (Current State)

Each provider collector (remitly, wise, worldremit, etc.) has ~800-1000 lines of duplicated code handling:
- Rate limiting
- Circuit breaking
- Error handling
- Bronze storage
- Quote persistence
- Anomaly detection
- Block detection
- Checkpoint/resume

## After (With BaseCollector)

Each provider collector only needs ~100-200 lines implementing:
- `fetchQuote()` - Provider-specific API fetch
- `parsePayload()` - Provider-specific payload parsing
- Optional: `extractMethodPairs()` - If provider returns multiple method pairs

## Migration Steps

### 1. Create Provider Collector Class

```typescript
import { BaseCollector } from '../../collectors/base-collector'
import type { CollectorRequest, FetchResult } from '../../collectors/types'
import type { NormalizedQuote } from '../../normalize/quote-normalizer'
import { fetchRemitlyQuote } from './fetch'
import { parseRemitlyPayload } from './parse'

export class RemitlyCollector extends BaseCollector {
  constructor(options: BaseCollectorOptions = {}) {
    super('remitly', 'Remitly', options)
    
    // Set provider-specific defaults
    this.delayMs = config.planeB.remitly.delayMs
    this.jitterMs = config.planeB.remitly.jitterMs
    this.rateLimitBackoffMs = config.planeB.remitly.rateLimitBackoffMs
    this.rateLimitJitterMs = config.planeB.remitly.rateLimitJitterMs
    this.rateLimitMaxRetries = config.planeB.remitly.rateLimitMaxRetries
    this.corridorDelayMs = config.planeB.remitly.corridorDelayMs
    this.corridorJitterMs = config.planeB.remitly.corridorJitterMs
    this.blockCooldownMs = config.planeB.remitly.blockCooldownMs
  }

  protected async fetchQuote(
    request: CollectorRequest,
    options: { jitterMs: number; proxyTier: ProxyTier },
  ): Promise<FetchResult> {
    return await fetchRemitlyQuote(request, options)
  }

  protected parsePayload(
    payload: unknown,
    request: CollectorRequest,
  ): NormalizedQuote | null {
    return parseRemitlyPayload(payload, request)
  }
}
```

### 2. Update Collector Function

```typescript
// Before: 800+ lines of orchestration code
export const runRemitlyCollector = async (options: RemitlyCollectorOptions = {}) => {
  // ... 800 lines of common logic ...
}

// After: Simple wrapper
export const runRemitlyCollector = async (options: RemitlyCollectorOptions = {}) => {
  const collector = new RemitlyCollector({ pool: options.pool })
  return await collector.collect({
    corridors: options.corridors,
    amountBuckets: options.amountBuckets,
    payinMethod: options.payinMethod ?? 'debit_card',
    payoutMethod: options.payoutMethod ?? 'bank_deposit',
    locale: options.locale ?? 'en-US',
    collectorType: options.collectorType ?? 'collector',
    freshnessSloMinutes: options.freshnessSloMinutes,
    freshnessSloEnabled: options.freshnessSloEnabled,
    rpmOverride: options.rpmOverride,
    perCorridorRpmOverride: options.perCorridorRpmOverride,
    defaultRpm: httpLimits.rpm,
    defaultPerCorridorRpm: httpLimits.perCorridorRpm,
  })
}
```

### 3. Extract Provider-Specific Logic

Move provider-specific logic to separate files:
- `fetch.ts` - API fetch logic
- `parse.ts` - Payload parsing logic
- `catalog.ts` - Amount buckets, supported corridors
- `limits.ts` - Rate limits, delays

## Benefits

1. **Code Reduction**: ~70% less code per provider
2. **Consistency**: All providers use same orchestration logic
3. **Maintainability**: Bug fixes in one place benefit all providers
4. **Testability**: Easier to test provider-specific logic in isolation
5. **New Providers**: Adding new providers is much faster

## Backward Compatibility

The old `runRemitlyCollector()` function signature is maintained, so existing code continues to work.

## Example: Remitly Collector Migration

See `backend/plane-b/src/providers/remitly/collector-base.ts` (to be created) for a complete example.

## Testing

After migration, verify:
1. Collection works identically to before
2. Checkpoints save/load correctly
3. Rate limiting works
4. Circuit breaking works
5. Block detection works
6. Bronze storage works
7. Quote persistence works


