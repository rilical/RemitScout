---
name: remit-scout-provider-onboarding
description: Automated provider onboarding workflow — add a new remittance provider (B2B or B2C) with rights-matrix, collector scaffolding, probe Lambda, CDK wiring, tests, and Gold/export integration. Horizontal scaling made repeatable.
---

# Remit-Scout Provider Onboarding

## Overview

Step-by-step automation for onboarding a new remittance provider into Remit-Scout. Given just the provider name and type (B2B/B2C), this skill scaffolds all code, configuration, infrastructure, and tests needed to start collecting data and publishing it through Gold indices and exports.

## Inputs (required)

| Parameter | Example | Description |
|-----------|---------|-------------|
| `PROVIDER_NAME` | `moneygram` | Lowercase slug, no spaces |
| `PROVIDER_TYPE` | `b2b` or `b2c` or `both` | Collection mode |
| `PROVIDER_URL` | `https://www.moneygram.com` | Provider's public URL |
| `SEND_COUNTRIES` | `US,GB,CA` | Comma-separated ISO-2 codes |
| `RECEIVE_COUNTRIES` | `MX,PH,IN` | Comma-separated ISO-2 codes |
| `METHODS` | `bank_transfer,cash_pickup` | Supported payout methods |

## Onboarding checklist (13 steps)

### Phase 1: Collector scaffolding

#### Step 1. Create provider directory

```bash
mkdir -p backend/plane-b/src/providers/${PROVIDER_NAME}
```

Files to create:
- `index.ts` — Provider entry (implements `ProviderCollector` interface)
- `parser.ts` — Response parser (raw → Bronze → Silver normalization)
- `config.ts` — Provider-specific config (URLs, rate limits, headers)
- `types.ts` — Provider-specific response types

Reference existing provider for structure:

```bash
# Use an existing B2B provider as template
ls backend/plane-b/src/providers/remitly/
```

#### Step 2. Register in provider index

File: `backend/plane-b/src/providers/index.ts`

Add the new provider to the registry map.

#### Step 3. Add provider config

File: `backend/shared/config.ts`

Add a new section under provider configs:

```typescript
${PROVIDER_NAME}: {
  baseUrl: process.env.PROVIDER_${PROVIDER_NAME_UPPER}_BASE_URL || '',
  apiKey: process.env.PROVIDER_${PROVIDER_NAME_UPPER}_API_KEY || '',
  rateLimit: parseInt(process.env.PROVIDER_${PROVIDER_NAME_UPPER}_RPM || '60', 10),
  timeout: parseInt(process.env.PROVIDER_${PROVIDER_NAME_UPPER}_TIMEOUT_MS || '15000', 10),
  enabled: process.env.PROVIDER_${PROVIDER_NAME_UPPER}_ENABLED !== 'false',
},
```

### Phase 2: Rights matrix and database

#### Step 4. Create migration

File: `backend/db/migrations/XXX_add_provider_${PROVIDER_NAME}.sql`

```sql
-- Insert provider
INSERT INTO silver.provider (slug, name, website_url, logo_url)
VALUES ('${PROVIDER_NAME}', '${PROVIDER_DISPLAY_NAME}', '${PROVIDER_URL}', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Insert rights-matrix entries (one per corridor)
-- Status starts as 'candidate' until validated
INSERT INTO silver.rights_matrix (
  provider_id, corridor_id, status, stoplist_status,
  allowed_collect, allowed_b2b, allowed_b2c,
  allowed_resell_b2b,
  allowed_in_teer, allowed_in_rci, allowed_in_rvi
)
SELECT
  p.id,
  c.id,
  'candidate',
  'active',
  true,
  ${PROVIDER_TYPE === 'b2b' || PROVIDER_TYPE === 'both'},
  ${PROVIDER_TYPE === 'b2c' || PROVIDER_TYPE === 'both'},
  false,
  false, false, false  -- indices disabled until validated
FROM silver.provider p
CROSS JOIN silver.corridor c
WHERE p.slug = '${PROVIDER_NAME}'
  AND c.send_country IN (${SEND_COUNTRIES_QUOTED})
  AND c.receive_country IN (${RECEIVE_COUNTRIES_QUOTED});
```

#### Step 5. Add provider capability entries

```sql
INSERT INTO silver.provider_corridor_capability (
  provider_id, corridor_id, method, last_verified
)
SELECT
  p.id, rm.corridor_id, m.method, NOW()
FROM silver.provider p
JOIN silver.rights_matrix rm ON rm.provider_id = p.id
CROSS JOIN (VALUES ${METHODS_AS_VALUES}) AS m(method)
WHERE p.slug = '${PROVIDER_NAME}';
```

### Phase 3: Infrastructure (CDK)

#### Step 6. Add probe Lambda

File: `infrastructure/cdk/lib/scheduled-jobs.ts`

Add a new probe rule following the existing pattern:

```typescript
createProbeRule(this, '${PROVIDER_NAME}', {
  schedule: isProd ? events.Schedule.rate(cdk.Duration.minutes(5)) : events.Schedule.rate(cdk.Duration.minutes(30)),
  // ... standard probe config
});
```

#### Step 7. Add secrets to Secrets Manager

```bash
aws secretsmanager create-secret \
  --name "${STACK_PREFIX}/provider/${PROVIDER_NAME}/api-key" \
  --secret-string "<api-key-value>" \
  --profile ${AWS_PROFILE}
```

Wire in CDK via `infrastructure/cdk/lib/remit-scout-stack.ts`.

#### Step 8. Add environment variables to ECS task definition

File: `infrastructure/cdk/lib/ecs-tasks.ts`

Add `PROVIDER_${PROVIDER_NAME_UPPER}_*` env vars to the Plane B task definition.

### Phase 4: Tests

#### Step 9. Create collector tests

File: `backend/tests/${PROVIDER_NAME}-collector.test.ts`

Test:
- Parser handles valid response
- Parser handles empty/error response
- Rate limiting respected
- Corridors filtered by rights-matrix

#### Step 10. Create parser tests

File: `backend/tests/${PROVIDER_NAME}-parser.test.ts`

Test:
- Normalizes to Silver schema correctly
- Handles missing fields gracefully
- Amount bucket normalization ($500 USD equivalent)

### Phase 5: Validation and promotion

#### Step 11. Run provider in candidate mode

Deploy with `status='candidate'` in rights-matrix. Verify:
- Probe Lambda executes without errors
- Silver receives quotes for expected corridors
- Quote count and freshness meet minimum thresholds

```sql
SELECT
  COUNT(*) AS quotes,
  COUNT(DISTINCT corridor_id) AS corridors,
  MIN(created_at) AS first_quote,
  MAX(created_at) AS latest_quote
FROM silver.quote_record qr
JOIN silver.provider p ON p.id = qr.provider_id
WHERE p.slug = '${PROVIDER_NAME}'
  AND qr.created_at > NOW() - INTERVAL '24 hours';
```

#### Step 12. Promote to production

```sql
UPDATE silver.rights_matrix
SET
  status = 'production',
  allowed_in_teer = true,
  allowed_in_rci = true,
  allowed_in_rvi = true
WHERE provider_id = (SELECT id FROM silver.provider WHERE slug = '${PROVIDER_NAME}');
```

#### Step 13. Verify Gold integration

After promotion, verify the provider appears in indices:

```sql
SELECT
  pws.provider_id,
  p.slug,
  COUNT(*) AS weight_rows,
  AVG(pws.raw_weight) AS avg_weight
FROM gold.provider_weight_snapshot pws
JOIN silver.provider p ON p.id = pws.provider_id
WHERE p.slug = '${PROVIDER_NAME}'
  AND pws.snapshot_date >= CURRENT_DATE - 1
GROUP BY pws.provider_id, p.slug;
```

## Post-onboarding verification

Run these skills to confirm end-to-end health:
1. `remit-scout-provider-health-probe` — Verify new provider appears as FRESH
2. `remit-scout-gold-indices-integrity` — Verify provider contributes to indices
3. `remit-scout-smoke` — Verify API returns data for new provider corridors

## Output template

```
## Provider Onboarding — ${PROVIDER_NAME} (${PROVIDER_TYPE})
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Environment: ${ENV}

### Checklist
- [ ] Collector scaffolded (backend/plane-b/src/providers/${PROVIDER_NAME}/)
- [ ] Registered in provider index
- [ ] Config added to shared/config.ts
- [ ] Migration created (XXX_add_provider_${PROVIDER_NAME}.sql)
- [ ] Capabilities seeded
- [ ] Probe Lambda added to CDK
- [ ] Secrets created in Secrets Manager
- [ ] ECS env vars wired
- [ ] Collector tests written
- [ ] Parser tests written
- [ ] Candidate mode deployed + verified
- [ ] Promoted to production
- [ ] Gold integration verified

### Corridors: <n> (send: ${SEND_COUNTRIES}, receive: ${RECEIVE_COUNTRIES})
### Methods: ${METHODS}
### Status: ONBOARDED | IN_PROGRESS | BLOCKED (<reason>)
```

## Scaling notes
- Each new provider adds ~1 probe Lambda (5–30 min cadence)
- Rights-matrix entries scale with corridor count
- Provider weighting job automatically picks up new production providers
- No changes needed to Gold indices or export jobs — they query rights-matrix dynamically
