# Frontend & API Contract Deep Audit Findings

Audit Date: 2026-02-28T19:45:00Z
Files Examined: 58
Total Findings: 18

## Summary by Severity
- Critical: 3
- High: 5
- Medium: 6
- Low: 4

## Remediation Status (FIX-RS-004+)

| Finding | Status | Evidence |
|---|---|---|
| #1 OAuth callback open redirect | fixed | `frontend/pages/auth/callback.vue`, `frontend/tests/e2e/auth-redirect-security.spec.ts` |
| #2 Sign-in `?redirect=` open redirect | fixed | `frontend/pages/sign-in.vue`, `frontend/tests/e2e/auth-redirect-security.spec.ts` |
| #3 Admin check client-state short-circuit | fixed | `frontend/middleware/admin.ts` |
| #4 Admin token dual-header leak/stale precedence | fixed | `frontend/composables/useApi.ts`, `frontend/tests/unit/composables/useApi.test.ts` |
| #5 Audit date filter serialization bug | fixed | `frontend/pages/admin/audit.vue` |
| #6 `useEntitlements` incomplete backend user typing | fixed | `frontend/composables/useEntitlements.ts` |
| #7 Unsafe localStorage session restore | fixed | `frontend/composables/useAuth.ts` |
| #8 Audit pagination overshoot | fixed | `frontend/pages/admin/audit.vue` |
| #9 MFA bypass timing window in auth flow | fixed | `frontend/composables/useAuth.ts` |
| #10 Untyped audit logs (`any[]`) | fixed | `frontend/composables/useAudit.ts` |
| #11 Feature-flag key path injection | fixed | `frontend/pages/admin/feature-flags.vue` |
| #12 `go/[provider]` unvalidated redirect target | fixed | `frontend/pages/go/[provider].vue` |
| #13 Billing portal unvalidated outbound URL | fixed | `frontend/composables/useBilling.ts` |
| #14 Untrusted OTP `type` passthrough | fixed | `frontend/pages/auth/confirm.vue` |
| #15 Admin layout missing route-change revalidation | fixed | `frontend/layouts/admin.vue` |
| #16 `useCompareForm` singleton state leakage | fixed | `frontend/composables/useCompareForm.ts` |
| #17 Admin index timer leak | fixed | `frontend/pages/admin/index.vue` |
| #18 KaTeX fallback `v-html` sanitization gap | fixed | `frontend/components/shared/LaTeXFormula.vue` |

---

## Findings

### [CRITICAL] Finding #1: Open redirect via OAuth callback sessionStorage

**File:** `frontend/pages/auth/callback.vue`
**Lines:** 104-112
**Category:** `security`

**Description:**
After a successful OAuth sign-in, the redirect destination is read from `sessionStorage.getItem('auth:redirect')` and passed directly to `navigateTo()` without any validation. An attacker who controls the sessionStorage entry (e.g., via XSS in an adjacent page on the same origin, or by pre-setting it before the OAuth flow begins) can redirect the user to any URL, including a phishing site, with a valid authenticated session.

**Code:**
```vue
const redirect = import.meta.client
  ? sessionStorage.getItem('auth:redirect') || '/dashboard'
  : '/dashboard'

if (import.meta.client) {
  sessionStorage.removeItem('auth:redirect')
}

await navigateTo(redirect)
```

**Why this matters:**
This is a classic open redirect. After OAuth completes, a user can be silently sent to `https://evil.com/steal-token` with their freshly minted session. The `signInWithOAuth` function in `useAuth.ts` (line 501) writes the redirect path from an untrusted source (`redirectPath` parameter) without validation. Any caller can set this to an absolute URL.

---

### [CRITICAL] Finding #2: Open redirect via sign-in `?redirect=` query parameter

**File:** `frontend/pages/sign-in.vue`
**Lines:** 321, 342, 387, 416
**Category:** `security`

**Description:**
The sign-in page reads `route.query.redirect` and navigates to it after successful authentication. There is no validation that the redirect URL is a relative path or same-origin. An attacker can craft a URL like `/sign-in?redirect=https://evil.com` and after the user signs in, they will be redirected to the attacker's site.

**Code:**
```ts
// Line 321 - immediate redirect watch
watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    navigateTo(redirect)
  }
}, { immediate: true })

// Line 342 - after email sign-in
const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
// ...
await navigateTo(redirect)

// Line 387 - after MFA verify
const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
await navigateTo(redirect)
```

**Why this matters:**
This is exploitable in phishing campaigns. The attacker sends a link to `/sign-in?redirect=https://attacker.com/capture`, the user sees the legitimate Remit-Scout domain, signs in, and is seamlessly redirected to a lookalike page that harvests credentials or session tokens. The same pattern appears in `account/security.vue` line 257 (`router.replace(redirect)` from `route.query.redirect`).

---

### [CRITICAL] Finding #3: Admin role check relies solely on client-side state

**File:** `frontend/middleware/admin.ts`
**Lines:** 1-25
**Category:** `security`

**Description:**
The admin middleware skips the `/me` API call if `isAdmin.value` or `user.value?.isAdmin` is already truthy from client-side state. The `isAdmin` computed in `useAuth.ts` (lines 77-83) checks `user.value?.role` and `user.value?.appRole`, which are populated from `mapSupabaseUser()` -- a function that reads from `user_metadata`, which is user-controllable in Supabase. While a secondary `/me` call is made as fallback, the short-circuit means a user who has manipulated their Supabase `user_metadata` to include `role: "admin"` could bypass the server-side check entirely.

**Code:**
```ts
// middleware/admin.ts
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { ensureHydrated, isAuthenticated, user, isAdmin } = useAuth()
  const { request } = useApi()

  await ensureHydrated()
  if (!isAuthenticated.value) {
    return navigateTo('/sign-in')
  }

  // SHORT-CIRCUIT: if client state says admin, skip server check
  if (isAdmin.value || user.value?.isAdmin) {
    return
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
The `mapSupabaseUser()` function (line 46) does NOT set `role` or `isAdmin` -- it only sets `id`, `email`, and `name`. However, `applyBackendProfileState()` (line 255) does set these from the backend `/me` response. The risk is that if a user crafts a session where `user.value` has been partially populated (e.g., from a stale/tampered persisted session at line 110-120 in `readPersistedSession()`), the admin check is bypassed. The `/me` endpoint call should ALWAYS be made for admin paths rather than being short-circuited.

---

### [HIGH] Finding #4: Admin session token leak in dual-header pattern

**File:** `frontend/composables/useApi.ts`
**Lines:** 148-153
**Category:** `security`

**Description:**
The API client attaches admin tokens automatically to any request whose path starts with `/admin`, `/ops`, `/analytics`, or `/audit`. The `adminAccessToken` is sourced from a global `useState` store. If any non-admin composable accidentally makes a request to a path matching these prefixes, the admin token will be silently attached. Furthermore, the admin token check (line 148) runs before the regular user token check (line 151), meaning all admin-surface requests use the admin token even when it may be stale or the user's admin session has been revoked.

**Code:**
```ts
if (adminAccessToken && !hasAuthHeader && isAdminSurfacePath(path)) {
  headers.authorization = `Bearer ${adminAccessToken}`
}
else if (accessToken && !hasAuthHeader) {
  headers.authorization = `Bearer ${accessToken}`
}
```

**Why this matters:**
If the admin session is revoked server-side but the client-side `useState` still holds the old token, requests will silently use the revoked token and fail with 401, with no automatic session invalidation or redirect to sign-in. There is no token expiry revalidation before attaching the header. The `isTokenUsable` check only runs in `ensureAdminSession`, not on every request.

---

### [HIGH] Finding #5: Audit log date filter sends invalid ISO strings

**File:** `frontend/pages/admin/audit.vue`
**Lines:** 203-206
**Category:** `contract-drift`

**Description:**
The `buildQuery` function constructs ISO date strings using `new Date(startDate.value).toISOString()` where `startDate.value` is a `YYYY-MM-DD` string from an HTML date input. When parsed as `new Date('2026-02-28')`, JavaScript interprets this as UTC midnight. However, the `end_date` is also parsed the same way, meaning it represents the START of the end day, not the end. This silently excludes all audit events from the last day of the selected range.

**Code:**
```ts
const buildQuery = () => ({
  start_date: new Date(startDate.value).toISOString(),  // "2026-02-21T00:00:00.000Z"
  end_date: new Date(endDate.value).toISOString(),      // "2026-02-28T00:00:00.000Z" -- misses entire Feb 28
  // ...
})
```

**Why this matters:**
Admins investigating audit events for "today" will see no results for the current day. The end_date should be set to the end of the day (`T23:59:59.999Z`) or the backend should handle date-only strings inclusively. This is a silent data loss bug in a security-critical audit surface.

---

### [HIGH] Finding #6: `useEntitlements` calls `applyBackendProfile` with incomplete user object

**File:** `frontend/composables/useEntitlements.ts`
**Lines:** 163-165
**Category:** `broken-logic`

**Description:**
When `fetchPlan()` succeeds, it calls `applyBackendProfile(data.user)` with the user object from the `/me` response. However, the `MeResponse.user` type (line 33) only has `user_id`, `email`, and `name`. It does NOT include `role`, `app_role`, or `is_admin`. The `applyBackendProfileState` function in `useAuth.ts` (line 255) expects these fields and will set them from the payload. Since they're missing, every `fetchPlan()` call will reset `user.role`, `user.appRole`, and `user.isAdmin` to `null`/`false`, potentially de-escalating an admin user's client-side privileges.

**Code:**
```ts
// useEntitlements.ts line 163-165
if (data.user) {
  applyBackendProfile(data.user)
}

// The MeResponse.user type in useEntitlements.ts:
user: {
  user_id: string
  email: string
  name: string | null
  // Missing: role, app_role, is_admin
}
```

**Why this matters:**
After entitlements fetch, an admin user's `isAdmin` computed will return `false` because `user.value.role`, `user.value.appRole`, and `user.value.isAdmin` are all reset to their falsy defaults. This creates a race condition: if `fetchPlan()` runs after the admin middleware check, the admin session appears revoked on the client side, potentially breaking admin UI features or forcing unnecessary re-authentication.

---

### [HIGH] Finding #7: Persisted auth session from localStorage bypasses token validation

**File:** `frontend/composables/useAuth.ts`
**Lines:** 107-125, 164-169
**Category:** `security`

**Description:**
The `readPersistedSession()` function reads a session from `localStorage('remit-scout-auth')` and performs only structural validation (checks for `access_token`, `refresh_token`, and `user` fields). It does not validate the JWT signature, verify the token with Supabase, or check the `expires_at` field during parsing. The `isSessionExpired` check at line 166 catches expired tokens, but if `expires_at` is missing or set to a future date by a tampered payload, the session is accepted as valid.

**Code:**
```ts
const readPersistedSession = (): Session | null => {
  if (!import.meta.client || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('remit-scout-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Session>
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.access_token !== 'string' || typeof parsed.refresh_token !== 'string') {
      return null
    }
    if (!parsed.user || typeof parsed.user !== 'object') {
      return null
    }
    return parsed as Session  // No signature or integrity validation
  }
  catch {
    return null
  }
}
```

**Why this matters:**
If an attacker gains write access to localStorage (via XSS), they can inject a crafted session with arbitrary user data, a fake admin role, and a future `expires_at`. The session will be trusted by the client and used for all subsequent API requests until the server rejects the token. Combined with Finding #3 (admin middleware short-circuit), this could grant admin UI access.

---

### [HIGH] Finding #8: `nextPage` in audit pagination can overshoot total

**File:** `frontend/pages/admin/audit.vue`
**Lines:** 247-249
**Category:** `broken-logic`

**Description:**
The `nextPage()` function uses `Math.min(pagination.value.total, ...)` which can set `offset` equal to `total`, meaning the API receives an offset that returns zero results. The correct bound should be `total - limit`.

**Code:**
```ts
const nextPage = () => {
  pagination.value.offset = Math.min(pagination.value.total, pagination.value.offset + pagination.value.limit)
  void loadLogs()
}
```

**Why this matters:**
When an admin is on the last page of audit logs and clicks "Next", the offset becomes equal to `total`, causing the API to return an empty page even though the "Next" button should have been disabled. The disable condition on line 141 (`offset + limit >= total`) should prevent this, but a timing issue with reactive state could allow the click to fire before the condition updates.

---

### [MEDIUM] Finding #9: MFA bypass window during `signIn` with `authClientMfaEnforced`

**File:** `frontend/composables/useAuth.ts`
**Lines:** 407-418
**Category:** `missing-guard`

**Description:**
When `authClientMfaEnforced` is true and a user has a verified TOTP factor, the function sets `session.value = null` and `user.value = null` to block app auth state until MFA verification. However, the Supabase SDK has already established its own auth session internally. Between the `signInWithPassword` success (line 389) and the client-side session nullification (lines 413-414), there is a brief window where the Supabase `onAuthStateChange` listener (line 234) could fire and call `setSession()` with the full session, bypassing the MFA gate.

**Code:**
```ts
if (authClientMfaEnforced.value) {
  const factor = await resolvePrimaryMfaFactor()
  if (factor && factor.status === 'verified') {
    // Block app auth state until verifyMfaChallenge promotes the session.
    session.value = null
    user.value = null
    hydrated.value = true
    return { ok: false, mfaRequired: true, factorId: factor.id }
  }
}
```

**Why this matters:**
The `onAuthStateChange` listener runs asynchronously and could race with the manual nullification. If it fires during the `await resolvePrimaryMfaFactor()` call, the session is set before it can be blocked. This would allow a user to be authenticated without completing MFA verification.

---

### [MEDIUM] Finding #10: `useAudit` uses untyped `any[]` for log entries

**File:** `frontend/composables/useAudit.ts`
**Lines:** 24-26
**Category:** `contract-drift`

**Description:**
The `AuditLogsResponse` type defines `logs` as `any[]`, and the audit page's `logs` ref (line 182) also uses `any[]`. This means there is no type safety for the audit log entries consumed by the admin audit console. If the backend changes the shape of audit log entries (e.g., renames `actor_id` to `actor`), the frontend will silently render `undefined` values without any TypeScript error.

**Code:**
```ts
// useAudit.ts
type AuditLogsResponse = {
  logs: any[]  // No type safety
  pagination: AuditPagination
}

// admin/audit.vue line 182
const logs = ref<any[]>([])
```

**Why this matters:**
The audit log console is a security-critical admin surface. Using `any[]` means contract drift between the backend audit API and the frontend will not be caught at build time. This increases the risk of silent data rendering failures in a surface that admins rely on for security investigations.

---

### [MEDIUM] Finding #11: Feature flag key path injection in API request

**File:** `frontend/pages/admin/feature-flags.vue`
**Lines:** 307, 383
**Category:** `security`

**Description:**
The feature flag history and update endpoints interpolate the flag key directly into the URL path without encoding: `/admin/feature-flags/${key}/history` and `/admin/feature-flags/${selectedFlag.value.key}`. If a flag key contains path-separator characters (e.g., `../` or URL-encoded characters), it could alter the request path.

**Code:**
```ts
// Line 307
const response = await request<{ history?: FeatureFlagHistoryEntry[] }>(
  `/admin/feature-flags/${key}/history`,
  { query: { limit: 50 } },
)

// Line 383
await request(`/admin/feature-flags/${selectedFlag.value.key}`, {
  method: 'PATCH',
  body: { enabled: editor.enabled, audience_rules: audienceRules, metadata },
})
```

**Why this matters:**
While the backend should validate paths, the frontend does not use `encodeURIComponent()` on the flag key. A flag key like `../../ops/dangerous-endpoint` would produce the URL `/admin/feature-flags/../../ops/dangerous-endpoint`, potentially hitting an unintended backend route. The `createFlag` function (line 355) normalizes with `trim().toLowerCase()` but does not strip path characters.

---

### [MEDIUM] Finding #12: `go/[provider]` page redirects to user-controlled `target` query parameter

**File:** `frontend/pages/go/[provider].vue`
**Lines:** 152-167, 184-189, 233
**Category:** `security`

**Description:**
The outbound redirect page reads a `target` URL from the query string and, after sanitization via `sanitizeTarget()`, uses it as the redirect destination via `window.location.assign()`. While `sanitizeTarget` does validate that the URL uses `http:` or `https:` protocol, it allows ANY external domain. An attacker can craft `/go/wise?target=https://evil-phishing.com` and the page will auto-redirect the user there after 2 seconds.

**Code:**
```ts
const sanitizeTarget = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/')) return trimmed  // relative paths allowed
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()  // ANY https URL is accepted
    }
  }
  catch { return null }
  return null
}

// Line 233
const redirectNow = () => {
  if (!targetUrl.value || hasRedirected.value || typeof window === 'undefined') return
  hasRedirected.value = true
  window.location.assign(targetUrl.value)
}
```

**Why this matters:**
This is an intentional feature for affiliate redirects, but the lack of domain allowlisting means the page can be abused as an open redirector. Search engines and email filters trust remit-scout.com URLs, so an attacker can use this as a redirect trampoline to bypass phishing detection.

---

### [MEDIUM] Finding #13: `useBilling` redirects to unvalidated backend-provided URL

**File:** `frontend/composables/useBilling.ts`
**Lines:** 73-74
**Category:** `missing-guard`

**Description:**
The `openBillingPortal()` function receives a URL from the backend response and immediately redirects to it via `window.location.href = response.url`. If the backend is compromised or returns a malicious URL (e.g., due to SSRF or response tampering), the user is redirected without any client-side validation.

**Code:**
```ts
if (import.meta.client) {
  window.location.href = response.url  // No URL validation
}
```

**Why this matters:**
While this requires a backend compromise, defense-in-depth dictates that the client should validate that returned URLs match expected domains (e.g., Stripe's `checkout.stripe.com` or `billing.stripe.com`). The same pattern appears in `plus/checkout.vue` line 329.

---

### [MEDIUM] Finding #14: `auth/confirm.vue` passes untrusted `type` to Supabase `verifyOtp`

**File:** `frontend/pages/auth/confirm.vue`
**Lines:** 128, 136-139
**Category:** `missing-guard`

**Description:**
The `type` parameter for `verifyOtp` is read directly from the query string (`route.query.type`) and passed with an `as any` cast. While Supabase SDK will likely reject invalid types, passing attacker-controlled values without validation is a code smell. The expected values are `signup`, `recovery`, `email_change`, etc.

**Code:**
```ts
const type = typeof route.query.type === 'string' ? route.query.type : 'signup'

const { error } = await supabase.auth.verifyOtp({
  token_hash: tokenHash,
  type: type as any,  // Attacker-controlled, cast to any
})
```

**Why this matters:**
If a future Supabase SDK version accepts additional type values with different security semantics, an attacker could exploit this by crafting a confirmation URL with an unexpected `type` value. The `as any` cast suppresses TypeScript's protection.

---

### [LOW] Finding #15: Admin layout does not validate `ensureAdminSession` result on route changes

**File:** `frontend/layouts/admin.vue`
**Lines:** 112-122
**Category:** `missing-guard`

**Description:**
The `watch` on `route.fullPath` calls `ensureAdminSessionSafe()` with `void` (fire-and-forget). If the admin session refresh fails and the user is redirected to `/sign-in`, the current page content remains visible during the async redirect. Similarly, the `onMounted` call (line 127) also uses `void` for the session check.

**Code:**
```ts
watch(
  () => route.fullPath,
  () => {
    if (!route.path.startsWith('/admin')) return
    if (isBrowser()) {
      void ensureAdminSessionSafe()  // Fire-and-forget
    }
    mobileNavOpen.value = false
  },
)
```

**Why this matters:**
There is a brief window where admin page content is rendered while the session check is in-flight. If the session has expired, the user sees admin content before being redirected. This is a minor information disclosure risk.

---

### [LOW] Finding #16: `useCompareForm` uses a module-level singleton ref

**File:** `frontend/composables/useCompareForm.ts`
**Lines:** 27-34, 36
**Category:** `broken-logic`

**Description:**
The `globalForm` ref and `geoDefaultPromise` are declared at module scope, outside the composable function. In SSR context with Nuxt, module-level state is shared across all requests, meaning one user's form state could leak to another user's server-rendered page.

**Code:**
```ts
const globalForm = ref<CompareFormState>({
  from: 'US',
  to: '',
  amount: 500,
  method: 'bank',
  fromCurrency: 'USD',
  toCurrency: '',
})

let geoDefaultPromise: Promise<void> | null = null

export function useCompareForm() {
  const form = globalForm  // Shared across all SSR requests
```

**Why this matters:**
In production SSR, if User A searches for US->MX and User B's request is served by the same Node.js process before the state resets, User B could see User A's corridor selection in the initial server-rendered HTML. The `ensureGeoDefault()` call also checks `import.meta.client` which prevents the geo lookup on SSR, but the module-level ref itself persists.

---

### [LOW] Finding #17: Timer leak in admin index auto-refresh

**File:** `frontend/pages/admin/index.vue`
**Lines:** 271-296
**Category:** `slop`

**Description:**
The auto-refresh timer is managed via `watch` and `onUnmounted`. However, if the component is unmounted while `autoRefreshEnabled` is `true` and then remounted, the `watch` fires immediately with the current value but the `autoRefreshTimer` variable (a `let` at module scope within setup) is reset to `null` on remount, potentially leaving the old timer running if the cleanup was missed.

**Code:**
```ts
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

watch(autoRefreshEnabled, (enabled) => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
  if (enabled) {
    countdown.value = 60
    autoRefreshTimer = setInterval(() => { /* ... */ }, 1000)
  }
})

onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }
})
```

**Why this matters:**
The `autoRefreshEnabled` ref uses `ref()` which is local to the component instance. On unmount, the timer is cleared. This is actually handled correctly in practice, but the pattern of using a `let` variable alongside reactive state is fragile. If `autoRefreshEnabled` were a `useState` (shared across instances), the timer could leak.

---

### [LOW] Finding #18: `LaTeXFormula` renders KaTeX output via `v-html` without sanitization

**File:** `frontend/components/shared/LaTeXFormula.vue`
**Lines:** 4, 31-41
**Category:** `security`

**Description:**
The component renders KaTeX output directly via `v-html`. KaTeX's `renderToString` with `throwOnError: false` is generally safe (KaTeX sanitizes its output), but if a future KaTeX version introduces a vulnerability, or if the `formula` prop is crafted to exploit a KaTeX parsing bug, this could become an XSS vector. The `RichHtml` component uses a custom sanitizer, but `LaTeXFormula` does not.

**Code:**
```vue
<span
  :class="formulaClass"
  v-html="renderedFormula"
/>

// ...
const renderedFormula = computed(() => {
  try {
    return (katex as any).renderToString(props.formula, {
      displayMode: props.display ?? false,
      throwOnError: false,
      errorColor: '#cc0000',
    })
  }
  catch {
    return props.formula  // Falls back to raw formula string -- potential XSS
  }
})
```

**Why this matters:**
The `catch` block on line 39 returns `props.formula` as raw HTML via `v-html`. If KaTeX throws an unexpected error on a malicious input like `<img src=x onerror=alert(1)>`, the raw input is rendered as HTML. This is a low-severity XSS vector since the formula content typically comes from the application's own content, not user input.

---
