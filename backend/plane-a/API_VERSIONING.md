# API Versioning Strategy

## Overview

The Remit-Scout Plane A API uses a versioning strategy to support backward compatibility while allowing for future API evolution.

## Versioning Approach

### Current Version: `v1`

All endpoints are available under `/api/v1/*` prefix. This is the recommended and stable version.

### Deprecated: Unversioned Endpoints

Unversioned endpoints at `/api/*` are deprecated and will be sunset on **January 3, 2026**.

## Implementation

### Route Registration

Routes are registered twice:
1. **Versioned routes**: `/api/v1/*` - Primary, stable endpoints
2. **Unversioned routes**: `/api/*` - Deprecated, for backward compatibility

Example from `app.ts`:
```typescript
app.register(quotesRoutes, { prefix: '/api/v1' })
app.register(quotesRoutes, { prefix: '/api' })  // Deprecated
```

### Deprecation Headers

When accessing unversioned endpoints, the API returns deprecation headers:

- `X-API-Deprecation-Warning`: Warning message about deprecation
- `X-API-Version`: Set to `unversioned` for deprecated endpoints, `v1` for versioned
- `Sunset`: Date when the endpoint will be removed (ISO 8601 format)

### Backward Compatibility Layer

The `createBackwardCompatibilityLayer` hook automatically adds deprecation headers to all unversioned API requests.

## Migration Guide

### For API Consumers

1. **Update all API calls** to use `/api/v1/*` instead of `/api/*`
2. **Monitor deprecation warnings** in response headers
3. **Plan migration** before the sunset date (January 3, 2026)

### Example Migration

**Before (deprecated)**:
```bash
GET /api/quotes/current?corridor_id=USD-EUR&amount_bucket=100-500
```

**After (recommended)**:
```bash
GET /api/v1/quotes/current?corridor_id=USD-EUR&amount_bucket=100-500
```

## Versioning Helpers

### `registerVersionedRoute`

Helper function to register routes with automatic versioning:

```typescript
import { registerVersionedRoute } from './plugins/api-versioning'

registerVersionedRoute(app, {
  method: 'GET',
  url: '/api/quotes/current',
  handler: async (request, reply) => {
    // Handler implementation
  },
}, {
  version: 'v1',
  deprecated: false,
})
```

**Note**: Currently, routes are registered manually. The `registerVersionedRoute` helper is available but not used consistently. Consider standardizing on either manual registration or the helper.

## Deprecation Timeline

- **Deprecation Date**: January 3, 2025
- **Sunset Date**: January 3, 2026
- **Current Status**: Unversioned endpoints are deprecated but still functional

## Future Versions

When introducing `v2`:

1. Register routes under `/api/v2/*`
2. Keep `v1` routes active for backward compatibility
3. Update deprecation dates for `v1` if needed
4. Document breaking changes in `v2`

## Best Practices

1. **Always use versioned endpoints** in new integrations
2. **Monitor deprecation headers** in production
3. **Test with versioned endpoints** before migrating
4. **Plan migrations** well before sunset dates
5. **Document breaking changes** when introducing new versions

## Related Files

- `backend/plane-a/src/plugins/api-versioning.ts` - Versioning utilities
- `backend/plane-a/src/app.ts` - Route registration
- `backend/plane-a/API_VERSIONING.md` - This file


