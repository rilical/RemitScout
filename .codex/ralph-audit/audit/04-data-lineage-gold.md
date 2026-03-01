# Data Lineage & Gold Computation Deep Audit Findings

Audit Date: 2026-02-28T14:22:00Z
Files Examined: 28
Total Findings: 16

## Summary by Severity
- Critical: 2
- High: 5
- Medium: 6
- Low: 3

## Remediation Status (FIX-RS-004+)

| Finding | Status | Evidence |
|---|---|---|
| #1 SQL interpolation in `gold-indices-live` | fixed | `backend/scripts/gold-indices-live.ts`, `backend/tests/gold-indices-sql-regression.test.ts` |
| #2 Negative fee clamping corruption | fixed | `backend/plane-b/src/normalize/quote-normalizer.ts`, `backend/tests/quote-normalizer.test.ts` |
| #3 Pulse cache counter consistency | fixed | `backend/scripts/gold-pulse-cache-job.ts` |
| #4 SLO compliance semantics/alarm mismatch | fixed | `backend/shared/slo-tracker.ts`, `backend/tests/slo-tracker.test.ts` |
| #5 Dominance computed by quote volume | fixed | `backend/plane-c/src/services/gold-publisher.ts`, `backend/tests/publisher-gates.test.ts` |
| #6 Silver-read/Gold-write snapshot consistency | fixed | `backend/scripts/gold-indices-live.ts` (`snapshotUpperBound`) |
| #7 Numeric parser sign handling | fixed | `backend/plane-b/src/normalize/quote-normalizer.ts` |
| #8 `calculateTotalDebit` promo fallback | fixed | `backend/plane-b/src/normalize/quote-normalizer.ts` |
| #9 Gold publisher pool boundary mismatch | fixed | `backend/scripts/gold-publisher-job.ts` (Plane B read pool + Plane C write pool) |
| #10 Percentile off-by-one (small samples) | fixed | `backend/shared/slo-tracker.ts` (`aggregateSLOValue`) |
| #11 Reconciliation stale sentinel logic | fixed | `backend/scripts/gold-reconciliation-job.ts` |
| #12 FX job nullability conversion | fixed | `backend/scripts/gold-fx-rates-job.ts` |
| #13 Popular corridors clear+reinsert empty-set hazard | fixed | `backend/scripts/gold-popular-corridors-job.ts` |
| #14 Dead conditional in SLO threshold logic | fixed | `backend/shared/slo-tracker.ts` |
| #15 Provider-index bounds safety | fixed | `backend/plane-c/src/services/gold-publisher.ts` |
| #16 Gold-live delete-before-DLQ risk | fixed | `backend/scripts/gold-live-worker.ts`, `backend/tests/gold-live-worker.test.ts` |

---

## Findings

### [CRITICAL] Finding #1: SQL injection via string interpolation in gold-indices-live query builder

**File:** `backend/scripts/gold-indices-live.ts`
**Lines:** 37-491
**Category:** `security`

**Description:**
The `buildIndicesQuery()` function constructs SQL using template literal string interpolation for `weightModel`, `GLOBAL_WEIGHT_CORRIDOR_ID`, and `methodologyVersion` values. These originate from environment variables (`PROVIDER_WEIGHT_MODEL`, `INDICES_METHODOLOGY_VERSION`) and a constant. While the constant is safe, the two env-var-sourced values are interpolated directly into the SQL string without parameterization or sanitization. An attacker or misconfiguration that sets these env vars to a SQL injection payload (e.g., `'; DROP TABLE gold_export.cdp_daily; --`) would execute arbitrary SQL.

In contrast, `gold-indices-job.ts` passes these same values as parameterized query arguments (`$8`, `$9`, `$10`), which is the correct approach.

**Code:**
```ts
const buildIndicesQuery = () => `
WITH weight_snapshot AS (
  SELECT
    corridor_id,
    provider_id,
    weight,
    model_version,
    window_days,
    weight_confidence
  FROM gold.provider_weight_snapshot
  WHERE model_version = '${weightModel}'
),
corridor_weights AS (
  SELECT
    corridor_id,
    provider_id,
    weight,
    window_days,
    weight_confidence
  FROM weight_snapshot
  WHERE corridor_id <> '${GLOBAL_WEIGHT_CORRIDOR_ID}'
),
global_weights AS (
  SELECT
    provider_id,
    weight
  FROM weight_snapshot
  WHERE corridor_id = '${GLOBAL_WEIGHT_CORRIDOR_ID}'
),
// ... line 363:
    '${weightModel}'::text AS weighting_model
// ... line 391:
    '${methodologyVersion}'::text AS methodology_version
```

**Why this matters:**
This is a SQL injection vector. If the `PROVIDER_WEIGHT_MODEL` or `INDICES_METHODOLOGY_VERSION` environment variables contain malicious SQL, it will be executed directly on the Silver database. The batch job (`gold-indices-job.ts`) correctly uses parameterized queries for the same values, making this inconsistency clearly a bug rather than a design choice. This is the live/real-time code path triggered by SQS messages, meaning it runs frequently and with elevated trust.

---

### [CRITICAL] Finding #2: Negative fee amount clamped to zero silently corrupts derived cost metrics

**File:** `backend/plane-b/src/normalize/quote-normalizer.ts`
**Lines:** 252-257
**Category:** `data-integrity`

**Description:**
When `feeAmountParsed` is null and the fee is derived from `totalDebitParsed - sendAmountParsed`, the result is clamped to zero with `Math.max(derivedFee, 0)`. This means when a provider reports `total_debit < send_amount` (which can legitimately happen with promotional credits, cashback, or zero-fee-plus-margin models), the fee is silently set to 0 instead of being flagged as anomalous. This corrupts downstream cost_ratio, TEER, and RCI calculations in gold indices, because those formulas rely on `fee_amount` being accurate.

**Code:**
```ts
if (feeAmountParsed === null && totalDebitParsed !== null && sendAmountParsed !== null) {
    const derivedFee = totalDebitParsed - sendAmountParsed
    if (Number.isFinite(derivedFee)) {
      feeAmountParsed = Math.max(derivedFee, 0)  // Silently clamps negative to 0
    }
  }
```

**Why this matters:**
Negative derived fees indicate either a data quality issue or a promotional scenario. Both cases should be flagged with a quality flag (e.g., `partial_data` or a new `negative_fee_derived` flag) rather than silently clamped to zero. The zero-clamped fee flows into gold indices where `cost_ratio` is computed as `(fee_amount + ...) / send_amount`. A fee of 0 when the real cost structure is different produces incorrect RCI and TEER values that are published to gold exports and consumed by downstream clients.

---

### [HIGH] Finding #3: Race condition in pulse cache concurrent counter increment

**File:** `backend/scripts/gold-pulse-cache-job.ts`
**Lines:** 382, 407
**Category:** `broken-logic`

**Description:**
The `filtersProcessed` and `upserted` counters are incremented inside `runConcurrent` callbacks without synchronization. `runConcurrent` runs multiple async workers in parallel (up to `jobConcurrency = 5`), and `filtersProcessed += 1` / `upserted += 1` are not atomic operations in JavaScript's event loop when interleaved with `await`. While V8's single-threaded execution model means the `+=` itself won't corrupt, the real issue is that the count may be inaccurate if a `Promise.all` batch completes with rejected workers that are silently swallowed.

However, there is a more concrete problem: the `upserted` counter is shared across all concurrent workers in the `runConcurrent` call on line 387, but errors are caught per-entry (line 408-413) and the counter is only incremented on success. If the `retry` on line 390 throws after partial progress, the count is under-reported in the job completion log, making observability unreliable.

**Code:**
```ts
// Line 382:
filtersProcessed += 1

// Lines 385-414:
await runConcurrent(upsertEntries, jobConcurrency, async ([key, payload]) => {
  try {
    const payloadJson = serializeJson(payload)
    await retry(
      () => repo.upsertEntry({ key, payload: payloadJson }),
      { ... },
    )
    upserted += 1  // Line 407
  } catch (error) {
    logger.error('pulse_cache_upsert_failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    })
  }
})
```

**Why this matters:**
The `job_complete` log and the `recordJobComplete` metric report `entries_upserted` which may not reflect the actual number of entries written to the database. This makes it impossible to detect partial failures from metrics alone. The pulse cache is the data source for the frontend's Pulse feature, so silent data loss here means stale or missing visualizations for users.

---

### [HIGH] Finding #4: SLO compliance is binary (0 or 1), not a rolling ratio

**File:** `backend/shared/slo-tracker.ts`
**Lines:** 99-167
**Category:** `broken-logic`

**Description:**
`calculateSLOCompliance` returns either `1.0` (compliant) or `0.0` (breached) for each individual measurement. This is a point-in-time boolean, not a rolling compliance ratio. The metric name `slo_compliance_ratio` and the CloudWatch alarm on line 265 (`Statistic: 'Average'`) suggest that the intent is to track a rolling compliance window (e.g., "98% of measurements in the last 5 minutes met the SLO"). However, the actual implementation only ever emits 0 or 1, and the CloudWatch alarm threshold is set to the SLO threshold value (e.g., 900 seconds) rather than a compliance percentage. The alarm compares `slo_compliance_ratio` (which is 0 or 1) against `target.threshold` (which could be 900 for freshness), meaning the alarm will never fire because 0 < 900 is always true for `lower_is_better` direction.

**Code:**
```ts
const complianceRatio = compliant ? 1.0 : 0.0

// ...

// Line 258-261:
const comparisonOperator: ComparisonOperator =
  target.direction === 'lower_is_better' ? 'GreaterThanThreshold' : 'LessThanThreshold'

const threshold = target.direction === 'lower_is_better' ? target.threshold : target.threshold
```

**Why this matters:**
The CloudWatch alarm configuration is fundamentally broken. For `lower_is_better` SLOs (like `freshness_p95` with threshold 900 seconds), the alarm fires when the metric `slo_compliance_ratio` is `GreaterThanThreshold` (900). But the metric only ever has value 0 or 1, so it will never exceed 900. The alarm will never trigger, leaving SLO breaches completely undetected. Additionally, line 261 has a dead conditional -- `target.threshold` is assigned regardless of direction, making the ternary meaningless.

---

### [HIGH] Finding #5: Publisher gates use quote count share, not provider diversity for dominance

**File:** `backend/plane-c/src/services/gold-publisher.ts`
**Lines:** 84-97
**Category:** `broken-logic`

**Description:**
The `topProviderShare` and `topTwoShare` metrics are computed based on quote count proportions rather than rate diversity. A provider that submits many quotes within the 4-hour window (e.g., due to frequent polling) will have a high share even if the market has many independent providers. The dominance gate (`top_provider_share > 0.5`) is meant to prevent a single provider from dominating the published rate, but it measures data volume dominance, not rate influence dominance.

**Code:**
```ts
if (providerCount > 0 && result.rows.length > 0) {
  const topProviderQuotes = providerRates.get(sortedProviders[0])?.length || 0
  topProviderShare = topProviderQuotes / result.rows.length  // Quote count, not rate weight

  if (providerCount >= 2) {
    const topTwoQuotes =
      (providerRates.get(sortedProviders[0])?.length || 0) +
      (providerRates.get(sortedProviders[1])?.length || 0)
    topTwoShare = topTwoQuotes / result.rows.length
  }
}
```

**Why this matters:**
The published `avg_rate` in `gold_export.corridor_rates` is a simple arithmetic mean of all quote rows (line 73), which means providers with more quotes have proportionally more influence on the published rate. A provider that polls 10x more frequently than others will contribute 10x more to the average while potentially passing the dominance gate (if its 10 quotes out of 15 total = 66% > 50% threshold). This creates a vector for rate manipulation through polling frequency rather than genuine market coverage.

---

### [HIGH] Finding #6: `gold-indices-live` reads from Silver but writes to Gold without transactional consistency

**File:** `backend/scripts/gold-indices-live.ts`
**Lines:** 630-744
**Category:** `data-integrity`

**Description:**
`upsertGoldIndicesLive` reads index computation data from the Silver pool and writes the results to the Gold pool. These are separate database connections (possibly separate databases). The SELECT from Silver and the INSERT INTO Gold are not wrapped in any form of distributed transaction or consistency check. If the Silver data changes between the SELECT and the INSERT (e.g., new quotes arrive), the Gold data may reflect a snapshot that never actually existed. More critically, if the Gold upsert fails partway through the bulk insert, some corridors will have updated indices while others retain stale data, creating a temporal inconsistency in `gold_export.cdp_daily`.

**Code:**
```ts
const selectResult = await query<IndicesRow>(selectQuery, params, silverPool)
// ... no consistency boundary ...
const upsertResult = await query<{ count: number }>(
  upsertQuery,
  [ dates, corridorIds, ... ],
  goldPool,  // Different pool/connection
)
```

**Why this matters:**
The `gold_export.cdp_daily` table is the source for RCI, RVI, and TEER indices shown to API consumers. If partial updates create inconsistencies (e.g., corridor A updated with today's rates, corridor B still shows yesterday's), downstream comparisons between corridors become unreliable. The reconciliation job (`gold-reconciliation-job.ts`) acts as a safety net but only runs every 10-15 minutes, leaving a window where consumers see inconsistent data.

---

### [HIGH] Finding #7: `parseNumeric` regex strips sign characters from middle of string

**File:** `backend/plane-b/src/normalize/quote-normalizer.ts`
**Lines:** 106-119
**Category:** `data-integrity`

**Description:**
The `parseNumeric` function uses the regex `/[^0-9.+-Ee]/g` to clean string values before parsing. This regex allows `+`, `-`, `.`, `E`, and `e` anywhere in the string. Consider the input `"$1,234.56"` -- after cleaning: `"1234.56"` (correct). But consider `"1.234.56"` (European formatting where `.` is thousands separator) -- after cleaning: `"1.234.56"`, which `Number()` parses as `NaN`. More critically, input like `"100-200"` (a range) would become `"100-200"`, parsed as `NaN`. The regex also allows inputs like `"--5"` or `"5+3"` which would produce `NaN`.

However, the most dangerous case is with the `E/e` allowance: an input like `"1e308"` would parse to `Infinity`, but this is correctly caught by the `Number.isFinite` check. The real problem is `"1e3"` parsing to `1000` when the original value was meant to be the literal string `"1e3"` from a provider's response. This silently converts a bad value into an incorrect numeric.

**Code:**
```ts
const parseNumeric = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.+-Ee]/g, '').trim()
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
```

**Why this matters:**
This function processes all core financial fields: `send_amount`, `fee_amount`, `receive_amount`, `total_debit_amount`, promotional amounts, and delivery times. A lenient parse that converts unexpected formats into incorrect numerics (rather than returning `null`) means corrupted financial data flows into Silver storage and eventually into Gold indices. The `isFinite` check catches `Infinity` and `NaN` but not "valid numbers that are wrong" -- for example, `"$1.234,56"` (1,234.56 in European format) becomes `1.23456`, silently losing three orders of magnitude.

---

### [MEDIUM] Finding #8: `calculateTotalDebit` uses promotional fee instead of regular fee in fallback

**File:** `backend/plane-b/src/normalize/quote-normalizer.ts`
**Lines:** 161-174
**Category:** `broken-logic`

**Description:**
When no explicit `totalDebitAmount` is provided, the fallback calculation uses `promotionalFeeAmount ?? feeAmount`. This means if a promotional fee is available, the total debit is calculated as `sendAmount + promotionalFeeAmount`, not `sendAmount + feeAmount`. This is conceptually correct if the promotional fee is the actual fee charged, but the caller at line 305-310 passes `promotionalFeeAmount` which comes from `parseNumeric(input.promotional_fee_amount)`. If a provider reports both a regular fee and a promotional fee, the total debit will use the promotional fee, potentially understating the actual cost for comparison purposes.

**Code:**
```ts
const calculateTotalDebit = (
  totalDebitAmount: number | null | undefined,
  sendAmount: number,
  feeAmount: number,
  promotionalFeeAmount: number | null,
): number => {
  if (Number.isFinite(totalDebitAmount ?? Number.NaN)) {
    return Number(totalDebitAmount)
  }
  if (isFiniteNumber(sendAmount) && isFiniteNumber(feeAmount)) {
    return sendAmount + (promotionalFeeAmount ?? feeAmount)
  }
  return 0
}
```

**Why this matters:**
The total_debit_amount is stored in Silver and used by downstream analytics. If it consistently uses promotional fees, comparisons between providers where one has promotions and another does not become skewed. The field name `total_debit_amount` implies the total debited from the sender's account, which should be based on the actual fee charged (which might be the promotional fee), but the intent is ambiguous and there is no quality flag set to indicate which fee was used.

---

### [MEDIUM] Finding #9: Gold publisher batch job connects to planeCUrl but batch-only publisher reads from Silver

**File:** `backend/scripts/gold-publisher-job.ts`
**Lines:** 128-129
**Category:** `broken-logic`

**Description:**
The batch gold publisher job creates a pool using `config.db.planeCUrl` (line 128) and passes it to `GoldPublisher`. However, `GoldPublisher.aggregateCorridorData()` queries `silver.quote_record`, `silver.ingestion_run`, `silver.rights_matrix`, and `silver.provider_corridor_capability` -- all Silver schema tables. If `planeCUrl` points to a different database or a database without the Silver schema, the queries will fail. The live publisher (`GoldPublisherLive`) correctly uses separate `silverPool` and `goldPool`, but the batch publisher uses a single pool for both reads (Silver) and writes (Gold).

**Code:**
```ts
// gold-publisher-job.ts line 128:
pool = createPool(config.db.planeCUrl)
const publisher = new GoldPublisher(pool)

// GoldPublisher.aggregateCorridorData queries:
// FROM silver.quote_record qr
// JOIN silver.ingestion_run ir ...
// JOIN silver.rights_matrix rm ...
// AND then publishToGoldExport writes to gold_export.corridor_rates
```

**Why this matters:**
This works only if `planeCUrl` points to a database that has both Silver and Gold schemas. If the architecture ever separates these into distinct databases (which the separate pool pattern in GoldPublisherLive suggests is the intended direction), the batch publisher will break. Currently this is a latent defect that constrains the deployment topology.

---

### [MEDIUM] Finding #10: SLO tracker `aggregateSLOValue` percentile computation has off-by-one for small arrays

**File:** `backend/shared/slo-tracker.ts`
**Lines:** 195-217
**Category:** `broken-logic`

**Description:**
The `aggregateSLOValue` function computes percentiles using `Math.floor(sorted.length * percentile)`. For small arrays, this produces incorrect results. For example, with 1 element: `Math.floor(1 * 0.95) = 0`, which returns `sorted[0]` -- correct. With 2 elements: `Math.floor(2 * 0.95) = 1`, returning `sorted[1]` -- which is the max, not the 95th percentile. With 10 elements: `Math.floor(10 * 0.95) = 9`, returning `sorted[9]` -- which is the max (index 9 of 10 elements). The p95 should be interpolated, not the ceiling index. This means p95 always returns the maximum value for arrays with fewer than 20 elements, making the SLO tracking overly pessimistic.

**Code:**
```ts
export const aggregateSLOValue = (
  values: number[],
  percentile: Percentile = 'p95',
): number => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  let index: number
  switch (percentile) {
    case 'p50':
      index = Math.floor(sorted.length * 0.5)
      break
    case 'p95':
      index = Math.floor(sorted.length * 0.95)
      break
    case 'p99':
      index = Math.floor(sorted.length * 0.99)
      break
  }
  return sorted[Math.min(index, sorted.length - 1)]
}
```

**Why this matters:**
SLO values like `freshness_p95` are computed using this function. With typical batch sizes of 5-15 corridors, p95 will always equal the maximum value, triggering false SLO breaches. This creates alert fatigue and makes the SLO metric unreliable for capacity planning. The function should use linear interpolation (the "exclusive" method) for small sample sizes.

---

### [MEDIUM] Finding #11: Reconciliation job stale corridor query uses epoch-since-1970 as sentinel

**File:** `backend/scripts/gold-reconciliation-job.ts`
**Lines:** 119-131
**Category:** `data-integrity`

**Description:**
The `findStaleCorridors` query uses `COALESCE(gr.gold_updated_at, '1970-01-01'::timestamptz)` as a sentinel for corridors that have never been published to Gold. This means every corridor that has Silver data but has never had a Gold export will always appear as "stale" with a lag of ~56 years. While this correctly triggers backfill, it also means the reconciliation job will attempt to process ALL never-exported corridors every run, potentially overwhelming the system. The `LIMIT $2` (default 500) provides some protection, but these never-exported corridors will always sort to the top of the stale list (due to `ORDER BY GREATEST(...)  DESC`), starving genuinely stale corridors that have been exported before.

**Code:**
```sql
WHERE COALESCE(gr.gold_updated_at, '1970-01-01'::timestamptz) < s.silver_updated_at - ($1 * INTERVAL '1 minute')
   OR COALESCE(gi.gold_updated_at, '1970-01-01'::timestamptz) < s.silver_updated_at - ($1 * INTERVAL '1 minute')
ORDER BY GREATEST(
  EXTRACT(EPOCH FROM (s.silver_updated_at - COALESCE(gr.gold_updated_at, '1970-01-01'::timestamptz))),
  EXTRACT(EPOCH FROM (s.silver_updated_at - COALESCE(gi.gold_updated_at, '1970-01-01'::timestamptz)))
) DESC
LIMIT $2
```

**Why this matters:**
In a bootstrapping scenario (new corridors being added), the reconciliation job will be stuck processing never-exported corridors and may never get to corridors that have a genuine 15-minute lag. This creates a priority inversion where new corridors crowd out stale-but-previously-working corridors. A separate "initial export" path or a different ordering strategy (e.g., prioritize corridors that have been exported before but are now stale) would be more resilient.

---

### [MEDIUM] Finding #12: Gold FX rates job `toNumber` returns `number | null` but callers assume non-null

**File:** `backend/scripts/gold-fx-rates-job.ts`
**Lines:** 35-38, 159-161
**Category:** `missing-guard`

**Description:**
The `toNumber` function in gold-fx-rates-job.ts has a return type of `number | null` (fallback parameter is `number | null`). At line 159-161, `rate` is checked for truthiness (`!rate || rate <= 0`), which correctly handles null. But `providerCount` and `sampleCount` at lines 160-161 use `toNumber(row.provider_count, null)` and are then passed as `providerCount ?? undefined`. If the DB returns `null` for `provider_count`, this results in `undefined` being passed to `repo.upsertRate()`. Whether this causes an issue depends on the repository implementation, but the inconsistent null handling (some callers use `?? 300` fallback, this one uses `null`) suggests a missing guard.

**Code:**
```ts
const toNumber = (value: string | number | null | undefined, fallback: number | null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

// Line 159-161:
const rate = toNumber(row.rate, null)
const providerCount = toNumber(row.provider_count, null)
const sampleCount = toNumber(row.sample_count, null)

// Line 186-187:
providerCount: providerCount ?? undefined,
sampleCount: sampleCount ?? undefined,
```

**Why this matters:**
FX rates stored without provider count or sample count metadata lose their statistical significance context. Downstream consumers cannot distinguish between "rate computed from 1 provider" and "rate computed from 10 providers" if the count is undefined. This affects the reliability weighting in gold indices where `mid_market_rate` from `gold.fx_rates` is used.

---

### [MEDIUM] Finding #13: Popular corridors job uses `clearAll()` then bulk insert without guard for empty valid set

**File:** `backend/scripts/gold-popular-corridors-job.ts`
**Lines:** 176-226
**Category:** `data-integrity`

**Description:**
The popular corridors job wraps the update in a transaction that first calls `txRepo.clearAll()` (line 176), then inserts only `valid` rows (line 184). If all rows fail validation (all routes are invalid), the transaction will COMMIT with an empty `gold.popular_corridors` table. The `valid.length > 0` check prevents the INSERT but not the COMMIT, so the table is wiped clean. While the check at line 164-169 handles zero total rows, it does not handle the case where rows exist but all are invalid.

**Code:**
```ts
await client.query('BEGIN')
try {
  await txRepo.clearAll()  // Deletes all existing rows

  const valid = rows.filter((row) => {
    if (isValidRoute(row.route)) return true
    logger.warn('invalid_route_format', { route: row.route })
    return false
  })

  if (valid.length > 0) {
    // Bulk insert...
    inserted = valid.length
  }
  // If valid.length === 0, we still commit with an empty table!

  await client.query('COMMIT')
```

**Why this matters:**
If all routes suddenly fail validation (e.g., due to a schema change in the aggregation query), the `gold.popular_corridors` table will be completely emptied. The frontend's popular corridors feature would show no data. A guard like `if (valid.length === 0) { await client.query('ROLLBACK'); return; }` would prevent this data loss scenario.

---

### [LOW] Finding #14: Dead conditional in SLO CloudWatch alarm threshold assignment

**File:** `backend/shared/slo-tracker.ts`
**Lines:** 261
**Category:** `slop`

**Description:**
The threshold assignment on line 261 has a conditional that always resolves to the same value regardless of direction. Both branches of the ternary return `target.threshold`.

**Code:**
```ts
const threshold = target.direction === 'lower_is_better' ? target.threshold : target.threshold
```

**Why this matters:**
This is dead code that obscures intent. It suggests the author intended different threshold calculations for different directions (perhaps adjusting the threshold for the alarm), but the implementation does nothing. Combined with Finding #4 (the alarm metric mismatch), this makes the entire alarm creation function non-functional.

---

### [LOW] Finding #15: `sortedProviders[0]` and `sortedProviders[1]` accessed without bounds check

**File:** `backend/plane-c/src/services/gold-publisher.ts`
**Lines:** 88, 93-94
**Category:** `missing-guard`

**Description:**
`sortedProviders[0]` is used as a Map key without checking that `sortedProviders` is non-empty (though the outer `if (providerCount > 0)` guards this). `sortedProviders[1]` is used inside `if (providerCount >= 2)`, which is also correct. However, the `?.length || 0` fallback pattern means that if the Map lookup returns `undefined` (theoretically impossible given the construction), the share would be 0 rather than flagging an error. This is a defensive-but-opaque pattern.

The same pattern exists in `gold-publisher-live.ts` lines 98-110.

**Code:**
```ts
const topProviderQuotes = providerRates.get(sortedProviders[0])?.length || 0
topProviderShare = topProviderQuotes / result.rows.length

if (providerCount >= 2) {
  const topTwoQuotes =
    (providerRates.get(sortedProviders[0])?.length || 0) +
    (providerRates.get(sortedProviders[1])?.length || 0)
  topTwoShare = topTwoQuotes / result.rows.length
}
```

**Why this matters:**
The `|| 0` fallback masks potential inconsistencies between `providerAverages` (which determines `sortedProviders`) and `providerRates` (which is queried for quote counts). If these Maps ever diverge (e.g., due to a refactor), the dominance metrics would silently become zero, causing the gate to always pass.

---

### [LOW] Finding #16: Gold live worker deletes messages on partial failure before DLQ send may complete

**File:** `backend/scripts/gold-live-worker.ts`
**Lines:** 460-492
**Category:** `missing-guard`

**Description:**
When a batch processing result indicates partial failure (line 460-500), the worker sends failed messages to the DLQ and then deletes them from the main queue. However, the `sendToDLQ` calls are awaited sequentially inside a `for` loop, and the `deleteMessages` call at line 488 deletes all receipt handles in the batch. If `sendToDLQ` fails for one message (e.g., DLQ is full or permissions issue), the message is still deleted from the main queue, resulting in message loss.

**Code:**
```ts
} else {
  await recordWorkerMetric('gold-live-worker', 'message_failed', batch.receiptHandles.length)

  const err = new Error(...)

  for (const message of messages.filter((m) => batch.receiptHandles.includes(m.receiptHandle))) {
    await sendToDLQ(queueUrl, message, err, { ... })  // May fail
    await recordWorkerMetric('gold-live-worker', 'dlq_sent', 1)
  }
  // Deletes ALL messages regardless of DLQ send success:
  const { failed } = await deleteMessages(queueUrl, batch.receiptHandles)
```

**Why this matters:**
SQS message deletion after a failed DLQ write means the message is permanently lost. The visibility timeout would eventually return the message to the queue if not deleted, providing a natural retry. By aggressively deleting, the worker removes this safety net. In practice, DLQ failures are rare, but when they occur (e.g., during an AWS outage), data loss is permanent.
