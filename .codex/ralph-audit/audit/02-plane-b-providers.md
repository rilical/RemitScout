# Plane B Collectors and Providers Deep Audit Findings

Audit Date: 2026-02-28T06:45:41Z  
Files Examined: 186  
Total Findings: 5

## Summary by Severity
- Critical: 1
- High: 3
- Medium: 1
- Low: 0

---

## Findings

### [CRITICAL] Finding #1: `parse_error` quotes are still persisted as successful records

**File:** `backend/plane-b/src/providers/pangea/parse.ts` (with persistence path in `backend/plane-b/src/providers/remitly/collector.ts`)  
**Lines:** `pangea/parse.ts:98-100,123-126`; `remitly/collector.ts:716-760`  
**Category:** broken-logic

**Description:**
Parser sets `parse_error` but still returns a quote object with fallback numeric zeros, and collectors persist parsed output without gating on `parse_flags`. This allows invalid/partial payloads to be written as successful normalized quotes, causing data-integrity corruption in Silver/Gold downstream.

**Code:**
```ts
// backend/plane-b/src/providers/pangea/parse.ts
if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
  flags.push(qualityFlags.parse_error)
}

return {
  send_amount: Number.isFinite(sendAmount) ? sendAmount : 0,
  receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
  // ...
  parse_flags: flags,
}
```

```ts
// backend/plane-b/src/providers/remitly/collector.ts
logger.debug('quote_parse_ok', { parse_flags: parsed.parse_flags })
// ...
const normalized = normalizeQuote({ /* ... */ parse_flags: parsed.parse_flags })
await persistNormalizedQuote(pool, normalized, collectorType)
```

**Why this matters:**
Invalid quotes can be treated as successful data points, polluting corridor rates, volatility signals, and export outputs.

---

### [HIGH] Finding #2: Checkpoint resume key is tied to new `ingestion_run_id`, making resume ineffective

**File:** `backend/plane-b/src/collectors/checkpoint.ts` (loaded by `backend/plane-b/src/collectors/base-collector.ts`)  
**Lines:** `checkpoint.ts:34,98-99`; `base-collector.ts:168-172,331-335`  
**Category:** broken-logic

**Description:**
Checkpoint records are keyed by `(provider_id, collector_type, ingestion_run_id)`. `base-collector` creates a fresh `ingestionRunId` each run and then loads checkpoint using that new ID, so interrupted previous-run checkpoint state is not found.

**Code:**
```ts
// backend/plane-b/src/collectors/checkpoint.ts
ON CONFLICT (provider_id, collector_type, ingestion_run_id)

WHERE provider_id = $1 AND collector_type = $2 AND ingestion_run_id = $3
```

```ts
// backend/plane-b/src/collectors/base-collector.ts
const checkpoint = await loadCheckpoint(
  this.pool,
  this.providerId,
  this.collectorType,
  this.ingestionRunId,
)
```

**Why this matters:**
Long-running sweep recovery is effectively broken; retries restart from scratch and increase provider/API pressure and backlog risk.

---

### [HIGH] Finding #3: Bucket slicing mutates global state and skips buckets in subsequent corridors after resume

**File:** `backend/plane-b/src/collectors/base-collector.ts`  
**Lines:** `184-190,201`  
**Category:** broken-logic

**Description:**
Resume logic slices `this.buckets` in place when resuming one corridor. That mutation persists for all later corridors, so earlier buckets may never be collected again in the same run.

**Code:**
```ts
if (checkpoint && checkpoint.lastCorridorId === corridorId) {
  const resumeFromBucket = checkpoint.lastAmountBucket ?? this.buckets[0]
  const bucketIndex = this.buckets.indexOf(resumeFromBucket)
  if (bucketIndex >= 0) {
    this.buckets = this.buckets.slice(bucketIndex)
  }
}

for (const amountBucket of this.buckets) {
```

**Why this matters:**
Creates silent coverage gaps and stale bucket data for corridors processed after resume point.

---

### [HIGH] Finding #4: Many provider collectors can return early without guaranteed cleanup/finalization

**File:** `backend/plane-b/src/providers/remitly/collector.ts`  
**Lines:** `305-309,829-853`  
**Category:** will-break

**Description:**
Collector returns early on paused provider before `pool.end()`/finalization and lacks outer `try/finally` protection around the full run. Any thrown runtime error before tail cleanup can leave connections open and ingestion runs unfinished. Pattern is repeated across multiple provider collectors (`mukuru`, `sendwave`, `xe`, `xoom`, `worldremit`, `paysend`, etc.).

**Code:**
```ts
const resumeStatus = await resumeProviderIfCooldownExpired(pool, providerId)
if (!resumeStatus.canCollect) {
  logger.warn('collector_paused', { reason: resumeStatus.reason })
  return false
}
```

```ts
await finishIngestionRun(pool, ingestionRunId, blocked ? 'blocked' : 'success', blockReason)

if (shouldClose) {
  await pool.end()
}
```

**Why this matters:**
Can cause leaked DB connections and inconsistent ingestion-run state under pause/error paths.

---

### [MEDIUM] Finding #5: Method fallback logic can misclassify payin/payout for unmatched requests

**File:** `backend/plane-b/src/providers/remitly/parse.ts`  
**Lines:** `146-181`  
**Category:** will-break

**Description:**
When no exact method pair match exists, parser degrades to partial match and finally `estimates[0]` with `partial_data`. This can classify quote under a method combination different from requested request dimensions, creating method/corridor attribution drift.

**Code:**
```ts
if (requestedPayout) {
  const match = estimates.find((item) => mapPayout(item.pay_out_method) === requestedPayout)
  if (match) {
    flags.push(qualityFlags.partial_data)
    return { estimate: match, parse_flags: flags }
  }
}

// ...
flags.push(qualityFlags.partial_data)
return { estimate: estimates[0], parse_flags: flags }
```

**Why this matters:**
Method-level analytics and eligibility filters become unreliable when quote attribution is silently coerced.