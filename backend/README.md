# Backend Documentation

## Toolchain
- Node `>=20.19.0` (run `nvm use` from repo root; pins are in `.nvmrc` and `backend/.nvmrc`)
- pnpm (see repo root `package.json#packageManager`)

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

The Remit-Scout API uses URL-based versioning. Canonical endpoints are `/api/v1/*`.
Legacy unversioned routes under `/api/*` are removed.

## Versioning Strategy

### Current Version
- **API Version**: `v1`
- **Base Path**: `/api/v1/*`

### Legacy Route Status
- **Deprecated**: January 3, 2025
- **Removed**: February 11, 2026
- Requests to `/api` or `/api/*` now return `410 Gone` with `alternativePath` set to `/api/v1/*`.

## Migration Status

### For API Consumers

1. **Use `/api/v1/*` for all API calls**
2. **Treat `410 Gone` from `/api/*` as a migration defect**
3. **Validate webhook and unsubscribe integrations on `/api/v1/*`**

### Example Migration

**Before (Removed)**:
```bash
GET /api/quotes/current?corridor_id=US-MX-USD-MXN
```

**After (Versioned)**:
```bash
GET /api/v1/quotes/current?corridor_id=US-MX-USD-MXN
```

## Tombstone Response

`/api/*` responses use:
- `status`: `410`
- `error`: `gone`
- `message`: `"Legacy /api/* routes have been removed. Use /api/v1/*."`
- `alternativePath`: resolved `/api/v1/...` equivalent

## Implementation Details

### Route Registration

Routes are registered only with the versioned prefix:

```typescript
app.register(quotesRoutes, { prefix: '/api/v1' })
```

### Related Files

- `backend/plane-a/src/app.ts` - `/api/v1` registration + `/api/*` tombstones
- `infrastructure/cdk/lib/api.ts` - API Gateway public routes and `/api` passthrough to tombstones

## Changelog

### 2025-01-03
- Initial API versioning implementation

### 2026-02-11
- Removed unversioned `/api/*` route registrations
- Added `410 Gone` tombstone handlers for legacy `/api` paths
