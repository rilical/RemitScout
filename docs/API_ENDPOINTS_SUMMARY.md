# API Endpoints Summary

## Overview

The Remit-Scout backend provides RESTful API endpoints for:
- **Public endpoints**: Provider quotes, corridor data (rate-limited by IP)
- **Authenticated endpoints**: User account, billing, Pulse analytics (JWT required)
- **Admin endpoints**: Provider health checks (Admin JWT required)

## Frontend Connection

The frontend connects to the backend via:
1. **Nuxt server API routes** (`frontend/server/api/*.ts`) that proxy to the backend
2. **Direct backend calls** using `$fetch` with `API_BASE` environment variable

### Frontend Proxy Pattern
```typescript
// frontend/server/api/providers.get.ts
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return await proxyToBackend(event, '/providers')
})
```

This proxies `GET /api/providers` from frontend → backend.

## Available Endpoints

### Public Endpoints (No Auth Required)

| Method | Path | Description | Frontend Usage |
|--------|------|-------------|----------------|
| GET | `/api/providers` | Get provider quotes with metadata | ✅ `useProviders()` composable |
| GET | `/api/quotes/current` | Get raw normalized quotes | ✅ Direct API calls |
| GET | `/api/popular-corridors` | Get popular corridors | ✅ `usePopularCorridors()` |
| GET | `/api/bank-vs-specialist` | Bank vs specialist comparison (US→MX) | ✅ `useBankVsSpecialist()` |
| GET | `/api/geo` | Geolocation lookup | ✅ Hero location detection |
| GET | `/healthz` | Health check | ✅ Monitoring |
| GET | `/readyz` | Readiness check | ✅ Kubernetes probes |
| GET | `/metrics` | Prometheus metrics | ✅ Monitoring |

### Authenticated Endpoints (JWT Required)

| Method | Path | Description | Frontend Usage |
|--------|------|-------------|----------------|
| GET | `/api/me` | Get user plan & entitlements | ✅ `useMe()` composable |
| POST | `/api/billing/checkout-session` | Create Stripe checkout | ✅ Checkout flow |
| GET | `/api/billing/portal` | Get billing portal link | ✅ Account settings |
| POST | `/api/billing/webhook` | Stripe webhook (no auth) | ✅ Stripe webhooks |
| GET | `/api/pulse/status` | Pulse service status | ✅ Pulse dashboard |
| GET | `/api/pulse/events` | Pulse events feed | ✅ Pulse dashboard |
| GET | `/api/pulse/providers/benchmarking` | Pulse provider benchmarking | ✅ Pulse dashboard |
| GET | `/api/pulse/method-coverage` | Pulse method coverage | ✅ Pulse dashboard |

### Admin Endpoints (Admin JWT Required)

| Method | Path | Description | Frontend Usage |
|--------|------|-------------|----------------|
| GET | `/api/ops/{provider}/health` | Provider health check | ❌ Admin dashboard only |

## Endpoint Details

### 1. GET `/api/providers`

**Purpose**: Main endpoint for frontend comparison page. Returns aggregated provider quotes with metadata.

**Query Parameters**:
- `from` (optional): Source country code (e.g., "US")
- `to` (optional): Destination country code (e.g., "PH")
- `amount` (optional): Send amount (min 50)
- `method` (optional): Payment method - `bank` | `cash` | `wallet`
- `corridor_id` (optional): Full corridor ID (e.g., "US-PH-USD-PHP")
- `amount_bucket` (optional): Pre-computed amount bucket
- `payin` (optional): Canonical payin method
- `payout` (optional): Canonical payout method

**Response**:
```json
{
  "data": [
    {
      "id": "remitly",
      "name": "Remitly",
      "logoUrl": "/logos/remitly.svg",
      "fee": 1.99,
      "marginPct": 0.4,
      "fxRate": 56.5,
      "recipientGets": 56500,
      "delivery": "Same day",
      "reliability": 0.91,
      "methods": ["bank"],
      "bestFor": "Bank deposit",
      "whyThisRanking": "Bank deposit"
    }
  ],
  "updatedAt": "2024-01-02T19:16:57.376Z",
  "corridor": "US-PH-USD-PHP",
  "amount": 1000,
  "method": "bank"
}
```

**Frontend Usage**:
```typescript
// frontend/composables/useRemittanceApi.ts
const { data: quotesData } = await useProviders('US', 'PH', 1000, 'bank')
```

### 2. GET `/api/quotes/current`

**Purpose**: Get raw normalized quotes from database (more technical than `/api/providers`).

**Query Parameters**:
- `corridor_id` (required): Corridor ID
- `amount_bucket` (optional): Amount bucket
- `amount` (optional): Send amount
- `payin` (required): Canonical payin method
- `payout` (required): Canonical payout method
- `live` (optional): Force live refresh

**Response**: Raw quote data with cache metadata

### 3. GET `/api/popular-corridors`

**Purpose**: Get most popular remittance corridors.

**Response**:
```json
{
  "success": true,
  "timestamp": "2024-01-02T19:16:57.376Z",
  "count": 10,
  "corridors": [
    {
      "route": "US→PH",
      "count_24h": 1250,
      "top_provider": "Remitly",
      "fee_range": "$0-$5",
      "speed_range": "Same day - 1 day",
      "best_for": "Bank deposit",
      "updated_at": "2024-01-02T19:16:57.376Z"
    }
  ]
}
```

### 4. GET `/api/bank-vs-specialist`

**Purpose**: Public comparison between Wells Fargo and the best specialist provider for US→MX.

**Query Parameters**:
- `amount` (optional): Send amount (defaults to 500)
- `from`/`to` (ignored): Corridor is fixed to US→MX

**Response**:
```json
{
  "data": {
    "corridor": {
      "from": "US",
      "to": "MX",
      "sendCurrency": "USD",
      "recvCurrency": "MXN"
    },
    "midRate": 17.2,
    "bank": {
      "name": "Wells Fargo",
      "fee": 12,
      "fxRate": 16.5,
      "recipientGets": 8250,
      "delivery": "1-2 days"
    },
    "top": {
      "id": "wise",
      "name": "Wise",
      "fee": 2.99,
      "fxRate": 17.1,
      "recipientGets": 8540,
      "delivery": "Same day"
    },
    "updatedAt": "2024-01-02T19:16:57.376Z"
  },
  "updatedAt": "2024-01-02T19:16:57.376Z"
}
```

### 5. GET `/api/geo`

**Purpose**: Public geolocation lookup using CloudFront/Cloudflare headers.

**Response**:
```json
{
  "countryCode": "US",
  "country": "United States",
  "currency": "USD",
  "timezone": null,
  "source": "cloudfront"
}
```

### 6. GET `/api/me`

**Purpose**: Get current user's plan, entitlements, and usage.

**Auth**: JWT Bearer token required

**Response**:
```json
{
  "success": true,
  "timestamp": "2024-01-02T19:16:57.376Z",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com"
  },
  "plan": {
    "plan_code": "plus",
    "status": "active"
  },
  "entitlements": {
    "pulse": true,
    "watchlist": true
  },
  "usage": {
    "queries_this_month": 150,
    "queries_limit": 1000
  }
}
```

### 7. POST `/api/billing/checkout-session`

**Purpose**: Create Stripe checkout session for plan upgrade.

**Auth**: JWT Bearer token required

**Request Body**:
```json
{
  "plan_code": "plus"
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### 8. GET `/api/billing/portal`

**Purpose**: Get Stripe billing portal link for managing subscriptions.

**Auth**: JWT Bearer token required

**Response**:
```json
{
  "url": "https://billing.stripe.com/..."
}
```

## Swagger/OpenAPI Documentation

### Current Status

✅ **OpenAPI Spec Created**: `docs/openapi/api.yaml`
- Complete specification for all endpoints
- Request/response schemas
- Authentication requirements
- Error responses

❌ **Swagger UI Not Installed**: Need to add `@fastify/swagger` and `@fastify/swagger-ui`

### To Enable Swagger UI

1. **Install dependencies**:
```bash
cd backend
pnpm add @fastify/swagger @fastify/swagger-ui
```

2. **Register plugin** (already created at `backend/plane-a/src/plugins/swagger.ts`):
```typescript
// backend/plane-a/src/app.ts
import { swaggerPlugin } from './plugins/swagger'

export const buildApp = () => {
  const app = Fastify({...})
  
  // ... other setup ...
  
  await app.register(swaggerPlugin) // Add this
  
  // ... register routes ...
}
```

3. **Access Swagger UI**: `http://localhost:3000/api-docs`

## Frontend Integration Examples

### Using Composables

```typescript
// frontend/composables/useRemittanceApi.ts
const { data: providers } = await useProviders('US', 'PH', 1000, 'bank')
const { data: corridors } = await usePopularCorridors()
const { data: me } = await useMe() // Requires auth
```

### Direct API Calls

```typescript
// frontend/composables/useRemittanceApi.ts
const response = await $fetch('/api/providers', {
  query: {
    from: 'US',
    to: 'PH',
    amount: 1000,
    method: 'bank'
  }
})
```

### Server-Side Proxy

```typescript
// frontend/server/api/providers.get.ts
export default defineEventHandler(async (event) => {
  return await proxyToBackend(event, '/providers')
})
```

## Rate Limiting

- **Public endpoints**: 100 requests/minute per IP
- **Authenticated endpoints**: 500 requests/minute per user
- Rate limit headers included in responses

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "bad_request",
  "message": "Invalid country codes",
  "details": [
    {
      "message": "invalid country codes"
    }
  ]
}
```

Common status codes:
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (missing/invalid JWT)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal server error
- `503`: Service unavailable (database issues)

## Next Steps

1. ✅ OpenAPI spec created
2. ⏳ Install Swagger UI packages
3. ⏳ Register Swagger plugin in app
4. ⏳ Test Swagger UI at `/api-docs`
5. ⏳ Update API catalog with new endpoints
