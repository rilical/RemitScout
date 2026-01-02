# Notification System

Multi-channel notification dispatcher for RemitScout signals and alerts.

Documentation index: `../../../README.md`

## Current Implementation (Sprint 3)

- ✅ HTTP webhooks for B2B arbitrage signals
- ✅ HMAC-SHA256 signature authentication
- ✅ Exponential backoff retry logic (3 attempts max)
- ✅ Signal persistence for audit trail
- ✅ Parallel dispatch support
- ✅ Configurable via environment variables

## Architecture

```
notifications/
├── dispatcher.ts           # Main orchestrator (webhook delivery)
├── config.ts              # Channel configurations
├── types.ts               # Shared types and interfaces
└── channels/              # Sprint 4: Channel implementations
    ├── webhook-channel.ts
    ├── email-channel.ts
    ├── sms-channel.ts
    └── push-channel.ts
```

## Current Usage

### Webhook Dispatch (B2B)

```typescript
import { dispatchSignal } from './notifications/dispatcher'

// After anomaly detection
if (anomaly.detected) {
  await dispatchSignal(pool, corridorId, providerId, anomaly)
}
```

### Webhook Payload

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

### Webhook Security

All webhooks include HMAC-SHA256 signature verification:

```typescript
// Subscribers should verify signatures:
const signature = createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${JSON.stringify(payload)}`)
  .digest('hex')

if (signature !== requestSignature) {
  throw new Error('Invalid signature')
}
```

## Configuration

All settings are configurable via environment variables:

### Webhook Settings
- `WEBHOOK_MAX_RETRIES` (default: 3) - Maximum retry attempts
- `WEBHOOK_TIMEOUT_MS` (default: 5000) - Request timeout
- `WEBHOOK_BACKOFF_BASE_MS` (default: 1000) - Base backoff time
- `WEBHOOK_MAX_BACKOFF_MS` (default: 8000) - Maximum backoff
- `NOTIFICATION_PARALLEL` (default: true) - Parallel dispatch

### Sprint 4: Email Settings
- `EMAIL_PROVIDER` - 'sendgrid', 'ses', or 'mailgun'
- `SENDGRID_API_KEY` - SendGrid API key
- `EMAIL_FROM_ADDRESS` - Sender email
- `EMAIL_FROM_NAME` - Sender name
- `EMAIL_MAX_RETRIES` (default: 2)

### Sprint 4: SMS Settings
- `SMS_PROVIDER` - 'twilio' or 'sns'
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_FROM_NUMBER` - Sender phone number
- `SMS_MAX_RETRIES` (default: 2)

### Sprint 4: Push Settings
- `PUSH_PROVIDER` - 'firebase' or 'onesignal'
- `FIREBASE_SERVER_KEY` - Firebase server key
- `PUSH_MAX_RETRIES` (default: 2)

## Sprint 4 Roadmap

### Phase 1: Consumer Alert Infrastructure
**Goal:** Enable consumers to subscribe to smart timing alerts

**Tasks:**
- [ ] Create `user_smart_alerts` table schema
  - User ID, corridor, preferred channels, frequency
  - Notification preferences (email, SMS, push, in-app)
  - Active/paused status
- [ ] Build alert subscription API endpoints
  - `POST /api/v1/alerts/subscribe`
  - `GET /api/v1/alerts/subscriptions`
  - `PATCH /api/v1/alerts/:id`
  - `DELETE /api/v1/alerts/:id`
- [ ] Create frontend alert management UI
  - Alert preferences page
  - Channel selection (email/SMS/push)
  - Frequency settings (instant, daily digest)

**Database Schema:**
```sql
CREATE TABLE user_smart_alerts (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  corridor_id TEXT NOT NULL,
  provider_id TEXT,
  channels JSONB NOT NULL DEFAULT '[]',
  frequency TEXT NOT NULL DEFAULT 'instant',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Phase 2: Email Channel
**Goal:** Send email notifications for smart timing alerts

**Tasks:**
- [ ] Integrate SendGrid or AWS SES
- [ ] Create `EmailChannel` class implementing `INotificationChannel`
- [ ] Design email templates for signal types
  - Arbitrage signal email template
  - Smart timing recommendation template
  - Rate target alert template
- [ ] Add unsubscribe functionality
- [ ] Implement email delivery tracking
- [ ] Add bounce/complaint handling

**Implementation:**
```typescript
// channels/email-channel.ts
export class EmailChannel implements INotificationChannel<EmailPayload> {
  readonly channelType = 'email'
  readonly maxRetries = 2

  async send(payload: EmailPayload, destination: string): Promise<boolean> {
    // SendGrid/SES integration
  }
}
```

### Phase 3: SMS Channel (Optional)
**Goal:** Send SMS notifications for high-priority alerts

**Tasks:**
- [ ] Integrate Twilio or AWS SNS
- [ ] Create `SmsChannel` class implementing `INotificationChannel`
- [ ] Add SMS rate limiting (prevent spam)
- [ ] Implement opt-in/opt-out management
- [ ] Add carrier delivery tracking

**Considerations:**
- Cost per SMS (evaluate budget impact)
- Character limits (160 chars)
- International SMS support
- Rate limiting to prevent abuse

### Phase 4: Push Notifications (Optional)
**Goal:** Send mobile push notifications via PWA or native app

**Tasks:**
- [ ] Integrate Firebase Cloud Messaging (FCM)
- [ ] Create `PushChannel` class implementing `INotificationChannel`
- [ ] Add device token management
  - Store device tokens per user
  - Handle token refresh
  - Remove invalid tokens
- [ ] Implement notification templates
- [ ] Add click tracking (deep linking)

### Phase 5: In-App Notifications
**Goal:** Create notification inbox within RemitScout app

**Tasks:**
- [ ] Create `notification_inbox` table
  - Notification ID, user ID, message, read status
  - Link to signal/alert that triggered it
- [ ] Build notification inbox API
  - `GET /api/v1/notifications` - List notifications
  - `PATCH /api/v1/notifications/:id/read` - Mark as read
  - `DELETE /api/v1/notifications/:id` - Delete
- [ ] Create frontend notification center
  - Bell icon with unread count
  - Dropdown notification list
  - Mark all as read
  - Notification settings

**Database Schema:**
```sql
CREATE TABLE notification_inbox (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_inbox_user_unread 
  ON notification_inbox(user_id, created_at DESC) 
  WHERE read_at IS NULL;
```

### Phase 6: ML Smart Timing Engine
**Goal:** Predict optimal send times using VWAP and historical data

**Tasks:**
- [ ] Build VWAP recommendation engine
  - Calculate volume-weighted average price per corridor
  - Identify best send times (lowest rates)
  - Confidence scoring (0-1)
- [ ] Create daily batch job for smart timing alerts
  - Run analysis overnight
  - Generate recommendations for next 24h
  - Queue notifications for dispatch
- [ ] Train ML model for rate prediction (optional)
  - Prophet or ARIMA for time series forecasting
  - Feature engineering (day of week, holidays, etc.)
  - Backtesting and validation
- [ ] Integrate with multi-channel dispatcher
  - Send recommendations via user's preferred channels
  - Include confidence level and estimated savings

**Recommendation Payload:**
```json
{
  "type": "SMART_TIMING",
  "corridor": "US-MX-USD-MXN",
  "provider": "remitly",
  "recommendation": "send_now",
  "confidence": 0.85,
  "current_rate": 19.85,
  "predicted_rate_24h": 19.95,
  "estimated_savings_pct": 0.5,
  "valid_until": "2025-01-02T12:00:00.000Z"
}
```

### Phase 7: Multi-Channel Orchestration
**Goal:** Unified dispatch across all channels

**Tasks:**
- [ ] Implement `dispatchMultiChannel()` orchestrator
  - Load user notification preferences
  - Dispatch to all preferred channels in parallel
  - Handle per-channel failures gracefully
- [ ] Add channel priority/fallback logic
  - If push fails, fallback to email
  - If email fails, fallback to in-app
- [ ] Implement delivery tracking table
  - Track delivery status per channel
  - Store error messages
  - Calculate delivery success rates
- [ ] Add rate limiting per user
  - Prevent notification fatigue
  - Max N notifications per hour
  - Respect user frequency preferences

**Implementation:**
```typescript
export const dispatchMultiChannel = async (
  pool: Pool,
  signal: Signal,
  userPreferences: NotificationPreferences
): Promise<void> => {
  const channels: NotificationChannel[] = []
  
  if (userPreferences.email) channels.push('email')
  if (userPreferences.sms) channels.push('sms')
  if (userPreferences.push) channels.push('push')
  
  // Dispatch to all preferred channels in parallel
  const results = await Promise.allSettled(
    channels.map(channel => dispatchToChannel(channel, signal))
  )
  
  // Log delivery results
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      logger.info('channel_delivered', { channel: channels[i] })
    } else {
      logger.error('channel_failed', { 
        channel: channels[i], 
        error: result.reason 
      })
    }
  })
}
```

## Testing Strategy

### Unit Tests
- [ ] Test webhook delivery with mock fetch
- [ ] Test retry logic with exponential backoff
- [ ] Test signature generation and verification
- [ ] Test parallel vs sequential dispatch
- [ ] Test error handling and logging

### Integration Tests
- [ ] Test end-to-end webhook delivery to test endpoint
- [ ] Test email delivery via SendGrid sandbox
- [ ] Test SMS delivery via Twilio test numbers
- [ ] Test multi-channel orchestration

### Load Tests
- [ ] Benchmark parallel dispatch performance
- [ ] Test concurrent webhook deliveries (100+ simultaneous)
- [ ] Measure database load under high signal volume

## Monitoring & Observability

### Metrics to Track
- Webhook delivery success rate (% delivered vs failed)
- Average delivery latency (p50, p95, p99)
- Retry rate (% requiring retries)
- Channel-specific success rates
- User notification frequency (prevent spam)

### Alerts
- Webhook delivery success rate < 95%
- Email bounce rate > 5%
- SMS delivery failure rate > 10%
- Push notification invalid token rate > 20%

## Migration Notes

### Breaking Changes
**None** - This refactor is 100% backward compatible. All existing webhook functionality continues to work unchanged.

### What Changed
- ✅ Moved files from `signals/` to `notifications/`
- ✅ Updated imports in 5 provider collectors
- ✅ Added extensibility layer for future channels
- ✅ Improved documentation and Sprint 4 planning

### What Didn't Change
- ✅ Webhook delivery logic (identical)
- ✅ Retry behavior (same exponential backoff)
- ✅ Database interactions (no schema changes)
- ✅ API contracts (same payload structure)

## Related Documentation

- [ADR-0001: Guardrails](../../docs/adr/ADR-0001-guardrails.md)
- [Provider Integration Guide](../../docs/providers/llm-provider-integration-guide.md)
- [Sprint 3 Implementation Update](../../docs/sprint-3-implementation-update.md)
- [Service Catalog](../../docs/catalogs/service-catalog.md)
