# Config & Secrets Deep Audit Findings

Audit Date: 2026-02-28T19:45:00Z
Files Examined: 22
Total Findings: 14

## Summary by Severity
- Critical: 3
- High: 4
- Medium: 5
- Low: 2

## Remediation Status (FIX-RS-004+)

| Finding | Status | Evidence |
|---|---|---|
| #1 `frontend/.env.local` live credential exposure | already_fixed_with_evidence | `.gitignore` (`**/.env*` ignore rules), file is non-tracked runtime local state |
| #2 JWT secret empty/default not enforced | fixed | `backend/shared/config.ts`, `backend/shared/config-schema.ts`, `backend/scripts/ci/validate-runtime-config.ts` |
| #3 Privacy salts fallback constant | fixed | `backend/plane-a/src/services/privacy-utils.ts`, `backend/shared/config.ts`, `backend/shared/config-schema.ts` |
| #4 Staging examples contained sensitive placeholders/identifiers | fixed | `backend/.env.staging.example`, `frontend/.env.staging.example` |
| #5 DB SSL mode unset in staging examples | fixed | `backend/.env.staging.example` (`DB_SSL_MODE=require`, `PGSSLMODE=require`) |
| #6 New Relic browser key exposure in staging example | fixed | `frontend/.env.staging.example` |
| #7 Push notification secrets read outside centralized config | fixed | `backend/plane-b/src/notifications/config.ts`, `backend/plane-a/src/services/push-delivery.ts`, `backend/shared/config.ts` |
| #8 Auth bypass flags in base examples | already_fixed_with_evidence | Protected env fail-closed checks in `backend/shared/config-schema.ts` and `backend/scripts/ci/validate-runtime-config.ts` |
| #9 DB URL examples with embedded credentials | fixed | `backend/.env.staging.example` |
| #10 Dotenv gitignore gaps | fixed | `.gitignore`, `backend/.gitignore` |
| #11 Staging example admin email exposure | fixed | `backend/.env.staging.example` |
| #12 `ADMIN_IP_ALLOWLIST` raw env reads outside shared config | fixed | `backend/shared/config.ts`, `backend/plane-a/src/app.ts`, `backend/scripts/ci/validate-runtime-config.ts` |
| #13 Compiled JS duplicate in notifications config | fixed | removal of `backend/plane-b/src/notifications/config.js`; source-only `config.ts` + CI guard |
| #14 IssueOps schema local-only `$id` values | fixed | `.remit-scout/schema/*.json`, `SPECS/schema.*.json` |

---

## Findings

### [CRITICAL] Finding #1: Frontend `.env.local` contains live Supabase URL and API Gateway endpoint committed to working tree

**File:** `frontend/.env.local`
**Lines:** 1-7
**Category:** `secret-exposure`

**Description:**
The file `frontend/.env.local` contains a real Supabase project URL (`cipxzujlsbrqqrcxsfdp.supabase.co`), a real Supabase anon key (`sb_publishable_kTE2FMuKdzDWauf4fUqZaA_Ldt_s7iX`), and a real AWS API Gateway endpoint (`vhugw1jucg.execute-api.us-east-1.amazonaws.com`). While the frontend `.gitignore` does list `.env.local`, this file exists in the working tree and the root `.gitignore` pattern `*.env.local` may not cover all paths. Any accidental staging of this file would expose live infrastructure endpoints and credentials.

**Code:**
```
# Local dev config: proxy frontend -> AWS dev Plane A
PUBLIC_API_BASE=/api
API_BASE=https://vhugw1jucg.execute-api.us-east-1.amazonaws.com

# Supabase (required for auth flows)
PUBLIC_SUPABASE_URL=https://cipxzujlsbrqqrcxsfdp.supabase.co
PUBLIC_SUPABASE_ANON_KEY=sb_publishable_kTE2FMuKdzDWauf4fUqZaA_Ldt_s7iX
```

**Why this matters:**
The API Gateway ID and Supabase project ref are live infrastructure identifiers. The Supabase anon key, while designed to be public-facing in the browser, is paired here with the actual project URL in a file that could be accidentally committed. An attacker with these values can enumerate endpoints and attempt abuse. More importantly, the pattern signals that live credentials may be stored in local dotenv files without adequate protection.

---

### [CRITICAL] Finding #2: JWT secret defaults to empty string with no production enforcement

**File:** `backend/shared/config.ts`
**Lines:** 262, 1345, 1480
**Category:** `security`

**Description:**
The JWT secret (`PLANE_A_JWT_SECRET`) defaults to an empty string (`''`) when not set. The `assertRuntimeConfig` function supports a `requireJwtSecret` flag, but a search of all server startup code reveals it is never set to `true`. In `plane-a/src/server.ts`, the startup checks include `requireSupabase: isProdLikeEnv` and `requireStripe: isProdLikeEnv` but conspicuously omit `requireJwtSecret`. The CI validation script (`validate-runtime-config.ts` line 109) explicitly sets it to `false`. This means Plane A can start in staging/production with an empty or trivially guessable JWT secret.

**Code:**
```ts
// config.ts line 262
jwtSecret: process.env.PLANE_A_JWT_SECRET || '',

// config.ts line 1480
if (requirements.requireJwtSecret && !config.planeA.jwtSecret) {
  missing.push('PLANE_A_JWT_SECRET')
}

// validate-runtime-config.ts line 109
requireJwtSecret: false,
```

**Why this matters:**
An empty or weak JWT secret means any attacker can forge valid admin tokens for the Plane A API. The staging example file sets it to `change-me`, which is equally insecure. Without enforcement, the system silently operates with no JWT authentication even when `PLANE_A_REQUIRE_JWT=1` is set.

---

### [CRITICAL] Finding #3: Privacy hash and session salts fall back to a hardcoded constant

**File:** `backend/plane-a/src/services/privacy-utils.ts`
**Lines:** 20, 97, 188
**Category:** `security`

**Description:**
When `PRIVACY_HASH_SALT` and `PRIVACY_SESSION_SALT` environment variables are not configured (they default to empty strings in config.ts line 1139-1140), the privacy utilities silently fall back to a hardcoded constant `'remit-scout-privacy'`. This means in any deployment where these variables are not set -- including staging per `.env.staging.example` which leaves them blank -- all user privacy hashing uses a publicly known, static salt.

**Code:**
```ts
// privacy-utils.ts line 20
const DEFAULT_HASH_SALT = 'remit-scout-privacy'

// privacy-utils.ts line 97
.update(`${salt || config.privacy?.hashSalt || DEFAULT_HASH_SALT}:${value}`)

// privacy-utils.ts line 188
const salt = options.salt ?? config.privacy?.sessionSalt ?? DEFAULT_HASH_SALT
```

**Why this matters:**
Privacy hashing is used for user identification, session tokens, and GDPR-related data anonymization. A publicly known static salt means all hashed values are effectively deterministic and reversible via rainbow tables. The `.env.staging.example` file does not set these salts, and neither does `.env.example`, meaning most non-local environments run with the hardcoded default.

---

### [HIGH] Finding #4: Staging example ships placeholder secrets that could reach production

**File:** `backend/.env.staging.example`
**Lines:** 20-21, 55-58, 69, 144
**Category:** `misconfiguration`

**Description:**
The staging environment example contains placeholder values for security-critical secrets: `PLANE_A_API_KEYS=staging-key`, `PLANE_A_JWT_SECRET=change-me`, `STRIPE_SECRET_KEY=sk_test_change_me`, `STRIPE_WEBHOOK_SECRET=whsec_change_me`, `ALERT_UNSUBSCRIBE_SECRET=change-me`, and `SENTRY_DSN=change-me`. There is no startup guard that rejects these known placeholder values. If an operator copies the example file directly without replacing these values, the system starts with known-insecure credentials.

**Code:**
```
PLANE_A_API_KEYS=staging-key
PLANE_A_JWT_SECRET=change-me
STRIPE_SECRET_KEY=sk_test_change_me
STRIPE_WEBHOOK_SECRET=whsec_change_me
ALERT_UNSUBSCRIBE_SECRET=change-me
SENTRY_DSN=change-me
```

**Why this matters:**
The `assertRuntimeConfig` function only checks for empty strings, not for known placeholder values. A "change-me" JWT secret is trivially guessable. The staging API key `staging-key` provides zero security. Production-like environments should reject known placeholder values at startup.

---

### [HIGH] Finding #5: Database SSL mode is unset in all example files and defaults to empty

**File:** `backend/.env.example`
**Lines:** 153-155
**Category:** `misconfiguration`

**Description:**
The `DB_SSL_MODE` and `PGSSLMODE` variables are left empty in all example files (`.env.example` line 154-155, `.env.staging.example` does not include them at all). The config.ts file (line 1314) defaults `sslMode` to an empty string. This means database connections default to no SSL enforcement. The `.env.example` file even includes a comment recommending `require` or `verify-full` for staging/prod, but provides no value and no startup enforcement.

**Code:**
```
# backend/.env.example lines 153-155
# DB SSL mode (prefer `require`/`verify-full` in staging/prod)
DB_SSL_MODE=
PGSSLMODE=

# config.ts line 1314
sslMode: process.env.DB_SSL_MODE || process.env.PGSSLMODE || '',
```

**Why this matters:**
Without SSL enforcement, database traffic between application servers and the PostgreSQL instance travels in plaintext. In AWS environments, even VPC-internal traffic should use TLS to protect against packet sniffing and man-in-the-middle attacks. The staging example omits this entirely, meaning staging deployments likely run without DB SSL.

---

### [HIGH] Finding #6: New Relic browser license key committed in staging example

**File:** `frontend/.env.staging.example`
**Lines:** 30-37
**Category:** `secret-exposure`

**Description:**
The frontend staging example contains what appear to be real New Relic account identifiers and a browser agent license key: `PUBLIC_NEW_RELIC_ACCOUNT_ID=7756888`, `PUBLIC_NEW_RELIC_AGENT_ID=1134667802`, and `PUBLIC_NEW_RELIC_LICENSE_KEY=NRJS-dbf3b389e8bbb4f3cc3`. While browser license keys are designed to be exposed client-side, committing the actual values in an example file means they become part of the Git history permanently.

**Code:**
```
PUBLIC_NEW_RELIC_BROWSER_ENABLED=1
PUBLIC_NEW_RELIC_ACCOUNT_ID=7756888
PUBLIC_NEW_RELIC_TRUST_KEY=7756888
PUBLIC_NEW_RELIC_AGENT_ID=1134667802
PUBLIC_NEW_RELIC_APPLICATION_ID=1134667802
PUBLIC_NEW_RELIC_LICENSE_KEY=NRJS-dbf3b389e8bbb4f3cc3
PUBLIC_NEW_RELIC_BEACON=bam.nr-data.net
PUBLIC_NEW_RELIC_ERROR_BEACON=bam.nr-data.net
```

**Why this matters:**
Even though browser agent keys are semi-public, the account ID and license key together allow abuse: an attacker can inject fake telemetry data into the New Relic account, pollute dashboards, and potentially exceed ingest quotas. Example files should use placeholder values like the other `.example` files do.

---

### [HIGH] Finding #7: Push notification config reads secrets via raw `process.env` outside centralized config

**File:** `backend/plane-b/src/notifications/config.ts`
**Lines:** 36-38
**Category:** `misconfiguration`

**Description:**
The push notification config (`PUSH_CONFIG`) reads `FIREBASE_SERVER_KEY` directly from `process.env` (line 37) rather than through the centralized `config.ts` module. Similarly, `backend/plane-a/src/services/push-delivery.ts` reads `PUSH_WEB_VAPID_PRIVATE_KEY`, `PUSH_VAPID_PRIVATE_KEY`, and `PUSH_SNS_*` variables directly from `process.env` (lines 54-100). This bypasses the freeze-and-validate pattern used everywhere else, meaning these secrets are not covered by `assertRuntimeConfig` startup checks and are invisible to config auditing tools.

**Code:**
```ts
// plane-b/src/notifications/config.ts lines 36-38
export const PUSH_CONFIG = {
  PROVIDER: process.env.PUSH_PROVIDER || 'firebase',
  API_KEY: process.env.FIREBASE_SERVER_KEY || '',
  MAX_RETRIES: Number(process.env.PUSH_MAX_RETRIES) || 2,
} as const

// plane-a/src/services/push-delivery.ts lines 59-60
process.env.PUSH_WEB_VAPID_PRIVATE_KEY ||
process.env.PUSH_VAPID_PRIVATE_KEY ||
```

**Why this matters:**
Secrets read outside the centralized config are not validated at startup, not frozen as read-only, not auditable via CI scripts like `validate-runtime-config.ts`, and could be silently empty in production. VAPID private keys and Firebase server keys are high-value secrets. The PUSH_CONFIG also has a compiled `.js` duplicate (`config.js` lines 34-36) that duplicates the same direct `process.env` reads, creating two sources of truth.

---

### [MEDIUM] Finding #8: Auth bypass flags default to disabled in base example file

**File:** `backend/.env.example`
**Lines:** 10-12
**Category:** `missing-guard`

**Description:**
The base `.env.example` ships with `PLANE_A_REQUIRE_API_KEY=0` and `PLANE_A_REQUIRE_JWT=0`, meaning API key and JWT authentication are disabled by default. While the `config.ts` module does enable strict validation for production/staging environments, the default state in the example file creates a copy-paste path to running with auth completely disabled.

**Code:**
```
# backend/.env.example lines 10-12
PLANE_A_REQUIRE_API_KEY=0
# Boolean: accepts 1, true, yes
PLANE_A_REQUIRE_JWT=0
```

**Why this matters:**
If an operator provisions a new environment by copying `.env.example` without reviewing every setting, the API will run with no authentication. The `isStrictConfig` guard in `config.ts` line 88 only activates for `NODE_ENV=production` or `NODE_ENV=staging`. Any other environment name (e.g., `preview`, `qa`, `test`) will inherit the insecure defaults.

---

### [MEDIUM] Finding #9: Database URLs with embedded credentials in example files

**File:** `backend/.env.example`
**Lines:** 149-152
**Category:** `misconfiguration`

**Description:**
The example files contain database connection strings with embedded username/password pairs: `postgres://remit:remit@localhost:5432/remit`, `postgres://plane_a:plane_a@localhost:5432/remit`, etc. The staging example (lines 39-41) follows the same pattern with `db-host` as placeholder. While these are example/local values, the pattern of embedding credentials in connection URLs normalizes a practice that makes secret rotation difficult and increases the blast radius of any URL leak.

**Code:**
```
DATABASE_URL=postgres://remit:remit@localhost:5432/remit
DATABASE_URL_PLANE_A=postgres://plane_a:plane_a@localhost:5432/remit
DATABASE_URL_PLANE_B=postgres://plane_b:plane_b@localhost:5432/remit
DATABASE_URL_PLANE_C=postgres://plane_c:plane_c@localhost:5432/remit
```

**Why this matters:**
The config.ts file (lines 1094-1104) does support building URLs from separate host/port/username/password components and AWS Secrets Manager ARNs (lines 170-175), but the example files do not demonstrate this pattern. Operators following the examples will embed credentials in URLs, which end up in logs, error messages, and process environment listings.

---

### [MEDIUM] Finding #10: Root `.gitignore` pattern `*.env` may not match all dotenv files

**File:** `.gitignore`
**Lines:** 4-7
**Category:** `missing-guard`

**Description:**
The root `.gitignore` uses the pattern `*.env` to match env files. This glob matches files ending in `.env` (e.g., `backend/.env`, `.env`) but does NOT match files like `.env.staging`, `.env.production`, or `.env.brain`. The brain and frontdesk example files suggest environment-specific dotenv files (`.env.brain.example`, `.env.frontdesk.example`) whose actual counterparts (`.env.brain`, `.env.frontdesk`) would NOT be matched by the `*.env` pattern since they have additional suffixes. The pattern `*.env.*.local` covers some cases, but `.env.brain` or `.env.frontdesk` (without `.local` suffix) would not be excluded.

**Code:**
```
# .gitignore lines 4-7
*.env
*.env.local
*.env.*.local
*.secret.json
```

**Why this matters:**
If an operator creates `.env.brain` or `.env.frontdesk` with real GitHub tokens and Slack bot tokens (as suggested by the example files), these files would NOT be matched by the gitignore pattern and could be accidentally committed, leaking `GITHUB_TOKEN` and `SLACK_BOT_TOKEN` values.

---

### [MEDIUM] Finding #11: Staging example exposes real admin email addresses

**File:** `backend/.env.staging.example`
**Lines:** 13
**Category:** `secret-exposure`

**Description:**
The staging environment example contains real personal email addresses for admin access: `omar@remit-scout.com,austrilic@gmail.com,ghabayenedu@gmail.com,support@remit-scout.com`. These are committed to the repository and visible to anyone with repo access.

**Code:**
```
PLANE_A_ADMIN_EMAILS=omar@remit-scout.com,austrilic@gmail.com,ghabayenedu@gmail.com,support@remit-scout.com
```

**Why this matters:**
Personal email addresses in example files enable targeted phishing attacks against admin accounts. If an attacker knows the exact admin email list, they can craft more convincing social engineering attempts. Example files should use placeholder values like `admin@example.com`.

---

### [MEDIUM] Finding #12: `ADMIN_IP_ALLOWLIST` not in centralized config.ts, read via raw `process.env`

**File:** `backend/plane-a/src/app.ts`
**Lines:** 254-278
**Category:** `misconfiguration`

**Description:**
The admin IP allowlist -- a critical security control for protecting admin routes in production/staging -- is read directly from `process.env.ADMIN_IP_ALLOWLIST` in `plane-a/src/app.ts` (line 254) and `plane-a/src/plugins/ip-allowlist.ts` (line 43), bypassing the centralized `config.ts` module entirely. This variable is absent from the main `config.ts` file. The staging example (line 33) lists it as `<comma-separated-cidrs>` but there is no centralized validation.

**Code:**
```ts
// plane-a/src/app.ts lines 254, 274, 278
process.env.ADMIN_IP_ALLOWLIST ||
// ...
message: 'ADMIN_IP_ALLOWLIST must be configured for production/staging runtime.',
throw new Error('ADMIN_IP_ALLOWLIST is required in production/staging runtime.')
```

**Why this matters:**
A critical security variable that gates admin access is handled outside the centralized config system, making it invisible to CI config validation scripts and `assertRuntimeConfig()`. It relies on ad-hoc `process.env` reads and hardcoded throws rather than the structured validation used for every other config value.

---

### [LOW] Finding #13: Notification config has compiled `.js` duplicate alongside TypeScript source

**File:** `backend/plane-b/src/notifications/config.ts` and `backend/plane-b/src/notifications/config.js`
**Lines:** All
**Category:** `slop`

**Description:**
The notifications config exists as both `config.ts` (TypeScript source) and `config.js` (compiled JavaScript) in the same directory. The `.js` file contains the same `process.env` reads (lines 34-36) as the `.ts` file. Both files export `PUSH_CONFIG` with `FIREBASE_SERVER_KEY`. This creates two sources of truth, and depending on module resolution, either could be loaded at runtime.

**Code:**
```ts
// config.ts line 37
API_KEY: process.env.FIREBASE_SERVER_KEY || '',

// config.js line 35
API_KEY: process.env.FIREBASE_SERVER_KEY || '',
```

**Why this matters:**
Compiled `.js` files alongside `.ts` source in the source tree are a maintenance hazard. If the `.ts` file is updated but the `.js` is not recompiled, the runtime may load stale config. The `.gitignore` does not exclude this specific `.js` file.

---

### [LOW] Finding #14: IssueOps schemas use local-only `$id` URLs

**File:** `.remit-scout/schema/*.json`
**Lines:** Line 3 in each file
**Category:** `misconfiguration`

**Description:**
All seven IssueOps schema files use `$id` URLs with the domain `remit-scout.local` (e.g., `https://remit-scout.local/schema/plan.schema.json`). This `.local` TLD is reserved for mDNS and will never resolve on the public internet. While JSON Schema `$id` values are identifiers not URLs, using `.local` means any tooling that attempts to dereference these schemas (e.g., for `$ref` resolution or schema registries) will fail silently or produce confusing errors.

**Code:**
```json
"$id": "https://remit-scout.local/schema/plan.schema.json",
"$id": "https://remit-scout.local/schema/prd.schema.json",
"$id": "https://remit-scout.local/schema/run.schema.json",
"$id": "https://remit-scout.local/schema/skill.schema.json",
"$id": "https://remit-scout.local/schema/evidence.schema.json",
"$id": "https://remit-scout.local/schema/reason-code.schema.json",
"$id": "https://remit-scout.local/schema/case-index.schema.json",
```

**Why this matters:**
This is a low-severity issue. The `.local` domain signals internal-only usage, but if schemas are ever published or used across services, the non-resolvable `$id` will break standard JSON Schema tooling. Using a real domain or `urn:` prefix would be more correct.

---

## Additional Observations

### Positive Security Patterns Observed

1. **Deep freeze on config object** (config.ts line 331): The entire config is frozen with `deepFreeze()`, preventing runtime mutation of config values. This is a strong defense-in-depth measure.

2. **DB fallback disabled in strict mode** (config.ts lines 96-104): The `allowDbFallback` flag correctly prevents falling back to localhost database URLs in production/staging/AWS environments.

3. **Rate limit fallback mode forced to `reject` in production** (config.ts lines 60-76): The `toRateLimitFallbackMode` function forces `reject` mode in production-like environments regardless of the configured value.

4. **Structured AWS Secrets Manager support** (config.ts lines 170-175): The config supports `PLANE_B_DB_SECRET_ARN`, `PLANE_B_DB_SSM_NAME`, and similar patterns for retrieving secrets from AWS Secrets Manager rather than environment variables.

5. **Backend `.gitignore` excludes `.env.*`** (backend/.gitignore lines 1-3): The backend-specific gitignore uses `.env.*` which is more comprehensive than the root pattern.

### Files Examined

| File | Path |
|------|------|
| Backend env example | `backend/.env.example` |
| Backend env local example | `backend/.env.local.example` |
| Backend env staging example | `backend/.env.staging.example` |
| Frontend env staging example | `frontend/.env.staging.example` |
| Brain env example | `.env.brain.example` |
| Frontdesk env example | `.env.frontdesk.example` |
| Backend config | `backend/shared/config.ts` |
| Config helpers | `backend/shared/config-helpers.ts` |
| Load env | `backend/shared/load-env.ts` |
| Root package.json | `package.json` |
| Backend package.json | `backend/package.json` |
| Frontend package.json | `frontend/package.json` |
| Root gitignore | `.gitignore` |
| Backend gitignore | `backend/.gitignore` |
| Frontend gitignore | `frontend/.gitignore` |
| Notifications config | `backend/plane-b/src/notifications/config.ts` |
| Privacy utils | `backend/plane-a/src/services/privacy-utils.ts` |
| Push delivery | `backend/plane-a/src/services/push-delivery.ts` |
| Plane A server | `backend/plane-a/src/server.ts` |
| Backend .env | `backend/.env` |
| Backend .env.local | `backend/.env.local` |
| Frontend .env.local | `frontend/.env.local` |
