# Alert System - AWS Implementation

## Overview

The alert system allows users to set up exchange rate alerts and receive notifications via email (and SMS in the future). It's fully integrated with the exchange rate system and syncs across devices.

## Architecture

### Database

**Tables**:
- `silver.alert_rule` - Alert definitions
- `silver.alert_state` - Runtime state (concurrency-safe)
- `silver.alert_event` - Alert trigger history
- `silver.notification_pref` - User notification preferences
- `silver.email_suppression` - Suppressed emails (bounces/complaints)

### Backend API

**Endpoints**:
- `GET /api/alerts` - Fetch all alerts for authenticated user
- `POST /api/alerts` - Create a new alert
- `PATCH /api/alerts/:id` - Update alert (rule, frequency, enabled)
- `DELETE /api/alerts/:id` - Delete alert
- `GET /api/alerts/smart-notifier` - Smart Notifier status (Plus only, coming soon)

**Authentication**: All endpoints require authentication via JWT

**Quota Enforcement**:
- Free plan: 1 alert
- Plus plan: 5 alerts
- Enterprise plan: Unlimited

### Alert Metrics

Supported metrics:
- `rate` / `midMarketRate` - Exchange rate
- `recipientGets` - Amount recipient receives
- `totalCost` - Total cost to sender
- `fee` - Transfer fee
- `index` - Custom index (for pulse charts)

### Comparators

- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `crosses_above` - Rate crosses above threshold
- `crosses_below` - Rate crosses below threshold

### Frequencies

- `realtime` - Check every 5 minutes (Plus only)
- `hourly` - Check every hour
- `daily` - Check once per day (default)

## AWS Integration

### Email Notifications (SES)

**Configuration**:
```bash
ALERTS_EMAIL_ENABLED=1
ALERTS_EMAIL_FROM=alerts@remitscout.com
ALERTS_EMAIL_FROM_NAME="Remit-Scout Alerts"
SES_REGION=us-east-1
```

**Features**:
- HTML email templates
- Unsubscribe links
- Email suppression (bounce/complaint handling)
- CloudWatch metrics

### Mobile Notifications (SNS) - Coming Soon

**Configuration** (prepared for future):
```bash
ALERTS_SMS_ENABLED=1
SNS_REGION=us-east-1
SNS_TOPIC_ARN=arn:aws:sns:...
```

**Status**: Infrastructure ready, activation pending mobile app

### Alert Evaluation

**Service**: `alert-evaluator.ts`

**Features**:
- Fetches current exchange rates from `FxRateRepository`
- Evaluates alerts based on comparator
- Cooldown period (default 360 minutes)
- Snooze support
- Concurrent evaluation safe (optimistic locking)

**Evaluation Flow**:
1. Fetch alert rule and watchlist item
2. Get current value from exchange rate system
3. Evaluate comparator
4. Check cooldown/snooze
5. Update alert state
6. Create alert event if triggered
7. Send notifications (email/SMS)
8. Update event notification status

### Lambda Function

The alert endpoints are part of the Plane A Lambda function:
- **Memory**: 1024 MB
- **Timeout**: 30 seconds
- **VPC**: Yes (for database access)
- **IAM Permissions**: 
  - RDS access (via VPC)
  - SES (SendEmail, SendRawEmail)
  - SNS (Publish)
  - CloudWatch Logs
  - X-Ray tracing

### Scheduled Evaluation

**EventBridge Rules** (to be configured):
- Realtime: Every 5 minutes (for Plus members)
- Hourly: Every hour (for hourly alerts)
- Daily: Once per day at user's preferred hour

**Worker**: Lambda function that calls `evaluateAlertsForFrequency()`

## Exchange Rate Integration

Alerts are integrated with the exchange rate system:

1. **Mid-Market Rate**: Fetched from `FxRateRepository`
2. **Recipient Amount**: Calculated from best quote via `LatestQuoteRepository`
3. **Real-time Updates**: Rates are cached and refreshed automatically

**Supported Targets**:
- Corridors (e.g., US → PH)
- FX Pairs (e.g., USD/EUR)
- Pulse Charts (coming soon)
- Guides (coming soon)

## Smart Notifier (Plus Only - Coming Soon)

**Endpoint**: `GET /api/alerts/smart-notifier`

**Features** (planned):
- AI-powered rate predictions
- Optimal send time recommendations
- Market trend analysis
- Personalized alerts based on transfer patterns

**Status**: Placeholder endpoint returns "coming soon" message for Plus members

## Frontend Integration

**Composable**: `useAlerts()`

**Features**:
- Automatic sync with backend for authenticated users
- LocalStorage fallback for guests
- Real-time updates
- Quota enforcement
- History tracking

**Usage**:
```typescript
const { alerts, createForTarget, remove, toggleEnabled } = useAlerts()

// Create alert for corridor
await createForTarget({
  type: 'corridor',
  from: 'US',
  to: 'PH',
  method: 'bank'
}, {
  rule: {
    metric: 'rate',
    comparator: 'gte',
    value: 56.0
  },
  frequency: 'daily'
})

// Toggle alert
toggleEnabled(alertId)

// Remove alert
await remove(alertId)
```

## Migration

**File**: `backend/db/migrations/022_alerts.sql`

To apply:
```bash
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
# Get alerts (requires auth token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/alerts

# Create alert
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "watchlistItemId": "watchlist-item-id",
    "rule": {
      "metric": "rate",
      "comparator": "gte",
      "value": 56.0
    },
    "frequency": "daily"
  }' \
  http://localhost:3000/api/alerts
```

### AWS Testing

1. Deploy CDK stack
2. Test via API Gateway endpoint
3. Check CloudWatch Logs for evaluation
4. Verify email delivery in SES console
5. Check database records

## Environment Variables

```bash
# Email notifications
ALERTS_EMAIL_ENABLED=1
ALERTS_EMAIL_FROM=alerts@remitscout.com
ALERTS_EMAIL_FROM_NAME="Remit-Scout Alerts"
SES_REGION=us-east-1

# SMS notifications (future)
ALERTS_SMS_ENABLED=0  # Set to 1 when mobile app is ready
SNS_REGION=us-east-1
SNS_TOPIC_ARN=arn:aws:sns:...

# Site URL for unsubscribe links
PUBLIC_SITE_URL=https://remitscout.com
```

## Monitoring

### CloudWatch Metrics

- `http_requests_total` (method, route, status_code)
- `http_request_duration_seconds` (method, route, status_code)
- Alert evaluation counts
- Email delivery status

### CloudWatch Logs

Check logs for:
- `alert_created` - Alert creation
- `alert_triggered` - Alert fired
- `alert_email_sent` - Email delivery
- `alert_evaluation_failed` - Evaluation errors

## Future Enhancements

1. **Mobile App**: Activate SNS notifications
2. **Smart Notifier**: AI-powered recommendations
3. **Push Notifications**: Browser push notifications
4. **Webhook Support**: Send alerts to external systems
5. **Alert Templates**: Pre-configured alert types
6. **Batch Notifications**: Digest mode for multiple alerts


