# Tests & Coverage Deep Audit Findings

Audit Date: 2026-02-28T19:42:00Z
Files Examined: 148
Total Findings: 16

## Summary by Severity
- Critical: 2
- High: 5
- Medium: 6
- Low: 3

## Remediation Status (FIX-RS-004+)

| Finding | Status | Evidence |
|---|---|---|
| #1 Gold export guardrails no-op test | fixed | `backend/tests/gold-export-guardrails.test.ts` |
| #2 Dependency/security audit non-blocking | fixed | `.github/workflows/ci.yml` (`security-gate` blocking), `.github/workflows/deploy.yml` (staging/prod `AUDIT_BLOCKING=1`) |
| #3 Repository retry tautological test | fixed | `backend/tests/repository-retry.test.ts` |
| #4 API keys service export-only test | fixed | `backend/tests/api-keys-service.test.ts` |
| #5 CloudWatch metrics export-only test | fixed | `backend/tests/cloudwatch-metrics.test.ts` |
| #6 Bronze storage export-only test | fixed | `backend/tests/bronze-storage.test.ts` |
| #7 SQL regression test stringification-only | fixed | `backend/tests/gold-indices-sql-regression.test.ts` |
| #8 DAST workflow `continue-on-error` | fixed | `.github/workflows/evidence-security-dast.yml` |
| #9 Secret scanning `continue-on-error` | fixed | `.github/workflows/secret-scanning.yml` |
| #10 Provider fixtures non-deterministic in CI | fixed | `backend/vitest.config.ts`, `.github/workflows/ci.yml` (`RUN_PROVIDER_FIXTURES=1`) |
| #11 Conditional coverage thresholds | fixed | `backend/vitest.config.ts` (unconditional thresholds) |
| #12 SQL interpolation anti-pattern in fixtures | fixed | `backend/tests/cache-ttl-e2e.test.ts` |
| #13 Deploy workflow missing explicit CI gate by SHA | fixed | `.github/workflows/deploy.yml` (`Verify ci/main gate for dispatch SHA`) |
| #14 Source-content inspection test smell | fixed | `backend/tests/b2c-refresh-worker.test.ts` |
| #15 Missing route-level tests | already_fixed_with_evidence | Existing route tests under `backend/tests/*route*.test.ts` (including `compliance`, `sessions`, `watchlist`, `marketing`, `rates`, `pulse`, `history`, `telemetry`, `newsletter`, `notifications`) |
| #16 Missing frontend auth-security e2e coverage | fixed | `frontend/tests/e2e/auth-session-persistence.spec.ts`, `frontend/tests/e2e/auth-redirect-security.spec.ts` |

---

## Findings

### [CRITICAL] Finding #1: Gold export guardrails test is a pure no-op placeholder

**File:** `backend/tests/gold-export-guardrails.test.ts`
**Lines:** 3-11
**Category:** `false-confidence`

**Description:**
This test file has a TODO comment explaining what it should do, but the actual assertion is `expect(true).toBe(true)` -- a tautology that will always pass regardless of production behavior. The test name ("documents gold-only export requirement") implies enforcement of a critical data governance boundary (gold-only exports), but it asserts nothing. This inflates the test count by 1 and creates a false sense of security around data-plane export isolation.

**Code:**
```ts
describe('Gold export guardrails', () => {
  it('documents gold-only export requirement', () => {
    // TODO: assert export queries do not read silver.* or bronze.* tables.
    // Example checks:
    // - scan export SQL for forbidden schemas
    // - verify data sources are gold.* only
    expect(true).toBe(true)
  })
})
```

**Why this matters:**
If export queries were to regress and start reading from silver or bronze tables, this test would not catch it. Given that this is a data governance boundary (gold-only exports), the silent pass gives false confidence that exports are validated against unauthorized schema access.

---

### [CRITICAL] Finding #2: Security audit dependency scan is permanently non-blocking in CI and deploy

**File:** `.github/workflows/ci.yml`
**Lines:** 154-165
**Category:** `ci-blind-spot`

**Description:**
The CI `security-gate` job runs `pnpm audit` but catches the non-zero exit code and logs "Non-blocking in mode=..." before continuing. This means HIGH and CRITICAL dependency vulnerabilities will never fail the CI pipeline regardless of mode (pr, main, or nightly). The same pattern is replicated in the deploy pipeline with `AUDIT_BLOCKING: '0'` hardcoded.

**Code:**
```yaml
      - name: Dependency audit (high/critical)
        shell: bash
        run: |
          set -euo pipefail
          mkdir -p .security
          audit_exit=0
          pnpm -w audit --audit-level=high --json > .security/pnpm-audit.json || audit_exit=$?

          if [ "$audit_exit" -ne 0 ]; then
            echo "Dependency audit failed with exit code $audit_exit"
            echo "Non-blocking in mode=${{ inputs.mode }}. Continuing."
          fi
```

And in `deploy.yml` (lines 105, 635):
```yaml
          AUDIT_BLOCKING: '0'
```

**Why this matters:**
Known HIGH/CRITICAL CVEs in production dependencies can ship to production without any gate blocking them. The audit step creates an artifact but never enforces. This undermines the entire supply-chain security posture of the CI pipeline.

---

### [HIGH] Finding #3: Repository retry circuit breaker test uses tautological assertion

**File:** `backend/tests/repository-retry.test.ts`
**Lines:** 5-8
**Category:** `false-confidence`

**Description:**
The first test case ("resets circuit breaker registry") calls `resetCircuitBreakers()` but asserts `expect(true).toBe(true)`. It verifies only that the function does not throw -- it does not verify that the registry was actually reset (e.g., by checking that a previously-open circuit is now closed).

**Code:**
```ts
describe('repository retry circuit breaker', () => {
  it('resets circuit breaker registry', () => {
    resetCircuitBreakers()
    expect(true).toBe(true)
  })
```

**Why this matters:**
If `resetCircuitBreakers()` silently fails (e.g., due to a refactor that removes its side effect), this test will still pass. The circuit breaker is a critical resilience mechanism -- its reset path should be properly verified.

---

### [HIGH] Finding #4: API keys service test only verifies module exports, not behavior

**File:** `backend/tests/api-keys-service.test.ts`
**Lines:** 1-8
**Category:** `false-confidence`

**Description:**
This test file's sole assertion is that the imported module has more than zero exports. It does not test any actual API key creation, validation, revocation, or rotation logic. This is a "module loads" smoke test that inflates coverage metrics but provides no behavioral guarantees.

**Code:**
```ts
describe('api keys service module', () => {
  it('exports api key service functions', async () => {
    const mod = await import('../plane-a/src/services/api-keys')
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
```

**Why this matters:**
API key management is a security-critical service path. A test that only checks the module loads provides zero assurance about key generation randomness, validation correctness, scope enforcement, or revocation behavior. Any regression in these paths would go undetected.

---

### [HIGH] Finding #5: CloudWatch metrics test only verifies module exports, not behavior

**File:** `backend/tests/cloudwatch-metrics.test.ts`
**Lines:** 1-8
**Category:** `false-confidence`

**Description:**
Identical pattern to the API keys service test. This test dynamically imports the CloudWatch metrics module and asserts only that it has exports. No metric emission, dimension correctness, or error handling is tested.

**Code:**
```ts
describe('cloudwatch metrics module', () => {
  it('exports cloudwatch metric functions', async () => {
    const mod = await import('../shared/cloudwatch-metrics')
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
```

**Why this matters:**
If CloudWatch metric publishing silently breaks (wrong namespace, dropped dimensions, serialization errors), the observability system loses visibility. A metric function that loads but emits garbage will pass this test.

---

### [HIGH] Finding #6: Bronze storage test only verifies module exports, not behavior

**File:** `backend/tests/bronze-storage.test.ts`
**Lines:** 25-30
**Category:** `false-confidence`

**Description:**
Same "module loads" pattern. The bronze storage module handles S3 read/write of raw provider data. The test mocks the config and logger but only asserts the module has exports.

**Code:**
```ts
describe('bronze storage module', () => {
  it('exports bronze storage helpers', async () => {
    const mod = await import('../shared/bronze-storage')
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
```

**Why this matters:**
Bronze storage is the ingestion tier for raw provider data. If S3 writes silently fail, data is lost. This test provides no assurance about correct S3 key generation, error handling on failed uploads, or content integrity.

---

### [HIGH] Finding #7: Gold indices SQL regression test uses function stringification instead of actual SQL validation

**File:** `backend/tests/gold-indices-sql-regression.test.ts`
**Lines:** 6-12
**Category:** `test-smell`

**Description:**
This test aims to catch SQL regressions but does so by converting a function to a string and checking if it contains the substring 'indicesUpsertQuery'. This is extremely fragile -- it tests implementation details (variable naming) rather than SQL correctness. Renaming the variable would break the test, while a genuine SQL regression (incorrect column alias, wrong JOIN) would not be caught.

**Code:**
```ts
describe('Gold indices SQL regression', () => {
  it('does not reference prev_teer_rate alias in same SELECT', async () => {
    // Ensure the module (and its SQL) loads without throwing and contains
    // the expected regression guard CTE name.
    //
    // We deliberately avoid executing against a real DB in unit tests.
    expect(String(upsertGoldIndices)).toContain('indicesUpsertQuery')
  })
})
```

**Why this matters:**
The test name says "does not reference prev_teer_rate alias in same SELECT" but the assertion does not check for the absence of `prev_teer_rate`. It only checks that the function body contains a variable name. This is a false-confidence regression test that cannot catch the SQL regression it claims to guard against.

---

### [MEDIUM] Finding #8: Evidence DAST workflow uses continue-on-error on all security scan steps

**File:** `.github/workflows/evidence-security-dast.yml`
**Lines:** 62, 80, 90, 110, 120, 133, 156, 177, 188, 210, 220, 241
**Category:** `ci-blind-spot`

**Description:**
Every single step in the evidence DAST workflow (ZAP baseline, Nuclei unauth, ZAP auth, Nuclei auth, ZAP full, and all their policy enforcement steps) has `continue-on-error: true`. This means the workflow will report success even if every security scan finds critical vulnerabilities and every policy gate rejects them.

**Code:**
```yaml
      - name: Run ZAP baseline (unauth)
        id: zap_baseline
        continue-on-error: true
        # ...

      - name: Enforce ZAP baseline policy
        id: zap_baseline_policy
        if: always()
        continue-on-error: true
        # ...

      - name: Run Nuclei (unauth)
        id: nuclei_unauth
        continue-on-error: true
        # ...
```

**Why this matters:**
The entire DAST evidence pipeline is "fire-and-forget" -- it can never gate a deployment or raise a blocking signal. Security findings become informational artifacts only. This converts the DAST workflow from a gate into a decoration.

---

### [MEDIUM] Finding #9: Secret scanning workflow has continue-on-error on detect-secrets audit step

**File:** `.github/workflows/secret-scanning.yml`
**Lines:** 86-94
**Category:** `ci-blind-spot`

**Description:**
Both the `detect-secrets scan` and `detect-secrets audit` steps have `|| true` or `continue-on-error: true`, ensuring the workflow always succeeds regardless of whether secrets are detected in the codebase.

**Code:**
```yaml
      - name: Run detect-secrets scan
        run: |
          detect-secrets scan --baseline .secrets.baseline || true
        continue-on-error: true

      - name: Audit baseline
        run: |
          detect-secrets audit .secrets.baseline
        continue-on-error: true
```

**Why this matters:**
The `detect-secrets` tool exists specifically to catch leaked credentials. With `|| true` and `continue-on-error: true`, any secret leak it detects will be silently ignored. The TruffleHog and Gitleaks jobs in the same workflow do fail properly, but detect-secrets provides complementary detection patterns that are completely neutered here.

---

### [MEDIUM] Finding #10: Provider fixture tests are excluded by default, only run when RUN_PROVIDER_FIXTURES=1

**File:** `backend/vitest.config.ts`
**Lines:** 4, 20-28
**Category:** `coverage-gap`

**Description:**
The vitest config excludes all provider parse tests (`*-parse.test.ts`), corridor tests (`*-corridors.test.ts`), and fetch tests (`*-fetch.test.ts`) unless the env var `RUN_PROVIDER_FIXTURES=1` is set. The CI workflow does not set this variable, meaning approximately 40+ provider-specific test files are silently skipped on every CI run.

**Code:**
```ts
const includeProviderFixtures = process.env.RUN_PROVIDER_FIXTURES === '1'

export default defineConfig({
  test: {
    // ...
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      ...(includeProviderFixtures
        ? []
        : [
            '**/tests/*-parse.test.ts',
            '**/tests/*-corridors.test.ts',
            '**/tests/*corridors*.test.ts',
            '**/tests/*-fetch.test.ts',
          ]),
    ],
```

**Why this matters:**
This means the parse/fetch logic for all providers (Wise, Remitly, Western Union, Ria, Xe, etc.) is never validated in CI. If a provider changes their API response format, the parser regression would not be caught until runtime. These tests account for roughly 40 of the ~100 backend test files, representing a large portion of nominally-covered code that is actually untested in CI.

---

### [MEDIUM] Finding #11: Coverage enforcement is conditional on ENFORCE_COVERAGE env var

**File:** `backend/vitest.config.ts`
**Lines:** 5, 51-63
**Category:** `coverage-gap`

**Description:**
When `ENFORCE_COVERAGE` is not set to `'1'`, all coverage thresholds are set to 0%. While CI does set `ENFORCE_COVERAGE: '1'`, local development runs and any ad-hoc test execution will report no coverage failures. More importantly, the threshold is a global 80% -- the comment mentions 85% critical-path gates via Codecov flags, but the local config does not enforce this.

**Code:**
```ts
const enforceCoverage = process.env.ENFORCE_COVERAGE === '1'
// ...
      thresholds: enforceCoverage
        ? {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
          }
        : {
            statements: 0,
            branches: 0,
            functions: 0,
            lines: 0,
          },
```

**Why this matters:**
An 80% global threshold is reasonable but can mask critical paths with low coverage when averaged with well-tested modules. The comment says critical-path modules are enforced at 85% via Codecov flags, but this is an external service dependency -- if Codecov is misconfigured or unavailable, the only gate is the 80% global threshold that may hide a 30% coverage in, say, the billing webhook handler.

---

### [MEDIUM] Finding #12: SQL string interpolation in test fixtures creates bad practice patterns

**File:** `backend/tests/cache-ttl-e2e.test.ts`
**Lines:** 87
**Category:** `test-smell`

**Description:**
Test fixtures use JavaScript template literal interpolation directly inside SQL strings (e.g., `INTERVAL '${i} hours'`). While this is a loop counter and not user input, it sets a bad pattern and normalizes non-parameterized SQL in the codebase. The production code has a SQL guardrail (scripts/sql-guardrail.ts) that scans for this pattern -- but the tests directory is not scanned.

**Code:**
```ts
await pool.query(
  `INSERT INTO silver.quote_record
   (provider_id, corridor_id, ... collected_at, ...)
   VALUES ($1, $2, ..., NOW() - INTERVAL '${i} hours', NOW(), $12, $13)`,
  [providerId, corridorId, ...]
)
```

**Why this matters:**
Although test fixtures are not production code, this pattern appears 4 times across 2 test files. If a developer copies this pattern into production code, the SQL guardrail should catch it -- but the normalization of string interpolation in SQL within the test directory weakens developer awareness of the anti-pattern.

---

### [MEDIUM] Finding #13: Deploy workflow has no explicit dependency on CI test jobs

**File:** `.github/workflows/deploy.yml`
**Lines:** 1-37
**Category:** `ci-blind-spot`

**Description:**
The deploy workflow triggers on `workflow_run` (when ci/main completes successfully) OR on `workflow_dispatch`. When triggered via `workflow_dispatch`, there is no `needs:` dependency on any test job. This means a manual dispatch can deploy code that has never been tested. The `workflow_run` trigger does check `conclusion == 'success'`, but only for the `ci/main` workflow -- not for the PR workflow.

**Code:**
```yaml
on:
  workflow_run:
    workflows: ['ci/main']
    types: [completed]
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:
    inputs:
      env:
        description: Environment to deploy
        required: true
        type: choice
        options:
          - dev
          - staging
```

**Why this matters:**
A `workflow_dispatch` or a tag push can deploy untested code directly to staging or dev environments. While the workflow_run gate is present for automatic deploys from develop/main, the manual dispatch and tag-push paths bypass all CI test gates.

---

### [LOW] Finding #14: b2c refresh worker test validates source code content, not runtime behavior

**File:** `backend/tests/b2c-refresh-worker.test.ts`
**Lines:** 6-12
**Category:** `test-smell`

**Description:**
This test reads the source file with `readFileSync` and checks if it contains certain strings ('createShutdownHandler(' and 'processQuoteRefreshQueue({ signal'). This is a static analysis assertion masquerading as a unit test. It verifies code exists, not that it works correctly.

**Code:**
```ts
describe('b2c refresh worker script wiring', () => {
  it('passes shutdown signal into queue processing', () => {
    const file = path.join(process.cwd(), 'scripts', 'b2c-refresh-worker.ts')
    const content = readFileSync(file, 'utf8')

    expect(content).toContain('createShutdownHandler(')
    expect(content).toContain('processQuoteRefreshQueue({ signal')
  })
})
```

**Why this matters:**
This is not a traditional test smell with false-pass risk (if the strings are removed, the test will fail). However, it tests implementation structure rather than behavior. If the shutdown handler is present but misconfigured, this test cannot detect that.

---

### [LOW] Finding #15: Multiple backend route modules lack dedicated test files

**File:** Multiple files under `backend/plane-a/src/routes/`
**Lines:** N/A
**Category:** `missing-test`

**Description:**
The following route modules have no corresponding test files: `compliance.ts`, `telemetry.ts`, `sessions.ts`, `watchlist.ts`, `marketing.ts`, `analytics.ts`, `data-export.ts`, `rates.ts`, `pulse.ts`, `pulse-status.ts`, `pulse-teaser.ts`, `bank-vs-specialist.ts`, `newsletter.ts`, `notifications.ts`, `recent-searches.ts`, `geo.ts`, `history.ts`, `corridor-currencies.ts`, `corridor-limits.ts`, `provider-visits.ts`, `indices.ts`, `billing/history.ts`, `billing/portal.ts`, `billing/pricing.ts`, `billing/verify-session.ts`, and several `ops/*` routes.

While these routes may have some integration coverage via the smoke test or `buildApp()` tests, they lack dedicated unit tests that verify their validation logic, error handling, and authorization behavior.

**Why this matters:**
Routes are the API surface of the application. Without dedicated tests, validation bugs, missing auth checks, and incorrect response shapes can ship to production. The 80% global coverage threshold may mask low coverage in these specific files.

---

### [LOW] Finding #16: Frontend has only 1 e2e auth-session-persistence spec, no CSRF or token-refresh e2e coverage

**File:** `frontend/tests/e2e/auth-session-persistence.spec.ts`
**Lines:** N/A
**Category:** `coverage-gap`

**Description:**
The frontend e2e test suite has 11 spec files covering checkout flow, comparison flow, consent ads, corridor action states, smoke, status, watchlist features, and auth session persistence. However, there are no e2e tests for CSRF token validation, JWT token refresh flows, session expiry edge cases, or OAuth callback handling. Given that the backend enforces JWT authentication (`PLANE_A_REQUIRE_JWT`), the absence of token-refresh and session-expiry e2e tests means auth edge cases are untested end-to-end.

**Why this matters:**
Auth session bugs are among the most impactful in production -- they cause users to be silently logged out, see stale data, or experience access control failures. Without e2e tests covering token refresh and session expiry, these paths are only tested through unit-level mocks that may not reflect real browser behavior.

---
