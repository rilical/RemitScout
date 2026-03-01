# Plane A API Routes Deep Audit Findings

Audit Date: 2026-02-28T06:40:52Z  
Files Examined: 69  
Total Findings: 6

## Summary by Severity
- Critical: 0
- High: 3
- Medium: 3
- Low: 0

---

## Findings

### [HIGH] Finding #1: Lambda resolves Plane B/C URLs from Plane A secret/env wiring

**File:** `backend/plane-a/src/lambda.ts`  
**Lines:** 50-58, 69-77  
**Category:** `will-break`

**Description:**
`DATABASE_URL_PLANE_B` and `DATABASE_URL_PLANE_C` are both resolved using `PLANE_A_DB_SECRET_ARN` and `PLANE_A_DB_*` envs. This couples Plane B/C DB resolution to Plane A DB credentials and can silently route cross-plane reads/writes to the wrong database in AWS if separate secrets are expected.

**Code:**
```ts
await resolveDatabaseUrl({
  envVar: 'DATABASE_URL_PLANE_B',
  secretArnEnv: 'PLANE_A_DB_SECRET_ARN',
  ssmNameEnv: 'PLANE_A_DB_SSM_NAME',
  hostEnv: 'PLANE_A_DB_HOST',
  portEnv: 'PLANE_A_DB_PORT',
  nameEnv: 'PLANE_A_DB_NAME',
  usernameEnv: 'PLANE_A_DB_USERNAME',
  passwordEnv: 'PLANE_A_DB_PASSWORD',
  ...
})

await resolveDatabaseUrl({
  envVar: 'DATABASE_URL_PLANE_C',
  secretArnEnv: 'PLANE_A_DB_SECRET_ARN',
  ssmNameEnv: 'PLANE_A_DB_SSM_NAME',
  hostEnv: 'PLANE_A_DB_HOST',
  portEnv: 'PLANE_A_DB_PORT',
  nameEnv: 'PLANE_A_DB_NAME',
  usernameEnv: 'PLANE_A_DB_USERNAME',
  passwordEnv: 'PLANE_A_DB_PASSWORD',
  ...
})
```

**Why this matters:**
This risks plane-boundary violations and incorrect data source usage in production, which can cause integrity issues and hard-to-diagnose runtime failures.

---

### [HIGH] Finding #2: `/quotes/current` returns provider IDs in `availableMethods`

**File:** `backend/plane-a/src/routes/quotes.ts`  
**Lines:** 469, 576, 594  
**Category:** `broken-logic`

**Description:**
`availableMethods` is populated from `expectedProviders` (provider IDs), not payment methods. This violates contract expectations (`bank|cash|wallet|...`) and can break frontend/admin consumers that rely on method labels.

**Code:**
```ts
const expectedProviders = Array.from(allowedProviderSet)
...
const availableMethods = Array.from(new Set(expectedProviders)).sort()
...
availableMethods,
```

**Why this matters:**
Client-side filters and UI logic using `availableMethods` will receive invalid values, causing contract drift and incorrect rendering/behavior.

---

### [HIGH] Finding #3: `/providers` corridor-not-found path returns HTTP 200 instead of 404

**File:** `backend/plane-a/src/routes/providers/providers-list.ts`  
**Lines:** 1017-1025, 1998-2043  
**Category:** `will-break`

**Description:**
Route schema declares a `404` error contract, but `NotFoundError` is caught and returned as a normal payload without setting `reply.code(404)`, resulting in HTTP 200 for unsupported corridor conditions.

**Code:**
```ts
// schema declares 404
404: {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    corridor: { type: 'string' },
  },
  required: ['error', 'message'],
},

// catch block returns payload but no reply.code(404)
if (error instanceof NotFoundError) {
  ...
  return {
    comparisonId,
    start,
    error: { code: errorCode, message: errorMessage },
    ...
  }
}
```

**Why this matters:**
HTTP status drift breaks consumer error handling, retries, caching, and monitoring that depend on 4xx semantics.

---

### [MEDIUM] Finding #4: `/providers/pulse/:corridorId` accepts invalid `amount_bucket` (NaN) without validation

**File:** `backend/plane-a/src/routes/providers/providers-pulse.ts`  
**Lines:** 15-29  
**Category:** `will-break`

**Description:**
`amount_bucket` is parsed via `Number(...)` with no finite/integer/positive checks. Invalid inputs (e.g., `amount_bucket=abc`) become `NaN` and are passed to repository calls.

**Code:**
```ts
const query = request.query as {
  amount_bucket?: string | number
  method_profile?: string
}
const amountBucket = Number(query.amount_bucket ?? DEFAULT_AMOUNT_BUCKET)

const latest = await app.container.repositories.goldIndices.getIndicesLatest({
  corridorId,
  amountBucket,
  methodProfile,
})
```

**Why this matters:**
Invalid numeric inputs can trigger DB/repository errors or inconsistent behavior, creating unstable API responses.

---

### [MEDIUM] Finding #5: `bank-vs-specialist` fabricates “bank” benchmark from specialist quote

**File:** `backend/plane-a/src/routes/bank-vs-specialist.ts`  
**Lines:** 445-455, 502-503  
**Category:** `broken-logic`

**Description:**
When no bank quote is found, the endpoint synthesizes a bank baseline from the lowest-recipient specialist quote and labels it as benchmark-derived bank data.

**Code:**
```ts
// We use the lowest-recipient specialist quote as a conservative benchmark floor.
usedBankBenchmark = true
let benchmarkRow = specialistRows[0]
for (const row of specialistRows.slice(1)) {
  if (computeRecipientGets(row, amount) < computeRecipientGets(benchmarkRow, amount)) {
    benchmarkRow = row
  }
}
...
bank: {
  ...bankPayload,
  name: bankName,
  source: usedBankBenchmark ? 'benchmark' : 'bank_quote',
  sourceProviderId: bankSourceProviderId,
},
```

**Why this matters:**
This can mislead users with synthetic bank comparisons and undermines data-truthfulness expectations for decision-critical financial comparisons.

---

### [MEDIUM] Finding #6: `marketing/linkedin` and `marketing/google` endpoints have no rate limiting

**File:** `backend/plane-a/src/routes/marketing.ts`  
**Lines:** 356-373, 546-551, 593-597  
**Category:** `slop`

**Description:**
`/marketing/meta` applies rate limiting, but `/marketing/linkedin` and `/marketing/google` do not. All three are public write endpoints inserting telemetry records.

**Code:**
```ts
app.post('/marketing/meta', async (request, _reply) => {
  ...
  if (await checkRateLimit({ logger, key: rateKey, limit: 60, ttlSeconds: 60, component: 'marketing' })) {
    throw new RateLimitError()
  }
  ...
})

app.post('/marketing/linkedin', async (request, _reply) => {
  const parsed = eventSchema.safeParse(request.body ?? {})
  ...
})

app.post('/marketing/google', async (request, _reply) => {
  const parsed = eventSchema.safeParse(request.body ?? {})
  ...
})
```

**Why this matters:**
This creates asymmetric abuse protection and enables easier event-spam/DB-load attacks against the unthrottled endpoints.