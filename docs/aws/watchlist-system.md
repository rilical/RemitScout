# Watchlist System - AWS Implementation

## Overview

The watchlist system allows users to save and track corridors, FX pairs, pulse charts, and guides. It's fully integrated with user accounts and syncs across devices.

## Architecture

### Database

**Table**: `silver.watchlist_item`

```sql
CREATE TABLE silver.watchlist_item (
  id UUID PRIMARY KEY,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('user', 'guest')),
  user_id UUID REFERENCES silver.user_account(user_id),
  guest_id UUID,
  target_type TEXT NOT NULL,
  target_payload JSONB NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
```

**Features**:
- Supports all `WatchTarget` types via JSONB `target_payload`
- Soft deletes (`deleted_at`)
- Indexed for performance (user_id, created_at, target_payload GIN)
- Supports both authenticated users and guests

### Backend API

**Endpoints**:
- `GET /api/watchlist` - Fetch all watchlist items for authenticated user
- `POST /api/watchlist` - Create a new watchlist item
- `PATCH /api/watchlist/:id` - Update watchlist item label
- `DELETE /api/watchlist/:id` - Delete (soft delete) watchlist item

**Authentication**: All endpoints require authentication via JWT

**Quota Enforcement**:
- Free plan: 3 watchlist items
- Plus plan: Unlimited
- Enterprise plan: Unlimited

### Frontend

**Composable**: `useWatchlist()`

**Features**:
- Automatic sync with backend for authenticated users
- LocalStorage fallback for guests
- Real-time updates
- Quota enforcement

**Usage**:
```typescript
const { items, save, remove, count, hydrated } = useWatchlist()

// Save a corridor
await save({
  type: 'corridor',
  from: 'US',
  to: 'PH',
  method: 'bank'
}, { label: 'US → Philippines' })

// Remove an item
await remove(itemId)
```

## AWS Integration

### Lambda Function

The watchlist endpoints are part of the Plane A Lambda function:
- **Memory**: 1024 MB
- **Timeout**: 30 seconds
- **VPC**: Yes (for database access)
- **IAM Permissions**: 
  - RDS access (via VPC)
  - CloudWatch Logs
  - X-Ray tracing

### Database Connection

- Uses RDS Proxy for connection pooling
- Connection reuse across Lambda invocations
- Automatic retry on connection failures

### Metrics

All watchlist operations record CloudWatch metrics:
- `http_requests_total` (method, route, status_code)
- `http_request_duration_seconds` (method, route, status_code)

## Migration

**File**: `backend/db/migrations/021_watchlist_items.sql`

To apply:
```bash
# Run migrations
cd backend
pnpm run db:migrate
```

## Testing

### Local Testing

1. **Start backend**:
```bash
cd backend/plane-a
pnpm dev
```

2. **Test endpoints**:
```bash
# Get watchlist (requires auth token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/watchlist

# Create watchlist item
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target":{"type":"corridor","from":"US","to":"PH","method":"bank"},"label":"US → Philippines"}' \
  http://localhost:3000/api/watchlist
```

### AWS Testing

1. Deploy CDK stack
2. Test via API Gateway endpoint
3. Check CloudWatch Logs for errors
4. Verify database records

## Quota Management

Quotas are enforced at:
1. **Frontend**: Client-side validation (UX)
2. **Backend**: Server-side enforcement (security)

Backend checks:
```typescript
const limit = await getWatchlistLimit(user.user_id)
if (limit !== 'unlimited' && count >= limit) {
  return { error: 'limit_reached', limit }
}
```

## Sync Behavior

### Authenticated Users
- Fetches from backend on mount
- Syncs all operations (save, update, delete) to backend
- Falls back to localStorage if backend unavailable

### Guests
- Uses localStorage only
- No backend sync
- Data persists in browser

## Error Handling

- **Network errors**: Falls back to localStorage
- **Quota exceeded**: Returns `limit_reached` error
- **Invalid target**: Returns `validation_error`
- **Not found**: Returns `not_found` for update/delete

## Future Enhancements

1. **Guest sync**: Migrate guest watchlists to user account on signup
2. **Bulk operations**: Add/remove multiple items at once
3. **Sharing**: Share watchlists with other users
4. **Export**: Export watchlist to CSV/JSON
5. **Alerts integration**: Link alerts to watchlist items


