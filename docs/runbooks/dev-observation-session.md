# Dev Observation Session (Low-Noise) — Watchlists + Alerts + B2C/B2B Proof

Goal: run a short dev observation window where you can **see** watchlists, alerts, evaluation events, and optional email send-path evidence **without** enabling macro sweeps or spending heavily.

This runbook assumes AWS region `us-east-1` and stack prefix `remit-scout-dev`.

## 1) Resume dev (runtime)

- Repo root: `make ops-resume-dev`

Confirm in AWS Console:
- **RDS → Databases**: Aurora cluster becomes **Available**
- **ECS → Clusters → remit-scout-dev**: desired stays near-zero (cost controlled)
- **EventBridge → Rules**: will be enabled/disabled depending on current OpsPause behavior

## 2) Keep dev low-noise (disable background collection)

AWS Console → **EventBridge → Rules** → filter prefix `remit-scout-dev-`

Disable (keep OFF during observation unless intentionally testing B2B):
- `*b2b-sweep*`
- `*ingest-fanout*`
- `*probe*`
- `*smart-alerts*`
- `*gold-*`
- `*export-*`
- `*fx-rate-refresh-worker*`
- `*b2c-refresh-worker*`

Enable (only what you need to observe watchlists + alerts):
- `*alert-evaluation-weekly*`
- `*alert-evaluation-worker*`

Why we keep `fx-rate-refresh-worker` and `b2c-refresh-worker` disabled:
- In service-backed mode, these are **ECS services with autoscaling** (desired=0 is fine).
- Enabling the EventBridge schedules in parallel is unnecessary noise and can exhaust dev vCPU if misconfigured.

If you need to refresh FX or process a small quote-refresh backlog during the session:
- **AWS Console → ECS → Clusters → `remit-scout-dev` → Tasks → Run new task**
  - Task definition:
    - FX refresh: `remitscoutdevFxRateRefreshWorkerTask*`
    - B2C refresh: `remitscoutdevB2cRefreshWorkerTask*`
  - Launch type: Fargate
  - Subnets/security group: use the same defaults shown on the Plane B services
  - Then watch logs under CloudWatch log groups:
    - `/remit-scout/dev/fx-rate-refresh-worker`
    - `/remit-scout/dev/b2c-refresh-worker`

## 3) Clear drains (make queue signals readable)

AWS Console → **SQS → Queues** (dev prefixed)

Purge these queues (NOT DLQs):
- `*alert-evaluation*`
- `*quote-refresh*`
- `*export-job*`

You should now see:
- `ApproximateNumberOfMessagesVisible = 0`
- `ApproximateAgeOfOldestMessage ~ 0`

## 4) Verify watchlists + alerts from the UI

Dev site → login as admin → `/admin/observer`

Use the product UI to create:
- Watchlist item: **FX pair** `USD/MXN`
- Watchlist item: **FX pair** `BOB/ARS` (random pair)
- Watchlist item: **Corridor** `US → MX (bank)`
- Watchlist item: **Corridor** `BO → AR (bank)` (random corridor)

Create alerts:
- FX alert on `USD/MXN`: `rate gt 0` (always triggers)
- Corridor quote-based alert on `US → MX`: `recipientGets gt 0` (should be allowed if covered)
- Corridor quote-based alert on `BO → AR`: should be rejected with `quote_not_supported`
- Smart alert on `BO → AR`: should be rejected with `smart_not_offered`

Optional (terminal) deterministic check:

Note: do **not** store passwords in this repo. Set the user password in Supabase (Auth → Users) or use a password manager,
then provide it via `SMOKE_USER_PASSWORD` locally.
```sh
export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH"
corepack enable
SMOKE_BASE_URL="https://vhugw1jucg.execute-api.us-east-1.amazonaws.com" \
SMOKE_USER_EMAIL="omar@remit-scout.com" \
SMOKE_USER_PASSWORD="<set in Supabase, do not commit>" \
pnpm -C backend ci:alerts-watchlists-smoke
```

## 5) Trigger alert evaluation immediately (no waiting)

AWS Console → **Lambda**:
- invoke the **alert evaluation scheduler** Lambda with payload:
  - `{ "frequency": "weekly" }`
- invoke the **alert evaluation worker** Lambda with payload:
  - `{ }`

Evidence:
- `/admin/observer` shows new `Alert events` rows in `silver.alert_event`
- CloudWatch logs show evaluation decisions per rule

## 6) Optional: email send-path audit (proof without SES delivery)

In `/admin/observer`:
- Click **Ensure email audit table** once (dev-only)
- Ensure communications secret has `ALERTS_NOTIFICATION_AUDIT=1`

Re-run step 5 and confirm:
- `Email send attempts (audit)` table populates with `sent|failed|skipped`

If SES is sandboxed, you’ll typically see `failed` with an SES reason — that is still valid send-path proof.

## 7) Optional: minimal B2B proof (single corridor only)

Default posture: skip this unless you’re validating Bronze/Silver writes.

If you do it:
- Manually enqueue **one** message into `*ingest-fanout-tier2*`
- Temporarily scale the tier2 ingest-fanout worker to `desired=1`
- Verify:
  - S3 `remit-scout-bronze-dev` has a new object
  - `silver.quote_record` has new rows (shown in `/admin/observer`)
- Scale desired back to `0`

## 8) End the session: pause dev

- Repo root: `make ops-pause-dev`

Confirm:
- EventBridge rules disabled
- ECS desired=0
- Aurora stopped
