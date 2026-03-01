# Research Gap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the 3 actionable gaps between Remit-Scout research docs and the production codebase (P2, P4, P5 from the gap analysis).

**Architecture:** Each feature is a standalone addition that plugs into existing pipelines. P2 extends quote normalization, P4 adds an ablation mode to gold indices, P5 adds residual tracking to the gold export pipeline. All follow existing patterns (vitest, TypeScript, SQL migrations, gold_export schema).

**Excluded:** P1 (SmartSend already covers it), P3 (synthetic weights are safe from circularity), P6 (architecture ready, will onboard crypto data sources later).

**Tech Stack:** TypeScript, vitest, Aurora Postgres (SQL migrations), existing shared utilities

**Companion doc:** `docs/plans/2026-03-01-research-vs-implementation-gap-analysis.md`

---

## Task 1: Quote Executability Validation (P2)

**Context:** The EDV research doc (Identification Assumption IA1) requires that captured quotes be labeled as executable or non-executable. Currently, promotional teasers and real quotes are treated identically, which can bias TEER.

**Files:**
- Modify: `backend/plane-b/src/normalize/quote-normalizer.ts`
- Modify: `backend/plane-b/src/normalize/quality-flags.ts`
- Test: `backend/tests/quote-normalizer.test.ts`

### Step 1: Add quality flag for non-executable quotes

Add a new quality flag `promotional_teaser` to the quality flags module.

**File:** `backend/plane-b/src/normalize/quality-flags.ts`

Add to the existing flags list:
```typescript
promotional_teaser    // Quote uses a promotional rate that diverges significantly from derived rate
```

### Step 2: Write failing test for executability detection

**File:** `backend/tests/quote-normalizer.test.ts`

```typescript
describe('executability detection', () => {
  it('flags quote as promotional_teaser when promotional_rate diverges > 2% from derived rate', () => {
    const input = {
      provider_id: 'test-provider',
      corridor_id: 'USA-IND',
      send_amount: 1000,
      fee_amount: 5,
      receive_amount: 83000,
      promotional_rate: 90.0,  // ~8.4% higher than derived (83000/1000 = 83.0)
      base_rate: 83.0,
      bronze_object_key: 'test-key',
      ingestion_run_id: 'test-run',
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      collected_at: new Date().toISOString(),
    }
    const result = normalizeQuote(input)
    expect(result.quality_flags).toContain('promotional_teaser')
  })

  it('does not flag when promotional_rate is within 2% of derived rate', () => {
    const input = {
      provider_id: 'test-provider',
      corridor_id: 'USA-IND',
      send_amount: 1000,
      fee_amount: 5,
      receive_amount: 83000,
      promotional_rate: 83.5,  // 0.6% above derived (83.0)
      base_rate: 83.0,
      bronze_object_key: 'test-key',
      ingestion_run_id: 'test-run',
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      collected_at: new Date().toISOString(),
    }
    const result = normalizeQuote(input)
    expect(result.quality_flags).not.toContain('promotional_teaser')
  })

  it('does not flag when no promotional_rate is present', () => {
    const input = {
      provider_id: 'test-provider',
      corridor_id: 'USA-IND',
      send_amount: 1000,
      fee_amount: 5,
      receive_amount: 83000,
      bronze_object_key: 'test-key',
      ingestion_run_id: 'test-run',
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      collected_at: new Date().toISOString(),
    }
    const result = normalizeQuote(input)
    expect(result.quality_flags).not.toContain('promotional_teaser')
  })
})
```

### Step 3: Run test to verify it fails

```bash
cd backend && npx vitest run tests/quote-normalizer.test.ts -t "executability detection"
```
Expected: FAIL - `promotional_teaser` flag not produced

### Step 4: Implement executability detection in normalizer

**File:** `backend/plane-b/src/normalize/quote-normalizer.ts`

Add after the existing promotional rate handling (around line 359), before the return statement:

```typescript
// Executability check: flag promotional teasers that diverge from derived rate
const PROMOTIONAL_DIVERGENCE_THRESHOLD = 0.02 // 2%
if (promotionalRate !== null && derivedRate > 0) {
  const divergence = Math.abs(promotionalRate - derivedRate) / derivedRate
  if (divergence > PROMOTIONAL_DIVERGENCE_THRESHOLD) {
    flags.add('promotional_teaser')
  }
}
```

### Step 5: Run test to verify it passes

```bash
cd backend && npx vitest run tests/quote-normalizer.test.ts -t "executability detection"
```
Expected: PASS

### Step 6: Add gold indices filtering for promotional teasers

**File:** `backend/scripts/gold-indices-job.ts`

In the main SQL query where quotes are filtered for RCI/TEER computation, add a condition to exclude promotional teasers:

```sql
AND NOT (l.quality_flags @> ARRAY['promotional_teaser']::text[])
```

This ensures TEER and RCI calculations only use executable quotes.

### Step 7: Commit

```bash
git add backend/plane-b/src/normalize/quality-flags.ts \
       backend/plane-b/src/normalize/quote-normalizer.ts \
       backend/tests/quote-normalizer.test.ts \
       backend/scripts/gold-indices-job.ts
git commit -m "feat: add promotional_teaser quality flag for quote executability (P2)"
```

---

## Task 2: Signal Layer Ablation Tooling (P4)

**Context:** The Validation Agenda (E2) requires ablation testing: remove each signal layer and measure TEER/RVI/RCI stability. This reveals redundancy, circular dependencies, and marginal contribution of each layer.

**Files:**
- Create: `backend/scripts/ablation-study.ts`
- Test: `backend/tests/ablation-study.test.ts`

### Step 1: Write failing test for ablation computation

**File:** `backend/tests/ablation-study.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { computeAblationImpact } from '../scripts/ablation-study'

describe('ablation impact computation', () => {
  it('returns zero impact when removing a layer that contributes nothing', () => {
    const baseline = { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }
    const ablated = { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }
    const result = computeAblationImpact('test_layer', baseline, ablated)
    expect(result.teerDeltaPct).toBeCloseTo(0, 2)
    expect(result.rciDeltaBps).toBeCloseTo(0, 2)
    expect(result.marginalContribution).toBe('none')
  })

  it('returns high impact when removing a critical layer', () => {
    const baseline = { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }
    const ablated = { teer: 80.0, rci_median_bps: 300, rvi_bps: 50 }
    const result = computeAblationImpact('critical_layer', baseline, ablated)
    expect(result.teerDeltaPct).toBeGreaterThan(1.0)
    expect(result.marginalContribution).toBe('high')
  })

  it('returns moderate impact for intermediate changes', () => {
    const baseline = { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }
    const ablated = { teer: 83.0, rci_median_bps: 165, rvi_bps: 23 }
    const result = computeAblationImpact('moderate_layer', baseline, ablated)
    expect(result.marginalContribution).toBe('moderate')
  })
})
```

### Step 2: Run test to verify it fails

```bash
cd backend && npx vitest run tests/ablation-study.test.ts
```
Expected: FAIL

### Step 3: Implement ablation impact computation

**File:** `backend/scripts/ablation-study.ts`

```typescript
export interface IndexSnapshot {
  teer: number
  rci_median_bps: number
  rvi_bps: number
}

export interface AblationResult {
  layerName: string
  teerDeltaPct: number
  rciDeltaBps: number
  rviDeltaBps: number
  marginalContribution: 'none' | 'low' | 'moderate' | 'high'
}

export function computeAblationImpact(
  layerName: string,
  baseline: IndexSnapshot,
  ablated: IndexSnapshot,
): AblationResult {
  const teerDeltaPct = baseline.teer > 0
    ? Math.abs(baseline.teer - ablated.teer) / baseline.teer * 100
    : 0

  const rciDeltaBps = Math.abs(baseline.rci_median_bps - ablated.rci_median_bps)
  const rviDeltaBps = Math.abs(baseline.rvi_bps - ablated.rvi_bps)

  let marginalContribution: AblationResult['marginalContribution'] = 'none'
  if (teerDeltaPct > 1.0 || rciDeltaBps > 50) {
    marginalContribution = 'high'
  } else if (teerDeltaPct > 0.3 || rciDeltaBps > 15) {
    marginalContribution = 'moderate'
  } else if (teerDeltaPct > 0.05 || rciDeltaBps > 3) {
    marginalContribution = 'low'
  }

  return { layerName, teerDeltaPct, rciDeltaBps, rviDeltaBps, marginalContribution }
}
```

### Step 4: Run test to verify it passes

```bash
cd backend && npx vitest run tests/ablation-study.test.ts
```
Expected: PASS

### Step 5: Add batch ablation runner

Extend the file with `runAblationStudy` that:
1. Takes a corridor_id and date range
2. Computes baseline indices (all layers active) from `gold_export.cdp_daily`
3. For each signal layer (defined in `signal-combiner.ts` weights):
   - Recomputes indices excluding that layer's providers/signals
   - Compares to baseline using `computeAblationImpact`
4. Returns array of `AblationResult` sorted by marginal contribution (descending)
5. Logs warnings for layers with `none` contribution (candidates for removal)

The layers to ablate correspond to the signal combiner weights:
- `direct` (weight 0.5) - Direct TEER from gold indices
- `triangulated` (weight 0.2) - Synthetic triangulated TEER
- `factor` (weight 0.3) - External factor signals

And stress signal types from `corridor-stress.ts`:
- `rate_deviation`, `provider_dropout`, `failure_surge`, `rci_spike`, `freshness_breach`, `volume_drop`, `external_fx`, `volume_spike`

### Step 6: Commit

```bash
git add backend/scripts/ablation-study.ts \
       backend/tests/ablation-study.test.ts
git commit -m "feat: add signal layer ablation study tooling (P4)"
```

---

## Task 3: EDV Residual Monitoring (P5)

**Context:** The EDV research doc and Validation Agenda (E1) require tracking systematic residuals between TEER and reference anchors. Persistent residuals indicate unknown mechanisms. Transitory residuals indicate microstructure noise.

**Files:**
- Create: `backend/scripts/edv-residual-monitor.ts`
- Modify: `backend/db/migrations/` (new migration for residual log table)
- Test: `backend/tests/edv-residual-monitor.test.ts`

### Step 1: Create migration for residual tracking table

**File:** `backend/db/migrations/XXX_edv_residual_log.sql` (use next available migration number)

```sql
-- EDV Residual Monitoring: tracks TEER vs reference anchor deviations
CREATE TABLE IF NOT EXISTS gold_export.edv_residual_log (
  date                DATE          NOT NULL,
  corridor_id         TEXT          NOT NULL,
  amount_bucket       INT           NOT NULL DEFAULT 500,
  method_profile      method_profile NOT NULL DEFAULT 'standard_bank',
  teer_rate           NUMERIC,
  mid_market_rate     NUMERIC,
  residual_bps        NUMERIC,         -- (TEER - mid_market) / mid_market * 10000
  residual_7d_avg_bps NUMERIC,         -- Rolling 7-day average of residual
  residual_7d_std_bps NUMERIC,         -- Rolling 7-day stddev of residual
  is_persistent       BOOLEAN DEFAULT FALSE,  -- True if |residual| > 2*stddev for 3+ days
  persistence_days    INT DEFAULT 0,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (date, corridor_id, amount_bucket, method_profile)
);

CREATE INDEX IF NOT EXISTS edv_residual_corridor_date_idx
  ON gold_export.edv_residual_log (corridor_id, date);

COMMENT ON TABLE gold_export.edv_residual_log IS
  'Tracks TEER vs mid-market residuals per corridor for unknown-unknown detection (EDV research doc)';
```

### Step 2: Write failing test for residual classification

**File:** `backend/tests/edv-residual-monitor.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { classifyResidual, computeResidualBps } from '../scripts/edv-residual-monitor'

describe('EDV residual monitoring', () => {
  it('computes residual in basis points correctly', () => {
    const result = computeResidualBps(83.5, 84.0) // TEER below mid-market
    // (83.5 - 84.0) / 84.0 * 10000 = -59.52 bps
    expect(result).toBeCloseTo(-59.52, 0)
  })

  it('classifies transitory residual when within 2 stddev', () => {
    const result = classifyResidual({
      residual_bps: 30,
      rolling_avg_bps: 20,
      rolling_std_bps: 25,
      consecutive_breach_days: 1,
    })
    expect(result.is_persistent).toBe(false)
  })

  it('classifies persistent residual when exceeding 2 stddev for 3+ days', () => {
    const result = classifyResidual({
      residual_bps: 80,
      rolling_avg_bps: 20,
      rolling_std_bps: 25,
      consecutive_breach_days: 4,
    })
    expect(result.is_persistent).toBe(true)
  })

  it('handles zero stddev gracefully', () => {
    const result = classifyResidual({
      residual_bps: 50,
      rolling_avg_bps: 50,
      rolling_std_bps: 0,
      consecutive_breach_days: 5,
    })
    expect(result.is_persistent).toBe(true)
  })
})
```

### Step 3: Run test to verify it fails

```bash
cd backend && npx vitest run tests/edv-residual-monitor.test.ts
```
Expected: FAIL

### Step 4: Implement residual computation and classification

**File:** `backend/scripts/edv-residual-monitor.ts`

```typescript
export function computeResidualBps(teer: number, midMarket: number): number {
  if (midMarket === 0) return 0
  return ((teer - midMarket) / midMarket) * 10000
}

export interface ResidualInput {
  residual_bps: number
  rolling_avg_bps: number
  rolling_std_bps: number
  consecutive_breach_days: number
}

export interface ResidualClassification {
  is_persistent: boolean
  persistence_days: number
  breach_magnitude: number // How many stddevs away from mean
}

const PERSISTENCE_STDDEV_THRESHOLD = 2.0
const PERSISTENCE_MIN_DAYS = 3

export function classifyResidual(input: ResidualInput): ResidualClassification {
  const deviation = Math.abs(input.residual_bps - input.rolling_avg_bps)
  const breach_magnitude = input.rolling_std_bps > 0
    ? deviation / input.rolling_std_bps
    : (deviation > 0 ? Infinity : 0)

  const is_breaching = breach_magnitude >= PERSISTENCE_STDDEV_THRESHOLD
  const is_persistent = is_breaching && input.consecutive_breach_days >= PERSISTENCE_MIN_DAYS

  return {
    is_persistent,
    persistence_days: is_persistent ? input.consecutive_breach_days : 0,
    breach_magnitude,
  }
}
```

### Step 5: Run test to verify it passes

```bash
cd backend && npx vitest run tests/edv-residual-monitor.test.ts
```
Expected: PASS

### Step 6: Add batch runner that queries gold_export.cdp_daily

Extend the file with `runResidualMonitor` that:
1. Queries `gold_export.cdp_daily` for `teer_rate` and `mid_market_rate` per corridor
2. Computes `residual_bps` per day
3. Computes 7-day rolling stats (avg, stddev)
4. Classifies each residual as transitory vs persistent
5. Upserts into `gold_export.edv_residual_log`
6. Emits CloudWatch metric for corridors with persistent residuals

**Key SQL:**
```sql
SELECT
  date, corridor_id, amount_bucket, method_profile,
  teer_rate, mid_market_rate,
  CASE WHEN mid_market_rate > 0
    THEN ((teer_rate - mid_market_rate) / mid_market_rate) * 10000
    ELSE NULL
  END AS residual_bps
FROM gold_export.cdp_daily
WHERE date >= $1::date - INTERVAL '30 days'
  AND corridor_id = $2
  AND suppression_flag = false
ORDER BY date
```

### Step 7: Commit

```bash
git add backend/scripts/edv-residual-monitor.ts \
       backend/tests/edv-residual-monitor.test.ts \
       backend/db/migrations/XXX_edv_residual_log.sql
git commit -m "feat: add EDV residual monitoring for unknown-unknown detection (P5)"
```

---

## Summary

| Task | Feature | Effort | Dependencies |
|---|---|---|---|
| 1 | Quote Executability (P2) | Small | None |
| 2 | Signal Ablation Tooling (P4) | Medium | None |
| 3 | EDV Residual Monitor (P5) | Medium | None |

All 3 tasks are independent and can be parallelized. Task 1 should go first since it improves data quality for everything downstream.

**Excluded from plan:**
- P1 (Pulse Opportunity) - SmartSend already covers this (`pulse-cache-repository.ts:1099-1123`)
- P3 (Anti-Circularity Weights) - Synthetic seed weighting is safe from circularity risk
- P6 (ISER Full Methodology) - Architecture is ready; will onboard crypto data sources when needed
