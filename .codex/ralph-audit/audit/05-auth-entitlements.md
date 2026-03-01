# Auth & Entitlements Deep Audit Findings

Audit Date: 2026-02-28T22:15:00Z
Files Examined: 38
Total Findings: 14

## Summary by Severity
- Critical: 1
- High: 4
- Medium: 5
- Low: 4

## Remediation Status (FIX-RS-004+)

| Finding | Status | Evidence |
|---|---|---|
| #1 Unbounded token cache in `remote-verify` | fixed | `backend/plane-a/src/auth/remote-verify.ts`, `backend/tests/supabase-jwt.test.ts` |
| #2 Admin role mutation privilege escalation | fixed | `backend/plane-a/src/routes/admin.ts` (`requireSuperAdmin`) |
| #3 Admin plan grant/revoke super-admin guard | fixed | `backend/plane-a/src/routes/admin.ts` (`requireSuperAdmin`) |
| #4 Admin exchange missing tight rate limit | fixed | `backend/plane-a/src/routes/sessions.ts` (`ADMIN_EXCHANGE_RATE_LIMIT`), `backend/tests/sessions-route.test.ts` |
| #5 Admin MFA gate bypass/fragility | fixed | `backend/plane-a/src/plugins/auth-plugin.ts`, `backend/plane-a/src/auth/admin-jwt.ts`, `backend/plane-a/src/routes/sessions.ts` |
| #6 Frontend admin middleware client-state trust | fixed | `frontend/middleware/admin.ts` |
| #7 JWKS verification fail-open fallback | fixed | `backend/plane-a/src/auth/verify-supabase-jwt.ts` |
| #8 `requireEntitlement` missing user presence checks | fixed | `backend/plane-a/src/plugins/auth-plugin.ts` |
| #9 Admin exchange body-token path | fixed | `backend/plane-a/src/routes/sessions.ts`, `backend/tests/sessions-route.test.ts` |
| #10 MFA middleware SSR/client parity gap | fixed | `frontend/middleware/mfa-required.global.ts` |
| #11 API key in-memory limiter eviction gap | fixed | `backend/plane-a/src/plugins/auth-plugin.ts` (`API_KEY_RATE_LIMIT_MAX_ENTRIES`) |
| #12 Max token age parse fail-open | fixed | `backend/plane-a/src/auth/verify-supabase-jwt.ts`, `backend/tests/supabase-jwt.test.ts` |
| #13 `/compliance/status` unauthenticated exposure | fixed | `backend/plane-a/src/routes/compliance.ts`, `backend/tests/compliance-route.test.ts` |
| #14 `/sessions/track` unauthenticated abuse surface | fixed | `backend/plane-a/src/routes/sessions.ts`, `backend/tests/sessions-route.test.ts` |

---

## Findings

### [CRITICAL] Finding #1: Remote verify cache uses raw token as key -- unbounded memory growth and timing oracle

**File:** `backend/plane-a/src/auth/remote-verify.ts`
**Lines:** 4-21
**Category:** `security`

**Description:**
The `remoteVerify` module caches successfully verified users in an in-memory `Map` keyed by the full raw JWT token string. There is no eviction, no maximum size, and no cleanup mechanism. Every unique valid token seen during a server's lifetime is cached indefinitely until TTL-based expiry is checked on read. In a Lambda or long-lived ECS environment, this creates:
1. An unbounded memory leak -- each cached entry stores the full token (typically 1-2KB) plus the AuthUser object.
2. A timing side-channel -- `Map.get()` with a cache hit returns faster than a cache miss that hits the network, allowing an attacker to probe whether a specific token has been recently used.
3. Stale session persistence -- a revoked user continues to be authenticated for up to `remoteVerifyCacheTtlSeconds` because the cache is never invalidated when a session is revoked.

**Code:**
```ts
const cache = new Map<string, { user: AuthUser; expiresAt: number }>()

const getFromCache = (token: string) => {
  const cached = cache.get(token)
  if (!cached) {
    return null
  }
  if (Date.now() >= cached.expiresAt) {
    cache.delete(token)
    return null
  }
  return cached.user
}

const setCache = (token: string, user: AuthUser) => {
  const ttlSeconds = config.auth.supabase.remoteVerifyCacheTtlSeconds
  cache.set(token, { user, expiresAt: Date.now() + ttlSeconds * 1000 })
}
```

**Why this matters:**
In production, every unique access token creates a new cache entry. With thousands of active users, the Map grows without bound. More critically, when admin sessions are revoked (JTI revocation in Redis), the Supabase remote-verify path still serves the cached AuthUser, creating a window where revoked sessions remain valid. This directly undermines the session revocation security model.

---

### [HIGH] Finding #2: Admin role escalation -- `requireAdmin` does not require `super_admin` for role mutations

**File:** `backend/plane-a/src/routes/admin.ts`
**Lines:** 389-436
**Category:** `auth-bypass`

**Description:**
The `PATCH /admin/users/role` endpoint uses `requireAdmin()` as its guard, which allows any admin-level user to change any user's role to `super_admin`. There is no check that the acting admin is themselves a `super_admin`. This means a regular admin can escalate their own or another user's privileges to `super_admin`, gaining access to all `requireSuperAdmin()` protected routes (e.g., database DDL operations via `/ops/db/ensure-alert-notification-attempts`).

**Code:**
```ts
app.patch('/admin/users/role', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = roleSchema.safeParse(request.body ?? {})
    // ...
    const { user_id: userId, email, role } = parsed.data
    // role can be 'super_admin' -- no check that the caller is super_admin
    const updated = userId
      ? await userAccountRepository.updateUserRole({ user_id: userId, app_role: role })
      : await userAccountRepository.updateUserRoleByEmail(email!, role)
```

**Why this matters:**
This is a privilege escalation vulnerability. Any user with admin access can grant themselves or others `super_admin` privileges, which unlocks database DDL execution, API key visibility for all users, and full platform control. The role mutation endpoint should require `requireSuperAdmin()`.

---

### [HIGH] Finding #3: Admin plan grant/revoke lacks super_admin requirement

**File:** `backend/plane-a/src/routes/admin.ts`
**Lines:** 163, 280
**Category:** `missing-guard`

**Description:**
The `POST /admin/plans/grant` and `POST /admin/plans/revoke` endpoints allow any admin to grant or revoke enterprise access for any user. These are financially significant operations (enterprise plan grants bypass Stripe billing entirely) and should require `super_admin` privileges. A compromised or rogue admin account can grant unlimited enterprise access or revoke paid users' subscriptions.

**Code:**
```ts
app.post('/admin/plans/grant', { preHandler: requireAdmin() }, async (request, reply) => {
    // ...
    await query(
      `UPDATE silver.user_plan
       SET plan_code = $2, status = 'active',
           enterprise_granted_at = CASE WHEN $3 THEN NOW() ELSE NULL END,
           enterprise_granted_by = CASE WHEN $3 THEN $4::uuid ELSE NULL END,
           ...
      `,
```

**Why this matters:**
Enterprise plan grants bypass the Stripe payment flow entirely. Any admin can grant enterprise access worth significant revenue to arbitrary users, or revoke paying users' subscriptions. Combined with Finding #2 (any admin can self-elevate), this creates a chain where a single compromised admin account can grant unlimited free enterprise access.

---

### [HIGH] Finding #4: Session exchange endpoint lacks rate limiting on authentication attempts

**File:** `backend/plane-a/src/routes/sessions.ts`
**Lines:** 58-145
**Category:** `security`

**Description:**
The `POST /sessions/admin/exchange` endpoint accepts a Supabase token (either in the request body or via the Authorization header), verifies it, checks admin access, and issues a Plane-A admin session (access + refresh tokens). This endpoint has no dedicated rate limiting beyond the general API rate limiter. An attacker with a stolen or leaked Supabase token can rapidly exchange it for admin sessions. The general rate limiter (600 req/min for admin paths) is far too permissive for an authentication endpoint.

**Code:**
```ts
app.post('/sessions/admin/exchange', async (request, reply) => {
    // No requireAuth() guard -- this IS the login endpoint
    const parsed = exchangeSessionSchema.safeParse(request.body ?? {})
    // ...
    const bodyToken = parsed.data.supabase_token
    const authorizationHeader = bodyToken
      ? `Bearer ${bodyToken}`
      : request.headers.authorization

    const authResult = await verifySupabaseJwt(authorizationHeader)
```

**Why this matters:**
This is the admin login endpoint. Without tight per-IP rate limiting (e.g., 5 attempts per minute), an attacker who obtains a valid Supabase token can rapidly generate admin sessions. The current 600 req/min general rate limit provides no meaningful protection for this authentication-critical path.

---

### [HIGH] Finding #5: `requireAdmin` checks MFA only when `ADMIN_MFA_REQUIRED` env var is set, and defaults to true but can be trivially disabled

**File:** `backend/plane-a/src/plugins/auth-plugin.ts`
**Lines:** 419-432, 484-488
**Category:** `security`

**Description:**
The `requireAdmin()` guard checks for TOTP MFA enrollment only if `adminMfaRequired` is true. The value is derived from `ADMIN_MFA_REQUIRED` environment variable. While it defaults to true (any value other than `0`, `false`, `no`, `off`), the check inspects the `amr` (Authentication Methods Reference) claim in the JWT. However, when `isPlaneAAdminAccessClaims` returns true (meaning the token was issued by the Plane-A admin JWT system, not Supabase), the `amr` array comes from the admin JWT claims -- and `issuePlaneAAdminAccessToken` never sets an `amr` claim. This means the MFA check effectively only applies during the initial Supabase exchange, but subsequent requests using the Plane-A admin access token will not have `amr` data, and the check will always fail (blocking admin access entirely) or always pass (if `adminMfaRequired` is false).

**Code:**
```ts
if (adminMfaRequired) {
  const amr = Array.isArray(claims?.amr) ? claims.amr as Array<{ method?: string }> : []
  const hasTotpAmr = amr.some(entry => entry && entry.method === 'totp')
  if (!hasTotpAmr) {
    logger.warn('admin_mfa_required', {
      user_id: request.user.user_id,
    })
    reply.code(403)
    return reply.send({
      error: 'mfa_required',
      message: 'Multi-factor authentication is required for admin access.',
    })
  }
}
```

```ts
// In admin-jwt.ts -- no amr claim is set
const token = await new SignJWT({
  email: input.email ?? undefined,
  role: toSafeRole(input.role, input.appRole),
  app_role: input.appRole ?? undefined,
  token_type: ADMIN_TOKEN_TYPE,
  refresh_family_id: input.refreshFamilyId,
})
```

**Why this matters:**
If `adminMfaRequired` is true, every admin request using a Plane-A issued admin JWT will be rejected with "mfa_required" because the issued JWT lacks `amr` claims. This means either: (a) MFA enforcement is disabled in production to avoid blocking admins, or (b) admins always use Supabase tokens directly (bypassing the admin session system). Either way, MFA enforcement for admin routes has a structural gap.

---

### [MEDIUM] Finding #6: Frontend admin middleware relies on client-side `isAdmin` check that can be spoofed

**File:** `frontend/middleware/admin.ts`
**Lines:** 1-25
**Category:** `broken-logic`

**Description:**
The frontend admin middleware first checks `isAdmin.value` or `user.value?.isAdmin` from the client-side auth composable. If those are truthy, the middleware returns immediately without server verification. While this is a frontend-only guard (backend still enforces auth), it means the admin UI is accessible if a user manipulates their local auth state to set `isAdmin: true`. The `/me` API call fallback only runs if the local check fails.

**Code:**
```ts
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { ensureHydrated, isAuthenticated, user, isAdmin } = useAuth()
  const { request } = useApi()

  await ensureHydrated()
  if (!isAuthenticated.value) {
    return navigateTo('/sign-in')
  }

  if (isAdmin.value || user.value?.isAdmin) {
    return // Trusts client-side state
  }

  try {
    const me = await request<{ user?: { is_admin?: boolean } }>('/me', { retries: 0 })
    if (!me?.user?.is_admin) {
      return navigateTo('/')
    }
  }
  catch {
    return navigateTo('/')
  }
})
```

**Why this matters:**
A non-admin user who modifies local storage or composable state to set `isAdmin: true` will see the admin UI and can attempt admin API calls. The backend will reject unauthorized calls, but exposing the admin interface leaks admin endpoint paths, form structures, and internal terminology. Defense in depth requires the frontend to always verify admin status server-side.

---

### [MEDIUM] Finding #7: JWKS verification silently falls back to remote verify on signature failure

**File:** `backend/plane-a/src/auth/verify-supabase-jwt.ts`
**Lines:** 60-97
**Category:** `broken-logic`

**Description:**
When `verifyMode` is `auto` (the default), JWKS signature verification failure silently falls through to `remoteVerify`. This means if an attacker presents a token with a valid structure but invalid signature, the system will still authenticate them via the Supabase `/auth/v1/user` endpoint (which validates the token server-side). While this is not a bypass per se (Supabase still verifies the token), it masks JWKS configuration issues and means the system never truly validates signatures locally in `auto` mode -- it always has a network-dependent fallback that increases latency and creates a dependency on Supabase availability for every auth decision.

**Code:**
```ts
if (allowJwks) {
    let keys = getCachedJwks()
    if (!keys) {
      keys = await fetchJwks()
      // ...
    }
    if (keys && keys.length > 0) {
      const user = await verifyWithJwks(token, keys)
      if (user) {
        const ageError = enforceMaxTokenAge(token)
        if (ageError) return ageError
        return user
      }
    }
    // Falls through silently to remoteVerify
    if (!allowRemote) {
      return makeError('invalid_token', 'JWT verification failed')
    }
  }

  if (allowRemote) {
    const user = await remoteVerify(token)
```

**Why this matters:**
In `auto` mode, JWKS misconfiguration (wrong URL, rotated keys, network issues) is silently masked. The system appears to work but is actually making an HTTP call to Supabase for every authentication, increasing latency by 50-200ms and creating a single point of failure. Additionally, `remoteVerify` caches results (see Finding #1), so a token verified via the remote path may persist in cache even after the JWKS issue is resolved.

---

### [MEDIUM] Finding #8: `requireEntitlement` allows API key access without verifying `request.user` is set

**File:** `backend/plane-a/src/plugins/auth-plugin.ts`
**Lines:** 644-658
**Category:** `broken-logic`

**Description:**
In the `requireEntitlement` handler, after checking for `institutionalClient`, the code resolves `userId` from either `request.user?.user_id` or `request.apiKey?.user_id`. If an API key is provided but is invalid (resulting in `request.apiKeyError` being set and `request.apiKey` being undefined), and no `request.user` exists, the code falls through to the `!userId` branch and returns 401. This is correct. However, if a valid API key is present (`request.apiKey` is set), `request.user` may be undefined. The subsequent plan/entitlement checks use `request.user` to decide paid entitlement enforcement (line 676: `if (request.user && isPaidEntitlement(entitlement) && !isPlanActive(plan.status))`). Since `request.user` is null for API key auth, this check is skipped for API key users, meaning an API key user with an inactive plan could bypass the paid entitlement enforcement.

**Code:**
```ts
const userId = request.user?.user_id ?? request.apiKey?.user_id
if (!userId) {
  // ... returns 401
}
// ...
if (request.apiKey && plan.plan_code !== 'enterprise') {
  reply.code(403)
  return reply.send({ error: 'enterprise_required' })
}
if (request.apiKey && !isPlanActive(plan.status)) {
  reply.code(403)
  return reply.send({ error: 'plan_inactive' })
}
if (request.user && isPaidEntitlement(entitlement) && !isPlanActive(plan.status)) {
  reply.code(403)
  return reply.send({ error: 'plan_inactive' })
}
```

**Why this matters:**
The logic is actually protected for API key users by the `request.apiKey && !isPlanActive(plan.status)` check on line 672. However, the code structure is fragile -- there is a subtle ordering dependency where the API key path is checked separately from the user path. If future refactoring consolidates these checks, the inactive-plan bypass for API key users could be accidentally introduced. The asymmetry between the two paths is a maintenance hazard.

---

### [MEDIUM] Finding #9: Admin session exchange accepts Supabase token in request body, bypassing header-based security logging

**File:** `backend/plane-a/src/routes/sessions.ts`
**Lines:** 58-79
**Category:** `security`

**Description:**
The session exchange endpoint accepts the Supabase token either via the `Authorization` header or in the request body (`supabase_token` field). When the token is in the body, the global auth preHandler (in `auth-plugin.ts`) will not see it because it only reads `request.headers.authorization`. This means `request.user` will be null during the global auth hook, and the auth failure audit logging path will not fire. The endpoint does its own verification, but the global audit logging for failed auth attempts is bypassed for body-token requests.

**Code:**
```ts
app.post('/sessions/admin/exchange', async (request, reply) => {
    const parsed = exchangeSessionSchema.safeParse(request.body ?? {})
    // ...
    const bodyToken = parsed.data.supabase_token
    const authorizationHeader = bodyToken
      ? `Bearer ${bodyToken}`
      : request.headers.authorization

    const authResult = await verifySupabaseJwt(authorizationHeader)
```

**Why this matters:**
An attacker brute-forcing stolen tokens via the body parameter will not trigger the global auth failure audit logging, reducing visibility for security monitoring. The endpoint does log audit events on success, but failed attempts with body tokens produce no audit trail.

---

### [MEDIUM] Finding #10: MFA-required frontend middleware skips server-side rendering entirely

**File:** `frontend/middleware/mfa-required.global.ts`
**Lines:** 12-13
**Category:** `broken-logic`

**Description:**
The MFA-required global middleware has `if (import.meta.server) return` as its first statement, meaning it never runs during SSR. This is standard for Nuxt client-side middleware, but it means the initial page load of admin pages or enterprise pages on the server will never redirect to the MFA enrollment page. Only after client-side hydration will the MFA check kick in. During the SSR window, the page content (including admin UI structure) is rendered and sent to the client before the MFA redirect fires.

**Code:**
```ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  // ... MFA check only happens client-side
})
```

**Why this matters:**
Sensitive page layouts and admin UI structure are exposed in the initial HTML response before MFA is enforced. While the backend API calls will still require proper auth, the HTML skeleton of the admin interface is visible. This is a defense-in-depth concern rather than a direct bypass.

---

### [LOW] Finding #11: In-memory API key rate limit store has no eviction

**File:** `backend/plane-a/src/plugins/auth-plugin.ts`
**Lines:** 29, 30
**Category:** `slop`

**Description:**
Two `Map` objects (`apiKeyRateLimitStore` and `institutionalDailyRateLimitStore`) are used as fallback rate limiters when Redis is unavailable. Neither has a size limit or periodic cleanup. While entries do have TTL-based expiration checked on read, expired entries are never proactively cleaned up if they are not accessed again. In a long-running process with many unique API keys, these Maps grow without bound.

**Code:**
```ts
const apiKeyRateLimitStore = new Map<string, RateLimitEntry>()
const institutionalDailyRateLimitStore = new Map<string, RateLimitEntry>()
```

**Why this matters:**
In Lambda deployments, this is a non-issue (instances are short-lived). In long-running ECS or local dev environments where Redis is down, the Maps will grow proportionally to the number of unique rate limit keys seen over the process lifetime, eventually causing memory pressure. This is a reliability concern rather than a security vulnerability.

---

### [LOW] Finding #12: `enforceMaxTokenAge` returns null on parse failure instead of rejecting

**File:** `backend/plane-a/src/auth/verify-supabase-jwt.ts`
**Lines:** 33-52
**Category:** `broken-logic`

**Description:**
The `enforceMaxTokenAge` function returns `null` (meaning "no error, proceed") when it cannot parse the `iat` claim from the token. This means a malformed token that passes signature verification but lacks a valid `iat` claim will bypass the max-token-age check entirely.

**Code:**
```ts
const enforceMaxTokenAge = (token: string): AuthError | null => {
  if (!maxTokenAgeSeconds) return null
  try {
    const payload = decodeJwt(token)
    const iat = payload.iat
    if (typeof iat !== 'number' || !Number.isFinite(iat)) {
      return null  // Allows tokens without valid iat
    }
    // ...
  } catch (error) {
    // ...
    return null  // Allows tokens that fail to parse
  }
}
```

**Why this matters:**
If a Supabase token is issued without an `iat` claim (unlikely but possible with custom token configurations), or if `decodeJwt` fails on a token that was already signature-verified, the max token age enforcement is silently skipped. This is a fail-open design that weakens the session freshness guarantee.

---

### [LOW] Finding #13: `/compliance/status` endpoint has no auth guard and exposes configuration details

**File:** `backend/plane-a/src/routes/compliance.ts`
**Lines:** 4-24
**Category:** `missing-guard`

**Description:**
The `/compliance/status` endpoint is publicly accessible without any authentication. It exposes the system's compliance certification status, SOC2 report dates, and privacy control implementation details. While this information may be intentionally public, it reveals internal architecture decisions and certification timelines to unauthenticated users.

**Code:**
```ts
export const complianceRoutes = async (app: FastifyInstance) => {
  app.get('/compliance/status', async () => ({
    updated_at: new Date().toISOString(),
    certifications: {
      gdpr: config.compliance.certifications.gdpr,
      ccpa: config.compliance.certifications.ccpa,
      soc2_type_ii: {
        status: config.compliance.certifications.soc2_type_ii.status,
        report_state: config.compliance.certifications.soc2_type_ii.report_state,
        report_date: config.compliance.certifications.soc2_type_ii.report_date,
        // ...
```

**Why this matters:**
Exposing SOC2 audit dates, compliance status, and report URLs can inform targeted attacks timed around certification gaps. If this is intentionally public (e.g., for transparency), it should be documented as such. Otherwise, it should require at minimum authentication.

---

### [LOW] Finding #14: `sessions/track` endpoint is unauthenticated and accepts arbitrary session IDs

**File:** `backend/plane-a/src/routes/sessions.ts`
**Lines:** 358-420
**Category:** `security`

**Description:**
The `/sessions/track` endpoint is listed in `PLANE_A_AUTH_BYPASS_ROUTE_POLICIES` and requires no authentication. It accepts an arbitrary `session_id` and optional `anon_id`, then creates or updates a session record in the database. While it does derive a rotating session ID from the input, an attacker could flood the database with fake session records by calling this endpoint repeatedly with different session IDs.

**Code:**
```ts
app.post('/sessions/track', async (request) => {
    try {
      const body = trackSessionSchema.parse(request.body ?? {})
      const sessionId = deriveRotatingSessionId(body.session_id)
      // ...
      if (!request.user && !anonId) {
        throw new ValidationError('Anonymous id is required for unauthenticated tracking', {
          details: [{ message: 'missing_anon_id' }],
        })
      }
      // ...
      await repository.createSession({
        sessionId,
        userId: request.user?.user_id,
        anonId,
        // ...
      })
```

**Why this matters:**
The endpoint relies on the general rate limiter for protection, but a distributed attack could fill the session table with junk data, increasing database size and degrading query performance. The `deriveRotatingSessionId` provides some mitigation by normalizing inputs, but the attack surface remains. This is documented as intentionally unauthenticated in `PLANE_A_AUTH_BYPASS_ROUTE_POLICIES`.

---

## Architecture Notes (Not Findings)

The following patterns were observed and are noted for completeness but are not findings:

1. **Admin IP allowlist is enforced in production/staging** -- `registerAdminIpAllowlist` is registered and `ADMIN_IP_ALLOWLIST` is required in prod-like environments. Good.

2. **Stripe webhook uses signature verification** -- The billing webhook properly verifies Stripe signatures and supports secret rotation with multiple candidate secrets. Good.

3. **Admin session refresh uses token family rotation with replay detection** -- The refresh flow uses database-level `FOR UPDATE` locking, family-based revocation on replay detection, and proper token rotation. This is a solid implementation.

4. **Audit logging is comprehensive** -- Nearly every admin and security-sensitive operation has audit event logging with `getRequestContext`. Failures in audit logging are caught and do not block the operation, which is the correct pattern.

5. **CORS requires explicit origins** -- The app throws on startup if `PLANE_A_CORS_ORIGINS` is empty, preventing permissive CORS misconfiguration.

6. **Backend proxy forwards auth headers** -- The frontend `backendProxy.ts` correctly forwards `authorization` and `cookie` headers to the backend, preserving the auth chain.
