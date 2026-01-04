# DB Queue to SQS Cutover (Quote Refresh)

## Goal

Move the B2C quote refresh queue from the database table
`silver.quote_refresh_request` to SQS while keeping safe rollback paths.

## Current behavior

- Plane A inserts into `silver.quote_refresh_request` unless `QUOTE_REFRESH_QUEUE_MODE=queue`.
- If `QUOTE_REFRESH_QUEUE_URL` is set and `QUOTE_REFRESH_QUEUE_MODE` is `shadow` or `queue`,
  Plane A publishes a matching SQS message.
- Plane B consumes from SQS only when `QUOTE_REFRESH_QUEUE_MODE=queue`.
  In `shadow` and `off`, Plane B consumes from the DB queue.

This means the system can run in **shadow mode** by enabling SQS only on Plane A.

## Prerequisites

- SQS queue created (CDK outputs: `QuoteRefreshQueueUrl` and DLQ).
- IAM: Plane A can `SendMessage`; Plane B can `ReceiveMessage` and `DeleteMessage`.
- Env set:
  - Plane A: `QUOTE_REFRESH_QUEUE_URL`
  - Plane B: `QUOTE_REFRESH_QUEUE_URL`
  - Optional DLQ: `QUOTE_REFRESH_DLQ_URL` (if set, max-retry messages are forwarded)
  - Both: `QUOTE_REFRESH_QUEUE_MODE` (`off` | `shadow` | `queue`)

## Cutover steps (recommended)

1) **Shadow publish**
   - Set `QUOTE_REFRESH_QUEUE_URL` and `QUOTE_REFRESH_QUEUE_MODE=shadow` in Plane A only.
   - Plane A continues DB writes and publishes SQS messages.
   - Validate SQS depth and payloads without changing consumption.

2) **Dual consumption**
   - Keep `QUOTE_REFRESH_QUEUE_MODE=shadow` and set `QUOTE_REFRESH_QUEUE_URL` in Plane B.
   - Monitor:
     - SQS queue depth
     - `b2c_refresh_requests_*` metrics
     - DB queue growth (should still increase because Plane A writes).

3) **Queue-first**
   - Set `QUOTE_REFRESH_QUEUE_MODE=queue` in Plane A and Plane B.
   - Plane A publishes only to SQS (no DB enqueue).
   - Plane B consumes only from SQS (no DB status writes).
   - DB retention decision (current): **keep DB inserts for audit/metrics** in shadow mode
     if required; otherwise rely on SQS + logs.
     - EventBridge rule `b2c-queue-cleanup` runs daily by default.
     - Adjust retention using:
       - `QUOTE_REFRESH_CLEANUP_AGE_HOURS` (default 168h / 7 days)
       - `QUOTE_REFRESH_CLEANUP_STATUSES` (default completed,failed,blocked,skipped)
     - Queue-only mode is now supported via `QUOTE_REFRESH_QUEUE_MODE=queue`.

## Rollback

- Remove `QUOTE_REFRESH_QUEUE_URL` from Plane B to return to DB consumption.
- Remove `QUOTE_REFRESH_QUEUE_URL` from Plane A to stop SQS publishing, or set
  `QUOTE_REFRESH_QUEUE_MODE=off` to return to DB-only.

## Related queue feature flags (Plane B)

- `PLANE_B_INGEST_FANOUT_QUEUE_MODE`: `off` (default) | `shadow` | `queue`
- `PLANE_B_NOTIFICATIONS_QUEUE_MODE`: `off` (default) | `shadow` | `queue`
- `PLANE_B_OPS_ALERT_QUEUE_MODE`: `off` (default) | `shadow` | `queue`

Notes:
- `shadow` sends messages but keeps the current inline/DB behavior.
- `queue` skips inline processing where supported (ingestion fanout, notifications).
  A consumer/worker is required before using `queue` in production.
