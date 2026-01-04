# Frontend API Versioning Migration

## Overview

The frontend has been migrated to use the versioned API endpoints (`/api/v1/*`) instead of unversioned endpoints (`/api/*`). This ensures compatibility with the backend's API versioning strategy and prepares for future API evolution.

## Changes Made

### 1. Configuration Updates

**`nuxt.config.ts`**:
- Updated default `apiBase` from `/api` to `/api/v1`
- This affects all API calls made through the `useApi()` composable

### 2. Hardcoded Path Updates

**Pages**:
- `pages/dashboard.vue`: Updated `/api/billing/portal` → `/billing/portal`
- `pages/dashboard.vue`: Updated `/api/ops/*/health` → `/ops/*/health`
- `pages/plus.vue`: Updated `/api/me` → `/me`
- `pages/plus.vue`: Updated `/api/billing/portal` → `/billing/portal`

**Composables**:
- `composables/useEntitlements.ts`: Updated error message to remove hardcoded path

### 3. Server-Side Proxy Updates

**`server/utils/backendProxy.ts`**:
- Updated to automatically append `/api/v1` to backend base URL
- Ensures server-side API routes proxy to versioned endpoints

**Server API Routes**:
- `server/api/stripe/verify-session.post.ts`: Updated to `/billing/verify-session`
- `server/api/stripe/create-checkout.post.ts`: Updated to `/billing/checkout-session`

## How It Works

### Client-Side API Calls

All client-side API calls use the `useApi()` composable which:
1. Gets the base URL from `config.public.apiBase` (defaults to `/api/v1`)
2. Joins the base with relative paths (e.g., `/me` → `/api/v1/me`)
3. Makes requests to the versioned endpoint

**Example**:
```typescript
const { request } = useApi()
// This calls /api/v1/me
await request('/me')
```

### Server-Side API Proxying

Server-side API routes (Nuxt server routes) proxy requests to the backend:
1. Uses `API_BASE` environment variable (must be absolute URL)
2. Automatically appends `/api/v1` to the base URL
3. Proxies requests to versioned backend endpoints

**Example**:
```typescript
// server/api/[...path].ts
// Request to /api/providers
// Proxies to http://backend:3000/api/v1/providers
```

## Environment Variables

### Required for Server-Side Proxying

```bash
# Absolute URL to backend (required for server-side proxy)
API_BASE=http://localhost:3000
# or in production:
API_BASE=https://api.remit-scout.com
```

### Optional for Client-Side Override

```bash
# Override default /api/v1 if needed
PUBLIC_API_BASE=/api/v1
```

## Migration Checklist

- [x] Update `nuxt.config.ts` default `apiBase` to `/api/v1`
- [x] Update hardcoded paths in `pages/dashboard.vue`
- [x] Update hardcoded paths in `pages/plus.vue`
- [x] Update error messages in composables
- [x] Update server-side proxy to use versioned endpoints
- [x] Update server API routes for billing endpoints

## Testing

After migration, verify:

1. **Client-Side Calls**:
   - User authentication (`/me`)
   - Billing portal access (`/billing/portal`)
   - Provider quotes (`/providers`)
   - Popular corridors (`/popular-corridors`)
   - Ops health checks (`/ops/*/health`)

2. **Server-Side Proxying**:
   - Server API routes proxy correctly
   - Backend receives versioned requests
   - No deprecation warnings in responses

3. **Backward Compatibility**:
   - Backend still accepts unversioned endpoints (with deprecation headers)
   - Frontend should not see deprecation warnings (using versioned endpoints)

## Rollback Plan

If issues occur, you can temporarily rollback by:

1. **Quick Fix**: Set environment variable
   ```bash
   PUBLIC_API_BASE=/api
   ```

2. **Full Rollback**: Revert `nuxt.config.ts`
   ```typescript
   apiBase: process.env.PUBLIC_API_BASE || '/api'
   ```

## Benefits

1. **Future-Proof**: Ready for API version evolution
2. **No Deprecation Warnings**: Using recommended versioned endpoints
3. **Clear Versioning**: Explicit API version in all requests
4. **Backward Compatible**: Backend still accepts unversioned endpoints during transition

## Next Steps

1. Monitor for any API call failures
2. Verify all endpoints work correctly
3. Remove unversioned endpoint support after sunset date (January 3, 2026)
4. Update any external API documentation


