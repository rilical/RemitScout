---
name: remit-scout-b2b-b2c-corridor-diagnostics
description: Diagnose B2B vs B2C provider coverage per corridor — verify provider counts, rights matrix consistency, indices eligibility, and identify corridors with insufficient coverage. Aware that B2B and B2C have different provider sets and counts.
---

# Remit-Scout B2B/B2C Corridor Diagnostics

## Overview

B2B and B2C are fundamentally different pipelines with different provider sets. A corridor like US→MX might have 17 B2B providers contributing to TEER/RCI/RVI, while the same corridor might have 20 B2C providers visible in the API. Some providers are B2B-only, some are B2C-only, and some serve both. This skill diagnoses coverage gaps, rights matrix inconsistencies, and indices eligibility per corridor.

## Key facts

- **B2B providers:** Filtered by `allowed_b2b=true`. Collection via `b2b_tier_1` / `b2b_tier_2` sweeps (scheduled). Feed into Gold indices (TEER/RCI/RVI) via `collector_type LIKE 'b2b_%'`.
- **B2C providers:** Filtered by `allowed_b2c=true`. Driven by user requests (on-demand). Visible in `/api/v1/providers`. Do NOT directly feed into Gold indices.
- **Indices eligibility:** Additionally gated by `allowed_in_teer`, `allowed_in_rci`, `allowed_in_rvi` flags per provider per corridor.
- **Production filter:** Only providers with `status='production'` AND `stoplist_status='active'` contribute to anything.
- **Amount normalization:** B2B uses per-provider `b2bAmount` from config (each provider may have different $500-equivalent amounts).
- **Schema note (critical):** `silver.rights_matrix` is provider-level (PK `provider_id`). Corridor eligibility is computed by matching `silver.corridor.source_country/dest_country` against `rights_matrix.source_countries[]/destination_countries[]`. Do NOT join rights_matrix on corridor_id.

## Preconditions
- Database read access
- AWS CLI for probe Lambda checks

## Checks

### 1. B2B provider count per corridor (who contributes to indices?)

```sql
SELECT
  c.corridor_id AS corridor,
  cts.corridor_tier AS tier,
  COUNT(DISTINCT rm.provider_id) FILTER (
    WHERE pcc.provider_id IS NOT NULL
      AND pcc.is_supported = true
      AND (
        pcc.payout_methods IS NULL
        OR array_length(pcc.payout_methods, 1) = 0
        OR 'bank_deposit' = ANY(pcc.payout_methods)
      )
  ) AS total_b2b_providers,
  COUNT(DISTINCT rm.provider_id) FILTER (
    WHERE rm.allowed_in_teer = true
      AND pcc.provider_id IS NOT NULL
      AND pcc.is_supported = true
      AND (
        pcc.payout_methods IS NULL
        OR array_length(pcc.payout_methods, 1) = 0
        OR 'bank_deposit' = ANY(pcc.payout_methods)
      )
  ) AS teer_eligible,
  COUNT(DISTINCT rm.provider_id) FILTER (
    WHERE rm.allowed_in_rci = true
      AND pcc.provider_id IS NOT NULL
      AND pcc.is_supported = true
      AND (
        pcc.payout_methods IS NULL
        OR array_length(pcc.payout_methods, 1) = 0
        OR 'bank_deposit' = ANY(pcc.payout_methods)
      )
  ) AS rci_eligible,
  COUNT(DISTINCT rm.provider_id) FILTER (
    WHERE rm.allowed_in_rvi = true
      AND pcc.provider_id IS NOT NULL
      AND pcc.is_supported = true
      AND (
        pcc.payout_methods IS NULL
        OR array_length(pcc.payout_methods, 1) = 0
        OR 'bank_deposit' = ANY(pcc.payout_methods)
      )
  ) AS rvi_eligible,
  CASE
    WHEN COUNT(DISTINCT rm.provider_id) FILTER (
      WHERE pcc.provider_id IS NOT NULL
        AND pcc.is_supported = true
        AND (
          pcc.payout_methods IS NULL
          OR array_length(pcc.payout_methods, 1) = 0
          OR 'bank_deposit' = ANY(pcc.payout_methods)
        )
    ) >= 3 THEN 'SUFFICIENT'
    WHEN COUNT(DISTINCT rm.provider_id) FILTER (
      WHERE pcc.provider_id IS NOT NULL
        AND pcc.is_supported = true
        AND (
          pcc.payout_methods IS NULL
          OR array_length(pcc.payout_methods, 1) = 0
          OR 'bank_deposit' = ANY(pcc.payout_methods)
        )
    ) >= 1 THEN 'LOW'
    ELSE 'NONE'
  END AS coverage_status
FROM silver.corridor c
LEFT JOIN silver.corridor_tier_snapshot cts
  ON cts.corridor_id = c.corridor_id
  AND cts.tier_version = '0'
LEFT JOIN silver.rights_matrix rm
  ON rm.allowed_b2b = true
  AND rm.allowed_collect = true
  AND rm.stoplist_status = 'active'
  AND rm.status = 'production'
  AND rm.source_countries IS NOT NULL
  AND array_length(rm.source_countries, 1) > 0
  AND c.source_country = ANY(rm.source_countries)
  AND rm.destination_countries IS NOT NULL
  AND array_length(rm.destination_countries, 1) > 0
  AND c.dest_country = ANY(rm.destination_countries)
LEFT JOIN silver.provider_corridor_capability pcc
  ON pcc.corridor_id = c.corridor_id
  AND pcc.provider_id = rm.provider_id
GROUP BY c.corridor_id, cts.corridor_tier
ORDER BY total_b2b_providers ASC;
```

SLO: >= 3 providers per corridor for both tier-1 and tier-2.

### 2. B2C provider count per corridor (who's visible in the API?)

```sql
SELECT
  c.source_country || '-' || c.dest_country AS corridor_short,
  COUNT(DISTINCT rm.provider_id) FILTER (
    WHERE pcc.provider_id IS NOT NULL
      AND pcc.is_supported = true
  ) AS total_b2c_providers,
  CASE
    WHEN COUNT(DISTINCT rm.provider_id) FILTER (WHERE pcc.provider_id IS NOT NULL AND pcc.is_supported = true) >= 3 THEN 'SUFFICIENT'
    WHEN COUNT(DISTINCT rm.provider_id) FILTER (WHERE pcc.provider_id IS NOT NULL AND pcc.is_supported = true) >= 1 THEN 'LOW'
    ELSE 'NONE'
  END AS coverage_status
FROM silver.corridor c
LEFT JOIN silver.rights_matrix rm
  ON rm.allowed_b2c = true
  AND rm.allowed_collect = true
  AND rm.stoplist_status = 'active'
  AND rm.status = 'production'
  AND rm.source_countries IS NOT NULL
  AND array_length(rm.source_countries, 1) > 0
  AND c.source_country = ANY(rm.source_countries)
  AND (
    (
      rm.destination_countries IS NOT NULL
      AND array_length(rm.destination_countries, 1) > 0
      AND c.dest_country = ANY(rm.destination_countries)
    )
    OR rm.provider_id = 'wise'
  )
	LEFT JOIN silver.provider_corridor_capability pcc
	  ON pcc.corridor_id = c.corridor_id
	  AND pcc.provider_id = rm.provider_id
	GROUP BY c.source_country, c.dest_country
	ORDER BY total_b2c_providers ASC;
	```

### 3. Providers that are B2B-only vs B2C-only vs both

```sql
SELECT
  p.provider_id AS provider,
  COALESCE(rm.allowed_b2b, false) AS has_b2b,
  COALESCE(rm.allowed_b2c, false) AS has_b2c,
  CASE
    WHEN COALESCE(rm.allowed_b2b, false) AND COALESCE(rm.allowed_b2c, false) THEN 'BOTH'
    WHEN COALESCE(rm.allowed_b2b, false) THEN 'B2B_ONLY'
    WHEN COALESCE(rm.allowed_b2c, false) THEN 'B2C_ONLY'
    ELSE 'NEITHER'
  END AS mode,
  COALESCE(rm.allowed_in_teer, false) AS in_teer,
  COALESCE(rm.allowed_in_rci, false) AS in_rci,
  COALESCE(rm.allowed_in_rvi, false) AS in_rvi
FROM silver.provider p
LEFT JOIN silver.rights_matrix rm ON rm.provider_id = p.provider_id
  AND rm.status = 'production'
  AND rm.stoplist_status = 'active'
GROUP BY p.provider_id, rm.allowed_b2b, rm.allowed_b2c, rm.allowed_in_teer, rm.allowed_in_rci, rm.allowed_in_rvi
ORDER BY p.provider_id;
```

### 4. Rights matrix consistency checks

```sql
-- Providers allowed_b2b but not allowed_collect (cannot collect data)
SELECT rm.provider_id AS provider, COUNT(*) AS rows
FROM silver.rights_matrix rm
WHERE rm.allowed_b2b = true AND rm.allowed_collect = false
  AND rm.status = 'production'
GROUP BY rm.provider_id;

-- Providers in indices but not allowed_b2b (impossible — indices use B2B data)
SELECT rm.provider_id AS provider, COUNT(*) AS rows
FROM silver.rights_matrix rm
WHERE (rm.allowed_in_teer OR rm.allowed_in_rci OR rm.allowed_in_rvi)
  AND rm.allowed_b2b = false
  AND rm.status = 'production'
GROUP BY rm.provider_id;

-- Corridors with NO eligible B2B providers by rights (country lists + flags)
SELECT
  c.corridor_id,
  c.source_country || '-' || c.dest_country AS corridor,
  cts.corridor_tier AS tier
FROM silver.corridor c
LEFT JOIN silver.corridor_tier_snapshot cts
  ON cts.corridor_id = c.corridor_id
  AND cts.tier_version = '0'
LEFT JOIN silver.rights_matrix rm
  ON rm.allowed_b2b = true
  AND rm.allowed_collect = true
  AND rm.stoplist_status = 'active'
  AND rm.status = 'production'
  AND rm.source_countries IS NOT NULL
  AND array_length(rm.source_countries, 1) > 0
  AND c.source_country = ANY(rm.source_countries)
  AND rm.destination_countries IS NOT NULL
  AND array_length(rm.destination_countries, 1) > 0
  AND c.dest_country = ANY(rm.destination_countries)
WHERE rm.provider_id IS NULL;
```

### 5. Active B2B data vs rights matrix (are providers actually delivering?)

```sql
SELECT
  rm.provider_id AS provider,
  rm_stats.eligible_corridors AS rights_corridors,
  COALESCE(q.active_corridors, 0) AS active_corridors,
  COALESCE(q.quotes_24h, 0) AS quotes_24h,
  CASE
    WHEN COALESCE(q.active_corridors, 0) = 0 THEN 'NO_DATA'
    WHEN q.active_corridors < rm_stats.eligible_corridors * 0.5 THEN 'PARTIAL'
    ELSE 'HEALTHY'
  END AS data_status
FROM silver.rights_matrix rm
JOIN (
  SELECT
    rm.provider_id,
    COUNT(*) AS eligible_corridors
  FROM silver.rights_matrix rm
  JOIN silver.corridor c
    ON rm.allowed_b2b = true
    AND rm.allowed_collect = true
    AND rm.stoplist_status = 'active'
    AND rm.status = 'production'
    AND rm.source_countries IS NOT NULL
    AND array_length(rm.source_countries, 1) > 0
    AND c.source_country = ANY(rm.source_countries)
    AND rm.destination_countries IS NOT NULL
    AND array_length(rm.destination_countries, 1) > 0
    AND c.dest_country = ANY(rm.destination_countries)
  GROUP BY rm.provider_id
) rm_stats ON rm_stats.provider_id = rm.provider_id
LEFT JOIN (
  SELECT
    provider_id,
    COUNT(DISTINCT corridor_id) AS active_corridors,
    COUNT(*) AS quotes_24h
  FROM silver.quote_record
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY provider_id
) q ON q.provider_id = rm.provider_id
ORDER BY data_status, quotes_24h;
```

### 6. Indices coverage map (which corridors have enough providers for meaningful indices?)

```sql
SELECT
  c.corridor_id AS corridor,
  COUNT(DISTINCT rm.provider_id) FILTER (
    WHERE rm.allowed_in_teer = true
      AND pcc.provider_id IS NOT NULL
      AND pcc.is_supported = true
  ) AS teer_count,
  COUNT(DISTINCT rm.provider_id) FILTER (
    WHERE rm.allowed_in_rci = true
      AND pcc.provider_id IS NOT NULL
      AND pcc.is_supported = true
  ) AS rci_count,
  COUNT(DISTINCT rm.provider_id) FILTER (
    WHERE rm.allowed_in_rvi = true
      AND pcc.provider_id IS NOT NULL
      AND pcc.is_supported = true
  ) AS rvi_count,
  CASE
    WHEN COUNT(DISTINCT rm.provider_id) FILTER (WHERE rm.allowed_in_rvi = true AND pcc.provider_id IS NOT NULL AND pcc.is_supported = true) >= 3 THEN 'INDICES_READY'
    WHEN COUNT(DISTINCT rm.provider_id) FILTER (WHERE rm.allowed_in_rvi = true AND pcc.provider_id IS NOT NULL AND pcc.is_supported = true) >= 1 THEN 'INDICES_PARTIAL'
    ELSE 'NO_INDICES'
  END AS indices_status
FROM silver.corridor c
LEFT JOIN silver.rights_matrix rm
  ON rm.allowed_b2b = true
  AND rm.allowed_collect = true
  AND rm.stoplist_status = 'active'
  AND rm.status = 'production'
  AND rm.source_countries IS NOT NULL
  AND array_length(rm.source_countries, 1) > 0
  AND c.source_country = ANY(rm.source_countries)
  AND rm.destination_countries IS NOT NULL
  AND array_length(rm.destination_countries, 1) > 0
  AND c.dest_country = ANY(rm.destination_countries)
LEFT JOIN silver.provider_corridor_capability pcc
  ON pcc.corridor_id = c.corridor_id
  AND pcc.provider_id = rm.provider_id
GROUP BY c.corridor_id
ORDER BY rvi_count ASC;
```

### 7. Weighting impact (are low-provider corridors getting reasonable weights?)

```sql
SELECT
  pws.corridor_id,
  c.source_country || '-' || c.dest_country AS corridor,
  COUNT(DISTINCT pws.provider_id) AS weighted_providers,
  AVG(pws.weight_confidence) AS avg_confidence,
  MIN(pws.weight_confidence) AS min_confidence,
  CASE
    WHEN AVG(pws.weight_confidence) >= 0.50 THEN 'STRONG'
    WHEN AVG(pws.weight_confidence) >= 0.30 THEN 'MODERATE'
    ELSE 'WEAK'
  END AS confidence_level
	FROM gold.provider_weight_snapshot pws
	JOIN silver.corridor c ON c.corridor_id = pws.corridor_id
	WHERE pws.snapshot_date >= CURRENT_DATE - 1
	GROUP BY pws.corridor_id, c.source_country, c.dest_country
	HAVING COUNT(DISTINCT pws.provider_id) <= 3
	ORDER BY avg_confidence ASC;
	```

## Output template (written to Section 4 of daily-ops-report.md)

```
## Section 4: B2B/B2C Corridor Coverage

### Provider Mode Summary
| Provider | Mode | B2B Corridors | B2C Corridors | In TEER | In RCI | In RVI |
(table rows for all 25 providers)

### B2B Coverage
- Total corridors with B2B rights: <n>
- Corridors with >= 3 providers: <n> (SUFFICIENT)
- Corridors with 1-2 providers: <n> (LOW)
- Corridors with 0 providers: <n> (NONE — should not exist in tier snapshot)

### B2C Coverage
- Total corridors with B2C rights: <n>
- Corridors with >= 3 providers: <n>
- Corridors with 1-2 providers: <n>
- Corridors with 0 providers: <n>

### Indices Readiness
- Corridors INDICES_READY (>= 3 RVI providers): <n>
- Corridors INDICES_PARTIAL (1-2): <n>
- Corridors NO_INDICES (0): <n>

### Consistency Issues
- Providers in indices but not allowed_b2b: <count> (CRITICAL if > 0)
- Providers allowed_b2b but not allowed_collect: <count> (FIX NEEDED)
- Tier snapshot corridors with no B2B providers: <count> (ORPHANED)

### Data vs Rights Gap
| Provider | Rights Corridors | Active Corridors | Quotes 24h | Status |
(table rows)

### Verdict: HEALTHY | GAPS_FOUND | CRITICAL
### Actions needed: (list)
```

## When to run
- **Daily:** After B2B sweep cycle completes
- **After provider onboarding:** Verify new provider appears correctly
- **After rights matrix changes:** Confirm consistency
- **Before indices publication:** Verify coverage meets thresholds

## Self-healing integration

Issues found by this skill are classified by the self-healing automation:

| Issue | Classification | Auto-fixable? |
|-------|---------------|--------------|
| Provider in indices but not allowed_b2b | DATA_FIX | No (manual rights fix) |
| Tier snapshot corridor with no providers | DATA_FIX | No (investigate why no rights) |
| Provider with rights but 0 quotes 24h | PROVIDER_DOWN | Partial (auto-stoplist if confirmed) |
| Low confidence corridors | SLO_BREACH | No (need more providers or more data) |
