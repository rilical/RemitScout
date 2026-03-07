# Research Gap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the 3 actionable gaps between Remit-Scout research docs and production (P2, P4, P5 from gap analysis).

**Architecture:** Each feature is standalone. P2 extends quote normalization with a `promotional_teaser` quality flag. P4 adds an ablation study script that compares index stability when removing signal layers. P5 adds residual monitoring that tracks TEER vs mid-market drift over time.

**Tech Stack:** TypeScript, vitest, Aurora Postgres (SQL migrations), existing shared utilities

**Companion doc:** `docs/plans/2026-03-01-research-vs-implementation-gap-analysis.md`

---

## Task 1: Add `promotional_teaser` Quality Flag (P2 - Part 1/3)

**Files:**
- Modify: `backend/plane-b/src/normalize/quality-flags.ts:19-75`

**Step 1: Add the flag constant**

In `backend/plane-b/src/normalize/quality-flags.ts`, add a new flag after `negative_fee` (line 74), inside the `qualityFlags` object:

```typescript
  /**
   * Executability Issues
   */

  /** Quote uses a promotional rate that diverges >2% from derived rate (non-executable teaser) */
  promotional_teaser: 'promotional_teaser',
```

**Step 2: Verify the flag is type-safe**

Run: `cd backend && npx tsc --noEmit --pretty plane-b/src/normalize/quality-flags.ts`

Expected: No type errors.

**Step 3: Commit**

```bash
git add backend/plane-b/src/normalize/quality-flags.ts
git commit -m "feat(quality-flags): add promotional_teaser flag for quote executability"
```

---

## Task 2: Write Failing Tests for Executability Detection (P2 - Part 2/3)

**Files:**
- Modify: `backend/tests/quote-normalizer.test.ts`

**Step 1: Add the executability test suite**

Append the following `describe` block after the existing `normalizeQuote promo fields` test suite in `backend/tests/quote-normalizer.test.ts`:

```typescript
describe('executability detection (promotional_teaser flag)', () => {
  it('flags quote when promotional_rate diverges > 2% from derived rate', () => {
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-IN-USD-INR',
      send_amount: 1000,
      fee_amount: 5,
      receive_amount: 83000,
      promotional_rate: 90.0, // derived = 83000/1000 = 83.0; divergence = 8.4%
      base_rate: 83.0,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      collected_at: new Date('2026-01-15T12:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000002',
      bronze_object_key: 'bronze.provider_raw:2',
    })
    expect(result.quality_flags).toContain('promotional_teaser')
  })

  it('does NOT flag when promotional_rate is within 2% of derived rate', () => {
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-IN-USD-INR',
      send_amount: 1000,
      fee_amount: 5,
      receive_amount: 83000,
      promotional_rate: 83.5, // derived = 83.0; divergence = 0.6%
      base_rate: 83.0,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      collected_at: new Date('2026-01-15T12:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000003',
      bronze_object_key: 'bronze.provider_raw:3',
    })
    expect(result.quality_flags).not.toContain('promotional_teaser')
  })

  it('does NOT flag when no promotional_rate is present', () => {
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-IN-USD-INR',
      send_amount: 1000,
      fee_amount: 5,
      receive_amount: 83000,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      collected_at: new Date('2026-01-15T12:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000004',
      bronze_object_key: 'bronze.provider_raw:4',
    })
    expect(result.quality_flags).not.toContain('promotional_teaser')
  })

  it('does NOT flag when promotional_rate equals derived rate exactly', () => {
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-MX-USD-MXN',
      send_amount: 100,
      fee_amount: 2,
      receive_amount: 1800,
      promotional_rate: 18.0, // derived = 1800/100 = 18.0; divergence = 0%
      base_rate: 17.5,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      collected_at: new Date('2026-01-15T12:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000005',
      bronze_object_key: 'bronze.provider_raw:5',
    })
    expect(result.quality_flags).not.toContain('promotional_teaser')
  })

  it('flags at boundary: promotional_rate diverges exactly 2.1% from derived rate', () => {
    // derived = 1800/100 = 18.0
    // 2.1% of 18.0 = 0.378 => promotional_rate = 18.378
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-MX-USD-MXN',
      send_amount: 100,
      fee_amount: 2,
      receive_amount: 1800,
      promotional_rate: 18.378,
      base_rate: 17.5,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      collected_at: new Date('2026-01-15T12:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000006',
      bronze_object_key: 'bronze.provider_raw:6',
    })
    expect(result.quality_flags).toContain('promotional_teaser')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd backend && npx vitest run tests/quote-normalizer.test.ts -t "executability detection"`

Expected: FAIL — first test expects `promotional_teaser` in flags but normalizer doesn't produce it yet.

**Step 3: Commit the failing tests**

```bash
git add backend/tests/quote-normalizer.test.ts
git commit -m "test: add failing tests for promotional_teaser executability detection"
```

---

## Task 3: Implement Executability Detection in Normalizer (P2 - Part 3/3)

**Files:**
- Modify: `backend/plane-b/src/normalize/quote-normalizer.ts:325-359`

**Step 1: Add executability check after promotional rate parsing**

In `backend/plane-b/src/normalize/quote-normalizer.ts`, add the following code after the `promotionalCapAmount` const declaration (line 328) and before the `calculateTotalDebit` call (line 329):

```typescript
  // Executability check (IA1): flag promotional teasers that diverge from derived rate
  const PROMOTIONAL_DIVERGENCE_THRESHOLD = 0.02 // 2%
  if (promotionalRate !== null && derivedRate !== null && derivedRate > 0) {
    const divergence = Math.abs(promotionalRate - derivedRate) / derivedRate
    if (divergence > PROMOTIONAL_DIVERGENCE_THRESHOLD) {
      flags.add(qualityFlags.promotional_teaser)
    }
  }
```

Note: `derivedRate` is already computed at line 336-338 as `receiveAmount / sendAmount`. The executability check must be placed AFTER that derivation. Looking at the actual code flow:

- Lines 325-328: parse promotional fields
- Lines 329-334: calculateTotalDebit
- Lines 336-338: compute `derivedRate`

So the check must go AFTER line 343 (end of `rateMatchesDerived` closure) and BEFORE line 346 (the `impliedFxRate` logic). Insert:

```typescript
  // Executability check (IA1): flag promotional teasers that diverge from derived rate
  const PROMOTIONAL_DIVERGENCE_THRESHOLD = 0.02 // 2%
  if (promotionalRate !== null && derivedRate !== null && derivedRate > 0) {
    const divergence = Math.abs(promotionalRate - derivedRate) / derivedRate
    if (divergence > PROMOTIONAL_DIVERGENCE_THRESHOLD) {
      flags.add(qualityFlags.promotional_teaser)
    }
  }
```

**Step 2: Run tests to verify they pass**

Run: `cd backend && npx vitest run tests/quote-normalizer.test.ts`

Expected: ALL PASS (both existing promo fields tests and new executability tests).

**Step 3: Run full test suite to check for regressions**

Run: `cd backend && npx vitest run tests/quote-normalizer.test.ts tests/gold-indices-computation.test.ts`

Expected: ALL PASS.

**Step 4: Commit**

```bash
git add backend/plane-b/src/normalize/quote-normalizer.ts
git commit -m "feat(normalizer): detect promotional teasers diverging >2% from derived rate (P2)"
```

---

## Task 4: Write Failing Tests for Ablation Impact Computation (P4 - Part 1/3)

**Files:**
- Create: `backend/tests/ablation-study.test.ts`

**Step 1: Create the test file**

Create `backend/tests/ablation-study.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { computeAblationImpact, type IndexSnapshot } from '../scripts/ablation-study'

describe('computeAblationImpact', () => {
  const baseline: IndexSnapshot = {
    teer: 83.5,
    rci_median_bps: 150,
    rvi_bps: 20,
  }

  it('returns "none" when removing a layer changes nothing', () => {
    const ablated: IndexSnapshot = { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }
    const result = computeAblationImpact('zero_impact_layer', baseline, ablated)

    expect(result.layerName).toBe('zero_impact_layer')
    expect(result.teerDeltaPct).toBeCloseTo(0, 4)
    expect(result.rciDeltaBps).toBeCloseTo(0, 4)
    expect(result.rviDeltaBps).toBeCloseTo(0, 4)
    expect(result.marginalContribution).toBe('none')
  })

  it('returns "high" when TEER changes > 1%', () => {
    const ablated: IndexSnapshot = { teer: 80.0, rci_median_bps: 300, rvi_bps: 50 }
    const result = computeAblationImpact('critical_layer', baseline, ablated)

    expect(result.teerDeltaPct).toBeGreaterThan(1.0)
    expect(result.rciDeltaBps).toBe(150) // |150 - 300|
    expect(result.marginalContribution).toBe('high')
  })

  it('returns "high" when RCI changes > 50 bps even if TEER is stable', () => {
    const ablated: IndexSnapshot = { teer: 83.4, rci_median_bps: 210, rvi_bps: 22 }
    const result = computeAblationImpact('rci_critical', baseline, ablated)

    expect(result.rciDeltaBps).toBe(60) // |150 - 210|
    expect(result.marginalContribution).toBe('high')
  })

  it('returns "moderate" for intermediate TEER changes (0.3% - 1%)', () => {
    // 0.6% TEER change: |83.5 - 83.0| / 83.5 * 100 = 0.5988%
    const ablated: IndexSnapshot = { teer: 83.0, rci_median_bps: 155, rvi_bps: 21 }
    const result = computeAblationImpact('moderate_layer', baseline, ablated)

    expect(result.teerDeltaPct).toBeGreaterThan(0.3)
    expect(result.teerDeltaPct).toBeLessThan(1.0)
    expect(result.marginalContribution).toBe('moderate')
  })

  it('returns "moderate" for intermediate RCI changes (15 - 50 bps)', () => {
    const ablated: IndexSnapshot = { teer: 83.48, rci_median_bps: 170, rvi_bps: 21 }
    const result = computeAblationImpact('rci_moderate', baseline, ablated)

    expect(result.rciDeltaBps).toBe(20) // |150 - 170|
    expect(result.marginalContribution).toBe('moderate')
  })

  it('returns "low" for small but non-zero TEER changes (0.05% - 0.3%)', () => {
    // 0.12% TEER change: |83.5 - 83.4| / 83.5 * 100 = 0.1198%
    const ablated: IndexSnapshot = { teer: 83.4, rci_median_bps: 153, rvi_bps: 20 }
    const result = computeAblationImpact('low_layer', baseline, ablated)

    expect(result.teerDeltaPct).toBeGreaterThan(0.05)
    expect(result.teerDeltaPct).toBeLessThan(0.3)
    expect(result.marginalContribution).toBe('low')
  })

  it('handles zero baseline TEER gracefully', () => {
    const zeroBaseline: IndexSnapshot = { teer: 0, rci_median_bps: 150, rvi_bps: 20 }
    const ablated: IndexSnapshot = { teer: 80.0, rci_median_bps: 300, rvi_bps: 50 }
    const result = computeAblationImpact('zero_teer', zeroBaseline, ablated)

    expect(result.teerDeltaPct).toBe(0)
    expect(result.rciDeltaBps).toBe(150)
    expect(result.marginalContribution).toBe('high') // RCI delta > 50
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/ablation-study.test.ts`

Expected: FAIL — module `../scripts/ablation-study` does not exist yet.

**Step 3: Commit the failing tests**

```bash
git add backend/tests/ablation-study.test.ts
git commit -m "test: add failing tests for ablation impact computation (P4)"
```

---

## Task 5: Implement Ablation Impact Computation (P4 - Part 2/3)

**Files:**
- Create: `backend/scripts/ablation-study.ts`

**Step 1: Create the ablation computation module**

Create `backend/scripts/ablation-study.ts`:

```typescript
/**
 * Signal Layer Ablation Study (P4)
 *
 * Measures the marginal contribution of each signal layer to index stability.
 * For each layer, computes indices with and without that layer, then quantifies
 * the impact on TEER, RCI, and RVI.
 *
 * Implements Validation Agenda trial E2: "Remove each signal layer and quantify
 * degradation in explanatory power and forecast performance."
 */

import { createLogger } from '../shared/logger'

const logger = createLogger('script.ablation-study')

/**
 * Snapshot of index values for a corridor on a given date.
 */
export interface IndexSnapshot {
  teer: number
  rci_median_bps: number
  rvi_bps: number
}

/**
 * Result of ablating (removing) a single signal layer.
 */
export interface AblationResult {
  layerName: string
  teerDeltaPct: number
  rciDeltaBps: number
  rviDeltaBps: number
  marginalContribution: 'none' | 'low' | 'moderate' | 'high'
}

/**
 * Compute the impact of removing a signal layer by comparing baseline vs ablated indices.
 *
 * Thresholds:
 * - high: TEER changes > 1% OR RCI changes > 50 bps
 * - moderate: TEER changes > 0.3% OR RCI changes > 15 bps
 * - low: TEER changes > 0.05% OR RCI changes > 3 bps
 * - none: below all thresholds
 */
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

  logger.debug('ablation_impact_computed', {
    layerName,
    teerDeltaPct: teerDeltaPct.toFixed(4),
    rciDeltaBps,
    rviDeltaBps,
    marginalContribution,
  })

  return { layerName, teerDeltaPct, rciDeltaBps, rviDeltaBps, marginalContribution }
}
```

**Step 2: Run tests to verify they pass**

Run: `cd backend && npx vitest run tests/ablation-study.test.ts`

Expected: ALL PASS (7 tests).

**Step 3: Commit**

```bash
git add backend/scripts/ablation-study.ts
git commit -m "feat: implement ablation impact computation for signal layer analysis (P4)"
```

---

## Task 6: Add Batch Ablation Runner (P4 - Part 3/3)

**Files:**
- Modify: `backend/scripts/ablation-study.ts`
- Modify: `backend/tests/ablation-study.test.ts`

**Step 1: Write failing test for the batch runner**

Append to `backend/tests/ablation-study.test.ts`:

```typescript
import { summarizeAblationStudy, type AblationStudySummary } from '../scripts/ablation-study'

describe('summarizeAblationStudy', () => {
  it('sorts results by marginal contribution descending', () => {
    const results = [
      computeAblationImpact('low_layer', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 83.4, rci_median_bps: 153, rvi_bps: 20 }),
      computeAblationImpact('high_layer', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 80.0, rci_median_bps: 300, rvi_bps: 50 }),
      computeAblationImpact('none_layer', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }),
    ]

    const summary = summarizeAblationStudy(results)

    expect(summary.results[0].layerName).toBe('high_layer')
    expect(summary.results[1].layerName).toBe('low_layer')
    expect(summary.results[2].layerName).toBe('none_layer')
  })

  it('identifies redundant layers (contribution = none)', () => {
    const results = [
      computeAblationImpact('useful', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 80.0, rci_median_bps: 300, rvi_bps: 50 }),
      computeAblationImpact('redundant_a', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }),
      computeAblationImpact('redundant_b', { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }, { teer: 83.5, rci_median_bps: 150, rvi_bps: 20 }),
    ]

    const summary = summarizeAblationStudy(results)

    expect(summary.redundantLayers).toEqual(['redundant_a', 'redundant_b'])
    expect(summary.criticalLayers).toEqual(['useful'])
  })

  it('handles empty results', () => {
    const summary = summarizeAblationStudy([])

    expect(summary.results).toEqual([])
    expect(summary.redundantLayers).toEqual([])
    expect(summary.criticalLayers).toEqual([])
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/ablation-study.test.ts -t "summarizeAblationStudy"`

Expected: FAIL — `summarizeAblationStudy` not exported.

**Step 3: Implement the summary function**

Append to `backend/scripts/ablation-study.ts`:

```typescript
/**
 * Summary of a full ablation study across all layers.
 */
export interface AblationStudySummary {
  /** All results, sorted by marginal contribution (highest first) */
  results: AblationResult[]
  /** Layer names with 'none' contribution — candidates for removal */
  redundantLayers: string[]
  /** Layer names with 'high' contribution — critical dependencies */
  criticalLayers: string[]
}

const CONTRIBUTION_RANK: Record<AblationResult['marginalContribution'], number> = {
  high: 3,
  moderate: 2,
  low: 1,
  none: 0,
}

/**
 * Summarize ablation results: sort by impact, identify redundant and critical layers.
 */
export function summarizeAblationStudy(results: AblationResult[]): AblationStudySummary {
  const sorted = [...results].sort((a, b) =>
    CONTRIBUTION_RANK[b.marginalContribution] - CONTRIBUTION_RANK[a.marginalContribution]
    || b.teerDeltaPct - a.teerDeltaPct
  )

  const redundantLayers = sorted
    .filter((r) => r.marginalContribution === 'none')
    .map((r) => r.layerName)

  const criticalLayers = sorted
    .filter((r) => r.marginalContribution === 'high')
    .map((r) => r.layerName)

  if (redundantLayers.length > 0) {
    logger.warn('ablation_redundant_layers_detected', {
      count: redundantLayers.length,
      layers: redundantLayers,
    })
  }

  return { results: sorted, redundantLayers, criticalLayers }
}

/**
 * Signal layers available for ablation.
 *
 * Source weights (from SignalCombiner):
 * - direct: 0.5 — Direct TEER from gold indices
 * - triangulated: 0.2 — Synthetic triangulated TEER via intermediary currencies
 * - factor: 0.3 — External factor signals (FX, economic, regulatory)
 *
 * Stress signal types (from TriangulationEngine):
 * - rate_deviation (0.25), provider_dropout (0.18), failure_surge (0.15),
 *   rci_spike (0.12), freshness_breach (0.10), volume_drop (0.08),
 *   external_fx (0.07), volume_spike (0.05)
 */
export const ABLATION_LAYERS = [
  'direct',
  'triangulated',
  'factor',
  'rate_deviation',
  'provider_dropout',
  'failure_surge',
  'rci_spike',
  'freshness_breach',
  'volume_drop',
  'external_fx',
  'volume_spike',
] as const

export type AblationLayer = typeof ABLATION_LAYERS[number]
```

**Step 4: Run all ablation tests to verify they pass**

Run: `cd backend && npx vitest run tests/ablation-study.test.ts`

Expected: ALL PASS (10 tests).

**Step 5: Commit**

```bash
git add backend/scripts/ablation-study.ts backend/tests/ablation-study.test.ts
git commit -m "feat: add ablation study summary with redundant/critical layer detection (P4)"
```

---

## Task 7: Create Migration for EDV Residual Log Table (P5 - Part 1/3)

**Files:**
- Create: `backend/db/migrations/093_edv_residual_log.sql`

**Step 1: Create the migration file**

Create `backend/db/migrations/093_edv_residual_log.sql`:

```sql
-- EDV Residual Monitoring (P5)
-- Tracks TEER vs mid-market residuals per corridor for unknown-unknown detection.
-- Research source: EDV doc + Validation Agenda (E1)

CREATE TABLE IF NOT EXISTS gold_export.edv_residual_log (
  date                DATE          NOT NULL,
  corridor_id         TEXT          NOT NULL,
  amount_bucket       INT           NOT NULL DEFAULT 500,
  method_profile      method_profile NOT NULL DEFAULT 'standard_bank',
  teer_rate           NUMERIC,
  mid_market_rate     NUMERIC,
  residual_bps        NUMERIC,           -- (TEER - mid_market) / mid_market * 10000
  residual_7d_avg_bps NUMERIC,           -- Rolling 7-day average residual
  residual_7d_std_bps NUMERIC,           -- Rolling 7-day stddev of residual
  is_persistent       BOOLEAN DEFAULT FALSE,  -- True if |residual| > 2*stddev for 3+ consecutive days
  persistence_days    INT DEFAULT 0,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (date, corridor_id, amount_bucket, method_profile)
);

CREATE INDEX IF NOT EXISTS edv_residual_corridor_date_idx
  ON gold_export.edv_residual_log (corridor_id, date);

COMMENT ON TABLE gold_export.edv_residual_log IS
  'Tracks TEER vs mid-market residuals per corridor for unknown-unknown detection (EDV research doc, Validation Agenda E1)';
```

**Step 2: Verify the migration file exists and is valid SQL**

Run: `head -5 backend/db/migrations/093_edv_residual_log.sql`

Expected: First 5 lines of the migration file.

**Step 3: Commit**

```bash
git add backend/db/migrations/093_edv_residual_log.sql
git commit -m "feat(migration): add edv_residual_log table for TEER vs mid-market tracking (P5)"
```

---

## Task 8: Write Failing Tests for Residual Computation (P5 - Part 2/3)

**Files:**
- Create: `backend/tests/edv-residual-monitor.test.ts`

**Step 1: Create the test file**

Create `backend/tests/edv-residual-monitor.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  computeResidualBps,
  classifyResidual,
  type ResidualInput,
} from '../scripts/edv-residual-monitor'

describe('computeResidualBps', () => {
  it('computes negative residual when TEER < mid-market', () => {
    // (83.5 - 84.0) / 84.0 * 10000 = -59.52 bps
    const result = computeResidualBps(83.5, 84.0)
    expect(result).toBeCloseTo(-59.52, 0)
  })

  it('computes positive residual when TEER > mid-market', () => {
    // (84.5 - 84.0) / 84.0 * 10000 = 59.52 bps
    const result = computeResidualBps(84.5, 84.0)
    expect(result).toBeCloseTo(59.52, 0)
  })

  it('returns zero when TEER equals mid-market', () => {
    const result = computeResidualBps(84.0, 84.0)
    expect(result).toBe(0)
  })

  it('returns zero when mid-market is zero (division guard)', () => {
    const result = computeResidualBps(83.5, 0)
    expect(result).toBe(0)
  })
})

describe('classifyResidual', () => {
  it('classifies as transitory when residual is within 2 stddev', () => {
    const input: ResidualInput = {
      residual_bps: 30,
      rolling_avg_bps: 20,
      rolling_std_bps: 25,     // deviation = |30 - 20| = 10, threshold = 2*25 = 50
      consecutive_breach_days: 1,
    }
    const result = classifyResidual(input)
    expect(result.is_persistent).toBe(false)
    expect(result.persistence_days).toBe(0)
  })

  it('classifies as transitory when breaching but < 3 consecutive days', () => {
    const input: ResidualInput = {
      residual_bps: 80,
      rolling_avg_bps: 20,
      rolling_std_bps: 25,     // deviation = 60, threshold = 50 -> breaching
      consecutive_breach_days: 2,  // but only 2 days
    }
    const result = classifyResidual(input)
    expect(result.is_persistent).toBe(false)
  })

  it('classifies as persistent when exceeding 2 stddev for 3+ consecutive days', () => {
    const input: ResidualInput = {
      residual_bps: 80,
      rolling_avg_bps: 20,
      rolling_std_bps: 25,     // deviation = 60, threshold = 50 -> breaching
      consecutive_breach_days: 4,  // 4 consecutive days
    }
    const result = classifyResidual(input)
    expect(result.is_persistent).toBe(true)
    expect(result.persistence_days).toBe(4)
  })

  it('classifies as persistent at exactly 3 consecutive breach days', () => {
    const input: ResidualInput = {
      residual_bps: 80,
      rolling_avg_bps: 20,
      rolling_std_bps: 25,
      consecutive_breach_days: 3,
    }
    const result = classifyResidual(input)
    expect(result.is_persistent).toBe(true)
    expect(result.persistence_days).toBe(3)
  })

  it('handles zero stddev gracefully (any deviation is infinite breach)', () => {
    const input: ResidualInput = {
      residual_bps: 50,
      rolling_avg_bps: 50,
      rolling_std_bps: 0,
      consecutive_breach_days: 5,
    }
    const result = classifyResidual(input)
    // deviation = 0, so breach_magnitude = 0 (no actual deviation)
    // Not breaching because there's no deviation from mean
    expect(result.is_persistent).toBe(false)
  })

  it('handles zero stddev with actual deviation (Infinity magnitude)', () => {
    const input: ResidualInput = {
      residual_bps: 60,
      rolling_avg_bps: 50,
      rolling_std_bps: 0,       // deviation = 10, stddev = 0 -> Infinity magnitude
      consecutive_breach_days: 5,
    }
    const result = classifyResidual(input)
    expect(result.is_persistent).toBe(true)
    expect(result.breach_magnitude).toBe(Infinity)
  })

  it('computes correct breach magnitude', () => {
    const input: ResidualInput = {
      residual_bps: 80,
      rolling_avg_bps: 20,
      rolling_std_bps: 10,     // deviation = 60, magnitude = 60/10 = 6.0
      consecutive_breach_days: 4,
    }
    const result = classifyResidual(input)
    expect(result.breach_magnitude).toBeCloseTo(6.0, 2)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/edv-residual-monitor.test.ts`

Expected: FAIL — module `../scripts/edv-residual-monitor` does not exist yet.

**Step 3: Commit the failing tests**

```bash
git add backend/tests/edv-residual-monitor.test.ts
git commit -m "test: add failing tests for EDV residual computation and classification (P5)"
```

---

## Task 9: Implement Residual Computation and Classification (P5 - Part 3/3)

**Files:**
- Create: `backend/scripts/edv-residual-monitor.ts`

**Step 1: Create the residual monitor module**

Create `backend/scripts/edv-residual-monitor.ts`:

```typescript
/**
 * EDV Residual Monitor (P5)
 *
 * Tracks systematic residuals between TEER and reference anchors (mid-market rate).
 * Persistent residuals indicate unknown mechanisms affecting the corridor.
 * Transitory residuals indicate microstructure noise.
 *
 * Research source: EDV doc + Validation Agenda (E1)
 *
 * Definitions:
 * - residual_bps: (TEER - mid_market) / mid_market * 10000
 * - persistent: |residual - rolling_avg| > 2 * rolling_stddev for 3+ consecutive days
 */

import { createLogger } from '../shared/logger'

const logger = createLogger('script.edv-residual-monitor')

/**
 * Compute residual between TEER and reference anchor in basis points.
 *
 * Positive residual = TEER above mid-market (providers charge more than FX rate implies).
 * Negative residual = TEER below mid-market (providers offer rates better than mid-market).
 */
export function computeResidualBps(teer: number, midMarket: number): number {
  if (midMarket === 0) return 0
  return ((teer - midMarket) / midMarket) * 10000
}

/**
 * Input for residual classification.
 */
export interface ResidualInput {
  residual_bps: number
  rolling_avg_bps: number
  rolling_std_bps: number
  consecutive_breach_days: number
}

/**
 * Output of residual classification.
 */
export interface ResidualClassification {
  /** True if residual has been persistently breaching for 3+ days */
  is_persistent: boolean
  /** Number of consecutive breach days (0 if not persistent) */
  persistence_days: number
  /** How many standard deviations away from the rolling mean */
  breach_magnitude: number
}

const PERSISTENCE_STDDEV_THRESHOLD = 2.0
const PERSISTENCE_MIN_DAYS = 3

/**
 * Classify a residual as transitory or persistent.
 *
 * A residual is persistent if:
 * 1. Its deviation from the rolling mean exceeds 2 standard deviations
 * 2. This breach has persisted for 3 or more consecutive days
 *
 * This implements the unknown-unknown detection mechanism from the EDV research:
 * persistent, pattern-stable residuals should trigger investigation flags.
 */
export function classifyResidual(input: ResidualInput): ResidualClassification {
  const deviation = Math.abs(input.residual_bps - input.rolling_avg_bps)
  const breach_magnitude = input.rolling_std_bps > 0
    ? deviation / input.rolling_std_bps
    : (deviation > 0 ? Infinity : 0)

  const is_breaching = breach_magnitude >= PERSISTENCE_STDDEV_THRESHOLD
  const is_persistent = is_breaching && input.consecutive_breach_days >= PERSISTENCE_MIN_DAYS

  if (is_persistent) {
    logger.warn('persistent_residual_detected', {
      residual_bps: input.residual_bps,
      rolling_avg_bps: input.rolling_avg_bps,
      rolling_std_bps: input.rolling_std_bps,
      breach_magnitude: breach_magnitude === Infinity ? 'Infinity' : breach_magnitude.toFixed(2),
      consecutive_days: input.consecutive_breach_days,
    })
  }

  return {
    is_persistent,
    persistence_days: is_persistent ? input.consecutive_breach_days : 0,
    breach_magnitude,
  }
}
```

**Step 2: Run tests to verify they pass**

Run: `cd backend && npx vitest run tests/edv-residual-monitor.test.ts`

Expected: ALL PASS (11 tests).

**Step 3: Run all tests together to check for regressions**

Run: `cd backend && npx vitest run tests/quote-normalizer.test.ts tests/ablation-study.test.ts tests/edv-residual-monitor.test.ts`

Expected: ALL PASS.

**Step 4: Commit**

```bash
git add backend/scripts/edv-residual-monitor.ts
git commit -m "feat: implement EDV residual computation and persistence classification (P5)"
```

---

## Summary

| Task | What | Effort | Files | Tests |
|---|---|---|---|---|
| 1 | Add `promotional_teaser` flag constant | 2 min | 1 modify | 0 |
| 2 | Write failing executability tests | 3 min | 1 modify | 5 |
| 3 | Implement executability detection | 5 min | 1 modify | 5 pass |
| 4 | Write failing ablation tests | 3 min | 1 create | 7 |
| 5 | Implement ablation computation | 3 min | 1 create | 7 pass |
| 6 | Add ablation summary + layers | 5 min | 2 modify | 10 pass |
| 7 | Create residual log migration | 2 min | 1 create | 0 |
| 8 | Write failing residual tests | 3 min | 1 create | 11 |
| 9 | Implement residual monitor | 5 min | 1 create | 11 pass |

**Total: 9 tasks, ~31 minutes, 9 commits**

All tasks are independent at the task group level:
- Tasks 1-3 (P2) can run in parallel with Tasks 4-6 (P4) and Tasks 7-9 (P5)
- Within each group, tasks are sequential (flag -> test -> implement)

**Excluded from plan:**
- P1 (Pulse Opportunity) — SmartSend already covers this (`pulse-cache-repository.ts:1099-1123`)
- P3 (Anti-Circularity Weights) — Synthetic seed weighting is safe from circularity risk
- P6 (ISER Full Methodology) — Architecture is ready; will onboard crypto data sources later
