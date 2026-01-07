# Backend Documentation

## Layout
- `plane-a/` - Public API (Plane A)
- `plane-b/` - Ingestion and collection (Plane B)
- `plane-c/` - Publishing and analytics (Plane C)
- `shared/` - Shared utilities across planes
- `scripts/` - Batch jobs, probes, and maintenance

## Shared module rules
A file belongs in `shared/` if it is used by multiple planes and has no plane-specific business logic.

Do not place in `shared/`:
- Plane-specific routes or services
- Provider-specific configurations
- Plane-specific repositories

## Plane B health server
Environment:
- `HEALTH_PORT` (default: 8080)
- `PLANE_B_HEALTH_ENABLED=0` to disable

Endpoints:
- `GET /healthz` - liveness
- `GET /readyz` - readiness (DB + Redis)
- `GET /metrics` - Prometheus metrics

## Redis connectivity (Plane B)
- `REDIS_URL` is used when available.
- If Redis is unavailable, token buckets fall back to per-instance in-memory limits.

## Proxy configuration (Plane B)
Proxy URLs can be configured via environment, Secrets Manager, or SSM.

Resolution order:
1. `PROXY_RESIDENTIAL_URL` / `PROXY_DATACENTER_URL`
2. Secrets Manager (`PROXY_*_SECRET_ARN` + optional JSON key)
3. SSM Parameter Store (`PROXY_*_SSM_NAME`)

## Notifications subsystem (Plane B)
Location: `plane-b/src/notifications/`

Current capabilities:
- HTTP webhook dispatch with HMAC-SHA256 signatures
- Retries with exponential backoff
- Signal persistence for audit
- Parallel dispatch support

Webhook payload (example):
```json
{
  "type": "ARBITRAGE_SIGNAL",
  "corridor": "US-MX-USD-MXN",
  "provider": "remitly",
  "current_rate": 19.85,
  "avg_24h": 19.20,
  "deviation_sigma": 2.5,
  "direction": "above",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

Signature verification:
```typescript
const signature = createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${JSON.stringify(payload)}`)
  .digest('hex')
```

Config (webhook):
- `WEBHOOK_MAX_RETRIES`
- `WEBHOOK_TIMEOUT_MS`
- `WEBHOOK_BACKOFF_BASE_MS`
- `WEBHOOK_MAX_BACKOFF_MS`
- `NOTIFICATION_PARALLEL`

Note: roadmap items for multi-channel notifications should live in the tracker/Confluence,
not in repo docs.

## Testing
- `pnpm test`
- `pnpm test:watch`
- `pnpm test:ui`
- `pnpm test:coverage`

Coverage thresholds:
- Statements: 70%
- Branches: 65%
- Functions: 70%
- Lines: 70%

Coverage report: `backend/coverage/index.html`

## Monitoring
See `docs/aws/aws-native-migration-gap-analysis.md` (Appendix D).

## API Versioning

## Overview

The Remit-Scout API uses URL-based versioning to ensure backward compatibility while allowing for future API evolution. All API endpoints are versioned under `/api/v1/*` with backward compatibility maintained for unversioned `/api/*` endpoints.

## Versioning Strategy

### Current Version
- **API Version**: `v1`
- **Base Path**: `/api/v1/*`

### Backward Compatibility
- Unversioned endpoints at `/api/*` are maintained for backward compatibility
- Unversioned endpoints are **deprecated** as of January 3, 2025
- Unversioned endpoints will be **sunset** on January 3, 2026 (1 year from deprecation)

## Deprecation Policy

### Deprecation Timeline

1. **Deprecation Date**: January 3, 2025
   - Unversioned endpoints (`/api/*`) are marked as deprecated
   - Deprecation headers are added to all responses
   - Clients are notified via HTTP headers

2. **Sunset Date**: January 3, 2026
   - Unversioned endpoints will be removed
   - Only versioned endpoints (`/api/v1/*`) will be available

### Deprecation Headers

When accessing deprecated endpoints, the following headers are included in responses:

- **`X-API-Deprecation-Warning`**: Contains deprecation notice and migration instructions
- **`X-API-Version`**: Indicates the API version (`unversioned` for deprecated endpoints, `v1` for versioned)
- **`Sunset`**: RFC 8594 Sunset header indicating when the endpoint will be removed (format: `YYYY-MM-DD`)

### Example Response Headers

```
HTTP/1.1 200 OK
X-API-Deprecation-Warning: This endpoint is deprecated as of 2025-01-03. This endpoint will be sunset on 2026-01-03. Please migrate to /api/v1/quotes/current
X-API-Version: unversioned
Sunset: 2026-01-03
```

## Migration Guide

### For API Consumers

1. **Update all API calls** to use `/api/v1/*` instead of `/api/*`
2. **Monitor deprecation warnings** in response headers
3. **Plan migration** before the sunset date (January 3, 2026)
4. **Test thoroughly** with versioned endpoints before sunset

### Example Migration

**Before (Deprecated)**:
```bash
GET /api/quotes/current?corridor_id=US-MX-USD-MXN
```

**After (Versioned)**:
```bash
GET /api/v1/quotes/current?corridor_id=US-MX-USD-MXN
```

## Versioned Endpoints

All endpoints are available under both paths:

| Unversioned (Deprecated) | Versioned (Recommended) |
|-------------------------|-------------------------|
| `/api/quotes/current` | `/api/v1/quotes/current` |
| `/api/providers` | `/api/v1/providers` |
| `/api/popular-corridors` | `/api/v1/popular-corridors` |
| `/api/me` | `/api/v1/me` |
| `/api/billing/*` | `/api/v1/billing/*` |
| `/api/pulse/status` | `/api/v1/pulse/status` |
| `/api/ops/*` | `/api/v1/ops/*` |

## Future Versions

When introducing breaking changes:

1. **Create new version**: `/api/v2/*`
2. **Maintain previous version**: `/api/v1/*` remains available
3. **Deprecate old version**: Add deprecation headers with appropriate timeline
4. **Document changes**: Update this document with migration guide

### Version Lifecycle

- **Active**: Current version, fully supported
- **Deprecated**: Still functional but marked for removal
- **Sunset**: Removed, no longer available

## Implementation Details

### Route Registration

Routes are registered with both versioned and unversioned prefixes:

```typescript
// Versioned (recommended)
app.register(quotesRoutes, { prefix: '/api/v1' })

// Unversioned (deprecated, for backward compatibility)
app.register(quotesRoutes, { prefix: '/api' })
```

### Plane A Helper (Optional)

Plane A also includes a helper for registering versioned routes:

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

This helper exists but routes are currently registered manually. If you standardize,
choose one approach and apply it consistently.

### Related Files

- `backend/plane-a/src/plugins/api-versioning.ts` - Versioning utilities
- `backend/plane-a/src/app.ts` - Route registration

### Deprecation Detection

The backward compatibility layer automatically:
- Detects unversioned API requests
- Adds deprecation headers
- Logs access for monitoring
- Routes to the same handler

## Monitoring

### Metrics

- Deprecated endpoint access is logged with:
  - Endpoint path
  - User ID (if authenticated)
  - IP address
  - Timestamp

### Alerts

Set up alerts for:
- High usage of deprecated endpoints
- Approaching sunset date
- Client migration progress

## Support

For questions or issues regarding API versioning:
- Review this documentation
- Check response headers for deprecation notices
- Contact support if migration assistance is needed

## Changelog

### 2025-01-03
- Initial API versioning implementation
- Deprecation of unversioned endpoints
- Sunset date set for January 3, 2026
