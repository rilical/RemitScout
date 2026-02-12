# Dev Observation Report — 2026-02-12 (remit-scout-dev)

Feedback source: chat transcript.  
Goal: “smoke screen + observe everything” (B2C, B2B, queues/workers, Gold health) with low noise/cost.

## Executive Summary

- **Plane A health:** `GET /healthz` = 200, `GET /readyz` = 200 (DB + Redis OK).
- **Gold indices:** `GET /api/v1/indices/health` = `healthy`, latest update `2026-02-12T15:27:51.121Z`.
- **B2C proof (controlled):** `/api/v1/quotes/current` for `US→MX` returns quotes after a one-off `b2c-refresh-worker` ECS task drains the refresh queue.
- **B2B proof (controlled):** a single `ingest-fanout-tier2` message for `wise` (`US-MX-USD-MXN`, bucket=500) produced a successful ingestion run in CloudWatch logs.
- **Alerts/watchlists:** not end-to-end proven in this session because Supabase credentials + a known test-user password were not available to acquire a JWT and hit the authenticated routes.

## Evidence (AWS-console friendly)

### Plane A endpoints (dev)

- API base: `https://vhugw1jucg.execute-api.us-east-1.amazonaws.com`
- Frontend: `https://d255ex8mo4pl5b.cloudfront.net`

### Queue state (after controlled runs)

- `remit-scout-dev-quote-refresh`: `0` (drained during B2C proof).
- `remit-scout-dev-ingest-fanout-tier2`: `0` (single message consumed during B2B proof).
- `remit-scout-dev-gold-live`: `6` (backlog exists; consumer service is scaled to 0 by design in devPaused mode).
- `remit-scout-dev-ops-alerts`: `2` (contains provider block events like CAPTCHA; consumer service is scaled to 0).

### Gold indices freshness behavior

- CloudWatch log groups:
  - `/aws/lambda/remit-scout-dev-GoldIndicesJobFunction*`
- Latest signal observed: `fx_history_stale_using_snapshot` (job continues using `fx_rates` snapshot instead of hard failing).

### B2C proof (US→MX)

- Action:
  - Call `GET /api/v1/quotes/current?corridor_id=US-MX-USD-MXN&amount_bucket=500&payin=bank&payout=bank&live=false`
  - Run a one-off ECS task for `remitscoutdevB2cRefreshWorkerTask8A4CD02D:115` until `quote-refresh` queue depth reaches `0`
  - Re-call the same endpoint and verify quote count > 0
- Evidence:
  - CloudWatch Logs → log group `/remit-scout/dev/b2c-refresh-worker`
  - Recent events include `queue_claimed`, provider `collector_start`, and `quote_attempt_finish`.

### B2B proof (wise single corridor)

- Action:
  - Send one message to SQS queue `remit-scout-dev-ingest-fanout-tier2` with:
    - `corridorId=US-MX-USD-MXN`
    - provider `wise`, collector `b2b_sweep`, bucket `500`, methods `bank_transfer` → `bank_deposit`
  - Run one-off ECS task: `remitscoutdevIngestFanoutTier2WorkerTask8C7FB0CF:19`
- Evidence:
  - CloudWatch Logs → log group `/remit-scout/dev/ingest-fanout-tier2-worker`
  - Observed `plane-b.wise.collector` `collector_start` + `quote_attempt_finish` with `status=success`
  - Example ingestion run id: `dd1c3752-7103-477d-a136-0657df234413` (from logs)

## Gaps / Next Actions

1) **Auth-required smoke (watchlists + alerts)**
   - Need Supabase `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` (anon) for password-grant auth, and a known test user email+password.
   - Once provided, run: `pnpm -C backend ci:alerts-watchlists-smoke` (targets Plane A `/api/v1/watchlist` + `/api/v1/alerts`).

2) **Email send proof**
   - SES sandbox/recipient verification must be handled in AWS SES (us-east-1) before “real inbox delivery” is possible.
   - Until then, we can still prove “send attempt” by CloudWatch logs + `silver.alert_notification_attempt` (if enabled).

3) **Dev smoke expectations**
   - The existing `ci:integration-smoke` checks multiple corridors and will fail in devPaused mode unless those corridors already have fresh cached data.
   - For dev observation, use controlled refresh + targeted corridors (no macro sweeps) to keep noise/cost bounded.

## Pointers

- AWS observer runbook: `docs/runbooks/aws-observer-guide.md`
- Dev observation checklist: `docs/runbooks/dev-observation-session.md`

