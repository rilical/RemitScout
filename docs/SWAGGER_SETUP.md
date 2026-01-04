# Swagger/OpenAPI Setup Guide

## Current Status

✅ **OpenAPI Specification**: Complete spec at `docs/openapi/api.yaml`
✅ **Swagger Plugin**: Created at `backend/plane-a/src/plugins/swagger.ts`
❌ **Swagger Packages**: Not yet installed
❌ **Swagger Plugin**: Not yet registered in app

## Setup Instructions

### Step 1: Install Swagger Packages

```bash
cd backend
pnpm add @fastify/swagger @fastify/swagger-ui
```

### Step 2: Register Swagger Plugin

Add to `backend/plane-a/src/app.ts`:

```typescript
import { swaggerPlugin } from './plugins/swagger'

export const buildApp = () => {
  const app = Fastify({...})
  
  // ... existing setup ...
  
  // Register Swagger BEFORE routes
  await app.register(swaggerPlugin)
  
  // ... register routes ...
  
  return app
}
```

### Step 3: Access Swagger UI

After starting the server:
- **Local**: http://localhost:3000/api-docs
- **Production**: https://api.remit-scout.com/api-docs

## Available Endpoints Documentation

All endpoints are documented in:
- **OpenAPI Spec**: `docs/openapi/api.yaml`
- **API Catalog**: `docs/catalogs/api-catalog.md`
- **Summary**: `docs/API_ENDPOINTS_SUMMARY.md`

## Endpoints Ready for Frontend

### ✅ Fully Integrated

1. **GET `/api/providers`** - Main comparison endpoint
   - Frontend: `useProviders()` composable
   - Proxy: `frontend/server/api/providers.get.ts`

2. **GET `/api/quotes/current`** - Raw quotes
   - Frontend: Direct API calls
   - Proxy: `frontend/server/api/[...path].ts`

3. **GET `/api/popular-corridors`** - Popular routes
   - Frontend: `usePopularCorridors()` composable
   - Proxy: `frontend/server/api/popular-corridors.get.ts`

4. **GET `/api/me`** - User info
   - Frontend: `useMe()` composable
   - Proxy: `frontend/server/api/[...path].ts`

5. **POST `/api/billing/checkout-session`** - Stripe checkout
   - Frontend: Checkout flow
   - Proxy: `frontend/server/api/stripe/create-checkout.post.ts`

6. **GET `/api/billing/portal`** - Billing portal
   - Frontend: Account settings
   - Proxy: `frontend/server/api/[...path].ts`

## Testing Endpoints

### Using Swagger UI

1. Navigate to `/api-docs`
2. Select endpoint
3. Click "Try it out"
4. Fill parameters
5. Execute request

### Using curl

```bash
# Public endpoint
curl "http://localhost:3000/api/providers?from=US&to=PH&amount=1000&method=bank"

# Authenticated endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/me"
```

### Using Frontend Composables

```typescript
// frontend/composables/useRemittanceApi.ts
const { data: providers } = await useProviders('US', 'PH', 1000, 'bank')
const { data: me } = await useMe()
```

## Next Steps

1. ✅ OpenAPI spec created
2. ✅ Swagger plugin created
3. ⏳ Install packages: `pnpm add @fastify/swagger @fastify/swagger-ui`
4. ⏳ Register plugin in `app.ts`
5. ⏳ Test Swagger UI
6. ⏳ Update production deployment

## Notes

- Swagger UI is **read-only** - it doesn't modify endpoints
- All endpoints are already functional and connected to frontend
- Swagger is for **documentation and testing** only
- OpenAPI spec can be imported into Postman, Insomnia, etc.



