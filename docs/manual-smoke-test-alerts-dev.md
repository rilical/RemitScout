# Manual Smoke Test: Alerts (dev)

Goal: create a user, save a watchlist item, create a weekly alert, and verify it evaluates.

## Prereqs
- Dev DB configured: `DATABASE_URL_PLANE_A` set.
- Supabase test project credentials:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY` (anon key)
  - Optional: `SUPABASE_SERVICE_ROLE_KEY` if you need to confirm users via admin API.

## 1) Start Plane A
```sh
SUPABASE_URL="https://<project>.supabase.co" \
SUPABASE_PUBLISHABLE_KEY="<anon-key>" \
pnpm -C backend dev:plane-a
```

## 2) Create a dev user + fetch access token
If email confirmation is enabled in Supabase, either disable it in the dev project or confirm the user via admin API.

```sh
export API_BASE="http://localhost:4000/api/v1"
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_PUBLISHABLE_KEY="<anon-key>"
export TEST_EMAIL="alerts-test@remitscout.dev"
export TEST_PASSWORD="change-this-password"

curl -sS "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" | jq

export ACCESS_TOKEN="$(curl -sS "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" | jq -r '.access_token')"

export AUTH="Authorization: Bearer $ACCESS_TOKEN"
```

Call `/me` to upsert the account and plan:
```sh
curl -sS "$API_BASE/me" -H "$AUTH" | jq
```

## 3) Seed an FX rate (so rate alerts can evaluate)
Insert a single FX rate for a corridor you plan to watch:
```sh
psql "$DATABASE_URL_PLANE_A" <<'SQL'
INSERT INTO gold.fx_rates (base_currency, quote_currency, rate, bid, ask, source, last_updated)
VALUES ('USD', 'PHP', 56.5, 56.4, 56.6, 'MANUAL', NOW())
ON CONFLICT (base_currency, quote_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  bid = EXCLUDED.bid,
  ask = EXCLUDED.ask,
  source = EXCLUDED.source,
  last_updated = EXCLUDED.last_updated,
  updated_at = NOW();
SQL
```

## 4) Create a watchlist item
```sh
curl -sS "$API_BASE/watchlist" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "target": { "type": "corridor", "from": "US", "to": "PH", "method": "bank" },
    "label": "US->PH Bank"
  }' | jq
```
Capture the `item.id` as `WATCHLIST_ID`.

## 5) Create a weekly alert
```sh
export WATCHLIST_ID="replace-with-id"
curl -sS "$API_BASE/alerts" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"watchlistItemId\": \"$WATCHLIST_ID\",
    \"frequency\": \"weekly\",
    \"enabled\": true,
    \"rule\": {
      \"metric\": \"rate\",
      \"comparator\": \"gte\",
      \"value\": 50,
      \"currency\": \"PHP\"
    }
  }" | jq
```

## 6) Evaluate alerts locally (one-shot)
```sh
pnpm -C backend tsx -e "import { createPool } from './shared/db'; import { config } from './shared/config'; import { evaluateAlertsForFrequency } from './plane-a/src/services/alert-evaluator'; const pool = createPool(config.db.planeAUrl); evaluateAlertsForFrequency(pool, 'weekly').then(() => pool.end());"
```

## 7) Verify evaluation results
```sh
psql "$DATABASE_URL_PLANE_A" <<'SQL'
SELECT id, alert_id, triggered_at, value, message, notification_status
FROM silver.alert_event
ORDER BY triggered_at DESC
LIMIT 5;
SQL
```

## Notes
- Emails/SMS/push are gated by env flags (`ALERTS_EMAIL_ENABLED`, `ALERTS_SMS_ENABLED`, `PUSH_WEB_ENABLED`).
- Smart alerts require `silver.corridor_signals` data; use `pnpm -C backend smart-alerts:refresh` after seeding `silver.quote_record` if you want to test smart alerts specifically.
