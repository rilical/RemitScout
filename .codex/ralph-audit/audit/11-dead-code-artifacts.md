# Dead Code & Artifacts Deep Audit Findings

Audit Date: 2026-02-28T22:15:00Z
Files Examined: 347
Total Findings: 12

## Summary by Severity
- Critical: 1
- High: 4
- Medium: 5
- Low: 2

## Remediation Status (FIX-RS-004+)

| Finding | Status | Evidence |
|---|---|---|
| #1 `.d.ts` artifacts in source tree | fixed | removed generated files; CI guard `backend/scripts/ci/guard-generated-artifacts.ts`; `.gitignore` source `.d.ts` rules |
| #2 Timestamped CDK snapshot directories tracked | fixed | `infrastructure/cdk/.gitignore`, removal of `infrastructure/cdk/cdk.out*`, CI guard |
| #3 `shared/types/` reported dead | already_fixed_with_evidence | actively imported by `backend/plane-b/src/agents/*`, `backend/plane-b/src/handlers/*`, `backend/plane-b/src/triangulation/*` |
| #4 `shared/provider-weights.ts` orphaned | fixed | file removed (`backend/shared/provider-weights.ts`) |
| #5 `shared/node-polyfills.ts` orphaned | already_fixed_with_evidence | imported by `backend/plane-b/src/collectors/http-client.ts` and `backend/plane-b/src/providers/mukuru/fetch.ts` |
| #6 Dead `oanda-code-map` re-export | fixed | `backend/plane-a/src/services/oanda-code-map.ts` removed |
| #7 Dead `routes/providers.ts` barrel | fixed | `backend/plane-a/src/routes/providers.ts` removed |
| #8 Placeholder test in gold export guardrails | fixed | `backend/tests/gold-export-guardrails.test.ts` |
| #9 Lambda cold-start debug `console.log` | fixed | `backend/plane-a/src/lambda.ts` (no debug console logs) |
| #10 Stale dist artifacts for deleted sources | fixed | CI guard `backend/scripts/ci/guard-generated-artifacts.ts` |
| #11 `.DS_Store` artifacts | fixed | `.gitignore` + no tracked `.DS_Store` |
| #12 Empty frontend domain scaffold placeholders | fixed | removed `frontend/domains/{account,admin,content,enterprise,providers}/**` placeholder scaffolds |

---

## Findings

### [CRITICAL] Finding #1: ~140 TypeScript declaration files (.d.ts) committed inside plane-b source tree

**File:** `backend/plane-b/src/**/*.d.ts`
**Lines:** All lines (entire files)
**Category:** `stale-artifact`

**Description:**
Approximately 140 `.d.ts` TypeScript declaration files are checked into the `plane-b/src/` source directory alongside their `.ts` source counterparts. These are `tsc` compiler output artifacts that belong in `dist/`, not in `src/`. They span every provider module (alansari, bossmoney, dahabshiil, instarem, intermex, koronapay, mukuru, orbitremit, pangea, paysend, placid, remitbee, remitly, ria, sendwave, singx, transfergo, wellsfargo, westernunion, wise, worldremit, xe, xoom, wirebarley), the collectors subsystem, the normalize layer, notifications, signals, and the lib directory.

Representative files include:
- `backend/plane-b/src/collectors/base.d.ts`
- `backend/plane-b/src/providers/alansari/collector.d.ts`
- `backend/plane-b/src/notifications/dispatcher.d.ts`
- `backend/plane-b/src/signals/anomaly-detector.d.ts`

**Code:**
```ts
// backend/plane-b/src/collectors/base.d.ts (line 1-18, truncated)
import type { Pool } from 'pg';
import type { NormalizedQuote } from '../normalize/quote-normalizer';
export type CollectorResumeStatus = {
    canCollect: boolean;
    reason: string;
};
export type AttemptInput = {
    corridorId: string;
    amountBucket: number;
    payinMethod: string;
    payoutMethod: string;
    success: boolean;
    errorType?: string | null;
    httpStatus?: number | null;
    errorMessage?: string | null;
    bronzeObjectKey?: string | null;
    requestFingerprint: string;
};
```

**Why this matters:**
Build artifacts in the source tree cause TypeScript to resolve types from `.d.ts` instead of the canonical `.ts` source, masking real type errors during development. They also bloat the repository, slow down git operations, confuse code search results, and create merge conflicts when the source files change. At ~140 files this represents a significant maintenance and correctness risk. The `.gitignore` does not exclude `*.d.ts` from `plane-b/src/`.

---

### [HIGH] Finding #2: 9 timestamped CDK deploy snapshot directories staged for commit

**File:** `infrastructure/cdk/cdk.out.deploy.{1772215058,1772215291,1772215337,1772215388,1772215426,1772215511,1772215765,1772217052,1772224350}/`
**Lines:** N/A (directory-level)
**Category:** `stale-artifact`

**Description:**
Nine CDK CloudFormation synthesis snapshot directories with Unix-epoch timestamps are staged in git. Each contains full CloudFormation templates (`*.template.json`), asset manifests, `tree.json`, and in two cases PID lock files (`read.91293.1.lock`, `read.92867.1.lock`). The root `.gitignore` excludes `cdk.out/` and `infrastructure/cdk/cdk.out/` but does NOT exclude `cdk.out.deploy.*` or `cdk.out.staging-refactor/`. These are ephemeral deploy-time artifacts that should never be committed.

**Code:**
```
infrastructure/cdk/cdk.out.deploy.1772215765/read.91293.1.lock  -> contains "91293" (PID)
infrastructure/cdk/cdk.out.deploy.1772217052/read.92867.1.lock  -> contains "92867" (PID)
```

**Why this matters:**
These directories add hundreds of kilobytes of JSON CloudFormation templates per snapshot, inflating the repository. The PID lock files are process-specific ephemeral artifacts that signal the deploy snapshots were accidentally committed. They may also contain AWS account IDs and resource ARNs that should not be in version control for security reasons.

---

### [HIGH] Finding #3: Entire `shared/types/` directory is dead code -- zero consumers

**File:** `backend/shared/types/module-spec.ts`, `backend/shared/types/observation.ts`, `backend/shared/types/observation-payloads.ts`, `backend/shared/types/failure-bundle.ts`, `backend/shared/types/tool-gateway.ts`, `backend/shared/types/factor.ts`, `backend/shared/types/job.ts`
**Lines:** All lines in each file
**Category:** `dead-code`

**Description:**
Seven type definition files in `backend/shared/types/` export a total of 30+ types, interfaces, and constants. Despite being well-documented and designed for the "agent-native platform" architecture, NONE of these exports are imported by any consumer file in the entire codebase. The only exception is `correlation.ts` which is re-exported through `shared/index.ts` and used.

The dead files and their exports:
- `module-spec.ts`: `ModuleStatus`, `ModuleQuarantineReason`, `PolicyFlags`, `ModuleRuntimeState`, `ModuleSpec`, `DEFAULT_POLICY_FLAGS`
- `observation.ts`: `ObservationType`, `ObservationConfidence`, `ObservationEnvelope`
- `observation-payloads.ts`: `QuoteObservationPayload`, `StatusObservationPayload`, `CardBaselineObservationPayload`, `FailureObservationPayload`, `HealthCheckObservationPayload`, `RateLimitObservationPayload`, `DomSignatureObservationPayload`, `EventObservationPayload`, `ObservationPayloadMap`
- `failure-bundle.ts`: `FailureSeverity`, `FailureCategory`, `FailureBundle`, `FailureBundleThresholds`, `DEFAULT_FAILURE_BUNDLE_THRESHOLDS`
- `tool-gateway.ts`: `ToolType`, `ToolRequest`, `ToolResult`, `ToolGatewayPolicy`, `DEFAULT_TOOL_GATEWAY_POLICY`
- `factor.ts`: `FactorSource`, `FactorConfidence`, `Factor`
- `job.ts`: `JobStatus`, `JobRun`, `JobHandler`, `JobContext`, `JobResult`

**Code:**
```ts
// backend/shared/types/tool-gateway.ts (lines 90-98)
export const DEFAULT_TOOL_GATEWAY_POLICY: ToolGatewayPolicy = {
  allowedTools: ['http_fetch', 'db_query', 'redis_command', 'file_read', 'git_read'],
  approvalRequired: ['git_write', 'github_api', 'shell_exec', 'file_write'],
  maxConcurrentRequests: 3,
  rateLimitMaxRequests: 60,
  rateLimitWindowMs: 60_000,
  domainAllowlist: [],
  writeEnabled: false,
}
```

**Why this matters:**
These types define contracts for the observation pipeline, failure bundles, tool gateway, module lifecycle, and job system -- core platform concepts. Having them defined but unused creates a false sense of system maturity: developers may assume these subsystems are wired in when they are not. The runtime constants (`DEFAULT_POLICY_FLAGS`, `DEFAULT_FAILURE_BUNDLE_THRESHOLDS`, `DEFAULT_TOOL_GATEWAY_POLICY`) add dead bundle weight. If these are aspirational types for a future feature, they should be documented as such or removed until needed.

---

### [HIGH] Finding #4: `shared/provider-weights.ts` is entirely orphaned

**File:** `backend/shared/provider-weights.ts`
**Lines:** 1-44
**Category:** `dead-code`

**Description:**
The `provider-weights.ts` file exports `PROVIDER_VOLUME_WEIGHTS`, `DEFAULT_PROVIDER_WEIGHT`, `getProviderVolumeWeight()`, `getProviderWeightEntries()`, and `PROVIDER_WEIGHTING_MODEL`. A grep across the entire backend codebase finds zero imports of this file. Meanwhile, the weighting model IS implemented in the separate `shared/weighting-model.ts` file (which IS imported by 6 files). This appears to be an earlier or parallel implementation that was superseded by `weighting-model.ts` but never cleaned up.

**Code:**
```ts
// backend/shared/provider-weights.ts (lines 1-44)
export type ProviderWeightModel = 'provider_volume' | 'equal'

export const PROVIDER_VOLUME_WEIGHTS: Record<string, number> = {
  westernunion: 5,
  wise: 4,
  remitly: 4,
  ria: 3,
  // ... 20+ more entries
}

export const getProviderVolumeWeight = (providerId?: string | null): number => {
  if (!providerId) return DEFAULT_PROVIDER_WEIGHT
  const key = providerId.trim().toLowerCase()
  return PROVIDER_VOLUME_WEIGHTS[key] ?? DEFAULT_PROVIDER_WEIGHT
}
```

**Why this matters:**
Having two files that both define provider weighting logic (`provider-weights.ts` and `weighting-model.ts`) creates confusion about which is the canonical source of truth. A developer may modify the dead file thinking it affects production behavior. The heuristic weight constants are also potentially sensitive business logic sitting in an unreferenced file.

---

### [HIGH] Finding #5: `shared/node-polyfills.ts` is orphaned -- no importer

**File:** `backend/shared/node-polyfills.ts`
**Lines:** 1-15
**Category:** `dead-code`

**Description:**
This file provides polyfills for `globalThis.File` and `String.prototype.toWellFormed`. It is not imported by any file in the backend. These polyfills are typically needed for Node.js < 20 compatibility, but if they are not imported at application startup, they have no effect.

**Code:**
```ts
// backend/shared/node-polyfills.ts (lines 1-15)
import { File } from 'node:buffer'

if (typeof globalThis.File === 'undefined') {
  globalThis.File = File as unknown as typeof globalThis.File
}

const stringPrototype = String.prototype as {
  toWellFormed?: () => string
}

if (typeof stringPrototype.toWellFormed !== 'function') {
  stringPrototype.toWellFormed = function toWellFormed(): string {
    return String(this)
  }
}
```

**Why this matters:**
If the application needs these polyfills for compatibility, their absence as an import means they are silently not running. If the application does NOT need them (e.g., running Node 20+), the file should be removed to avoid confusion. Either way, the current state is a defect.

---

### [MEDIUM] Finding #6: `plane-a/src/services/oanda-code-map.ts` is a dead re-export barrel

**File:** `backend/plane-a/src/services/oanda-code-map.ts`
**Lines:** 1-6
**Category:** `dead-code`

**Description:**
This file re-exports all four functions from `shared/oanda-code-map.ts` but is never imported by any other file. The only consumer is `shared/oanda-client.ts` which imports directly from `shared/oanda-code-map`. Additionally, two of the four exported functions (`mapCountryToOanda` and `validateOandaCurrency`) are never called by any consumer anywhere in the codebase -- they are defined in `shared/oanda-code-map.ts` but only used internally or via re-export chains that nobody consumes.

**Code:**
```ts
// backend/plane-a/src/services/oanda-code-map.ts (lines 1-6)
export {
  mapCountryToOanda,
  mapOandaCurrencyPair,
  normalizeOandaCurrency,
  validateOandaCurrency,
} from '../../../shared/oanda-code-map'
```

**Why this matters:**
Dead re-export barrels add indirection without value. They appear in code search results, making it harder to trace the actual dependency graph. The two unused functions (`mapCountryToOanda`, `validateOandaCurrency`) in the shared file also represent dead code that adds maintenance burden.

---

### [MEDIUM] Finding #7: `plane-a/src/routes/providers.ts` is a dead barrel file

**File:** `backend/plane-a/src/routes/providers.ts`
**Lines:** 1
**Category:** `dead-code`

**Description:**
This file re-exports `providersRoutes` from `./providers/index`, but the only consumer (`plane-a/src/app.ts` line 32) imports directly from `./routes/providers/index`, bypassing this barrel entirely.

**Code:**
```ts
// backend/plane-a/src/routes/providers.ts (line 1)
export { providersRoutes } from './providers/index'
```

```ts
// backend/plane-a/src/app.ts (line 32) -- imports directly, skipping the barrel
import { providersRoutes } from './routes/providers/index'
```

**Why this matters:**
The barrel file suggests it is the canonical import path, but the actual usage bypasses it. This inconsistency can mislead developers about the intended module boundary.

---

### [MEDIUM] Finding #8: Placeholder test with TODO -- gold-export-guardrails.test.ts

**File:** `backend/tests/gold-export-guardrails.test.ts`
**Lines:** 1-11
**Category:** `dead-code`

**Description:**
This test file contains a single `it()` block that asserts `expect(true).toBe(true)` -- a no-op placeholder. The `TODO` comment describes the intended behavior (asserting export queries only read gold tables), but the test has no real assertions. This passes CI but provides zero coverage.

**Code:**
```ts
// backend/tests/gold-export-guardrails.test.ts (lines 1-11)
import { describe, it, expect } from 'vitest'

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
Placeholder tests create a false sense of coverage. The gold-export guardrail is a data integrity requirement -- queries must not read from silver/bronze schemas. Without real assertions, a regression could ship to production undetected. The test name actively misleads: it claims to "document" a requirement while testing nothing.

---

### [MEDIUM] Finding #9: `console.log` debug statement in production Lambda cold-start path

**File:** `backend/plane-a/src/lambda.ts`
**Lines:** 195-205
**Category:** `debug-leftover`

**Description:**
A `console.log('Lambda init env snapshot', {...})` call exists in the Lambda cold-start initialization path. While it only logs whether env vars are "set" or "missing" (not their values), it bypasses the structured logger (`createLogger`) that the rest of the application uses, and will emit unstructured text to CloudWatch Logs on every cold start.

**Code:**
```ts
// backend/plane-a/src/lambda.ts (lines 195-205)
    console.log(
      'Lambda init env snapshot',
      {
        DATABASE_URL_PLANE_A: process.env.DATABASE_URL_PLANE_A ? 'set' : 'missing',
        DATABASE_URL_PLANE_B: process.env.DATABASE_URL_PLANE_B ? 'set' : 'missing',
        DATABASE_URL_PLANE_C: process.env.DATABASE_URL_PLANE_C ? 'set' : 'missing',
        PLANE_A_DB_HOST: process.env.PLANE_A_DB_HOST ? 'set' : 'missing',
        PLANE_A_DB_PORT: process.env.PLANE_A_DB_PORT ? 'set' : 'missing',
        PLANE_A_DB_NAME: process.env.PLANE_A_DB_NAME ? 'set' : 'missing',
      },
    )
```

**Why this matters:**
This `console.log` outputs unstructured text that breaks the JSON-structured log pipeline used by the rest of the application. CloudWatch Logs Insights queries filtering on structured fields will miss this entry. It is likely a debug statement left from a deployment troubleshooting session. The logger is initialized just below this line (line 220), suggesting this was a workaround for logging before the structured logger was available -- but the proper fix would be to buffer and emit via the structured logger.

---

### [MEDIUM] Finding #10: Stale dist artifacts for deleted source files

**File:** `backend/dist/plane-a/services/stripe-mock.js`, `backend/dist/plane-a/services/stripe-mock.d.ts`, `backend/dist/plane-b/services/corridor-tier-suggestions.{js,d.ts}`, `backend/dist/plane-b/services/corridor-tier-lists.{js,d.ts}`, `backend/dist/plane-a/routes/marketplace-aws.js`
**Lines:** N/A (entire files)
**Category:** `stale-artifact`

**Description:**
Multiple compiled JavaScript and declaration files exist in `backend/dist/` with no corresponding source `.ts` file in the source tree:
- `dist/plane-a/services/stripe-mock.{js,d.ts}` -- no `plane-a/src/services/stripe-mock.ts` exists
- `dist/plane-b/services/corridor-tier-suggestions.{js,d.ts}` -- no `plane-b/src/services/corridor-tier-suggestions.ts` exists
- `dist/plane-b/services/corridor-tier-lists.{js,d.ts}` -- no `plane-b/src/services/corridor-tier-lists.ts` exists
- `dist/plane-a/routes/marketplace-aws.js` -- no `plane-a/src/routes/marketplace-aws.ts` exists

These are remnants of source files that were deleted but whose compiled output was never cleaned.

**Code:**
```
# Files with no corresponding source:
backend/dist/plane-a/services/stripe-mock.js
backend/dist/plane-a/services/stripe-mock.d.ts
backend/dist/plane-b/services/corridor-tier-suggestions.js
backend/dist/plane-b/services/corridor-tier-suggestions.d.ts
backend/dist/plane-b/services/corridor-tier-lists.js
backend/dist/plane-b/services/corridor-tier-lists.d.ts
backend/dist/plane-a/routes/marketplace-aws.js
```

**Why this matters:**
Stale dist artifacts can be accidentally imported at runtime if a module resolution path matches. The `stripe-mock` artifact is particularly concerning -- if any test or dev script inadvertently imports from `dist/`, it would load code for a deleted mock service. The `backend/.gitignore` does list `dist` but these files appear to have been committed before the gitignore rule was added.

---

### [LOW] Finding #11: `.DS_Store` files in frontend directory

**File:** `frontend/.DS_Store`, `frontend/png/.DS_Store`
**Lines:** N/A (binary files)
**Category:** `stale-artifact`

**Description:**
Two macOS `.DS_Store` files exist in the frontend directory tree. The root `.gitignore` includes a `.DS_Store` exclusion rule, but these files appear to have been committed before the rule was added. The `frontend/png/` directory itself appears to be empty aside from the `.DS_Store` file.

**Code:**
```
frontend/.DS_Store
frontend/png/.DS_Store   # parent directory is otherwise empty
```

**Why this matters:**
`.DS_Store` files are macOS Finder metadata that should never be in version control. The empty `frontend/png/` directory with only a `.DS_Store` is a dead directory that adds clutter. Low severity because these have no runtime impact, but they indicate gaps in the git hygiene process.

---

### [LOW] Finding #12: Five empty domain scaffold directories in frontend with `export {}` barrels

**File:** `frontend/domains/account/index.ts`, `frontend/domains/admin/index.ts`, `frontend/domains/content/index.ts`, `frontend/domains/enterprise/index.ts`, `frontend/domains/providers/index.ts`
**Lines:** 1 (each file)
**Category:** `dead-code`

**Description:**
Five frontend domain directories (`account`, `admin`, `content`, `enterprise`, `providers`) each contain an `index.ts` exporting nothing (`export {}`), a `docs/README.md`, and four subdirectories (`application/`, `domain/`, `infrastructure/`, `ui/`) that each contain only a `.gitkeep` placeholder. None of these domains are imported by any file in the frontend codebase. They appear to be scaffold stubs created during domain-driven design planning but never implemented.

**Code:**
```ts
// frontend/domains/account/index.ts (line 1)
export {}
```

```
# Each domain contains this structure with zero real code:
frontend/domains/account/
  index.ts          -> export {}
  docs/README.md
  application/.gitkeep
  domain/.gitkeep
  infrastructure/.gitkeep
  ui/.gitkeep
```

**Why this matters:**
Empty scaffold directories create noise in the codebase and give a misleading impression of feature completeness. With 5 domains x 6 files each = 30 empty/stub files, this is significant clutter. Low severity because there is no runtime impact, but the empty barrels can confuse module resolution tooling and IDE autocompletion.

---

## Recommendations

1. **Immediate (Critical/High):**
   - Delete all `*.d.ts` files from `backend/plane-b/src/` and add `backend/plane-b/src/**/*.d.ts` to `.gitignore`
   - Add `infrastructure/cdk/cdk.out.deploy.*` and `infrastructure/cdk/cdk.out.staging*` to `.gitignore`, then remove the staged directories
   - Either implement consumers for `shared/types/` or move them to a `shared/types/_future/` directory with a README explaining they are aspirational
   - Delete `shared/provider-weights.ts` (superseded by `shared/weighting-model.ts`)
   - Delete or import `shared/node-polyfills.ts` at startup

2. **Short-term (Medium):**
   - Delete `plane-a/src/services/oanda-code-map.ts` and `plane-a/src/routes/providers.ts` dead barrels
   - Replace the `console.log` in `lambda.ts` with a structured logger call or delete it
   - Implement real assertions in `gold-export-guardrails.test.ts` or remove the placeholder test
   - Run `git rm --cached` on the stale `dist/` artifacts

3. **Hygiene (Low):**
   - Run `git rm --cached` on `.DS_Store` files
   - Decide on the empty frontend domain scaffolds: implement or remove
