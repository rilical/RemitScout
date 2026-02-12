# AWS Observer Guide (No-Terminal) — Remit‑Scout Dev

Goal: walk into AWS Console and quickly answer:
1) are we ingesting quotes (Silver)?
2) are we producing indices (Gold TEER/RCI/RVI)?
3) are exports landing (S3)?
4) are alerts evaluating/sending (or blocked)?

This guide is optimized for **observation**, not collection. If dev is paused, you will still be able to see historical data and queue backlog, but nothing will advance.

For a step-by-step “today’s observation window” checklist (watchlists + alerts + minimal B2C/B2B), use:
- `docs/runbooks/dev-observation-session.md`

## 0) Confirm dev is running (or intentionally paused)

**AWS Console → ECS → Clusters → `remit-scout-dev`**
- If all services show **Desired = 0**: dev is paused (expected most of the time).

**AWS Console → RDS → Databases**
- Aurora cluster should be **Available** when running, **Stopped** when paused.

**AWS Console → Amazon EventBridge → Rules**
- Filter by prefix `remit-scout-dev-`
- Rules should be **Enabled** when running, **Disabled** when paused.

If you need dev running temporarily, use the OpsPause path (preferred) via `make ops-resume-dev` / `make ops-pause-dev` (see `docs/runbooks/dev-pause-resume.md`).

## 1) One-page infra visualization: CloudWatch dashboard

**AWS Console → CloudWatch → Dashboards → `remit-scout-dev`**

This is provisioned by CDK (`infrastructure/cdk/lib/monitoring.ts`) and shows:
- SQS queue depth + DLQs
- API Gateway latency + 5xx rate
- Lambda errors
- ECS CPU/memory
- Aurora CPU/connections
- Redis CPU
- Data health/SLO widgets (freshness, success rate, coverage, indices readiness)
- Provider probe heartbeat

What “healthy” looks like (dev):
- DLQ depth flat at 0
- Queue age not climbing continuously (some sawtooth is normal)
- API 5xx rate ~0, latency stable
- Indices readiness widgets non-zero once gold jobs run

## 2) “Is data coming in?”: SQS + ECS (without logs)

**AWS Console → SQS → Queues**
Look at these queues (names include `remit-scout-dev-`):
- Ingest fanout tier2 (drain health)
- Quote refresh (B2C)
- Alert evaluation
- Export job

Key visuals:
- `ApproximateNumberOfMessagesVisible` (backlog)
- `ApproximateAgeOfOldestMessage` (stuckness)
- DLQ depth (badness)

If backlog grows while ECS is running, check:
**AWS Console → ECS → Clusters → `remit-scout-dev` → Services**
- `Running count` vs `Desired count`
- Service events (task placement, crashes)

## 3) “Is it recorded correctly?”: RDS Query Editor v2 (SQL, but in console)

**AWS Console → RDS → Query Editor v2**
- Connect to the dev Aurora cluster (writer)
- Database: Postgres

### Silver (quotes / ingestion)
Latest quotes:
```sql
SELECT
  provider_slug,
  corridor_id,
  amount_bucket,
  payin_method,
  payout_method,
  send_amount,
  receive_amount,
  implied_fx_rate,
  collected_at,
  created_at
FROM silver.quote_record
ORDER BY created_at DESC
LIMIT 200;
```

Latest ingestion runs:
```sql
SELECT
  id,
  status,
  started_at,
  finished_at,
  error
FROM silver.ingestion_run
ORDER BY started_at DESC
LIMIT 50;
```

### Gold (indices TEER/RCI/RVI)
Latest indices rows:
```sql
SELECT
  date,
  corridor_id,
  amount_bucket,
  method_profile,
  teer_rate,
  rci_ratio,
  rvi_bps,
  provider_count,
  suppression_flag,
  suppression_reason,
  created_at
FROM gold_export.cdp_daily
ORDER BY created_at DESC
LIMIT 200;
```

“Is gold fresh?” quick check (amount_bucket=500):
```sql
SELECT MAX(date) AS latest_date
FROM gold_export.cdp_daily
WHERE amount_bucket = 500;
```

## 4) “Are indices healthy?”: Ops API (UI + endpoint)

There are admin-only endpoints on Plane A:
- `/api/v1/ops/indices/health`
- `/api/v1/ops/b2b-sweep-status`
- `/api/v1/ops/observer/summary` (latest watchlists, alerts, alert events, quotes, and DB fallback queue counts)
- `/api/v1/ops/<providerId>/health` (many providers)

Best way without terminal: use the web UI.

### UI path (recommended)
Open your dev site → **Admin → Observer Console** (`/admin/observer`)
- Requires an admin user (see `PLANE_A_ADMIN_EMAILS` / Supabase role + `requireAdmin()`).
- Provider health grid calls `/api/v1/ops/<providerId>/health`
- Indices health should be surfaced via ops endpoints (and is also on the CloudWatch dashboard via SLO widgets once jobs run)

If you want a direct JSON check in browser:
Open dev API base and hit:
- `.../api/v1/ops/indices/health` (must be logged in as admin)

## 5) Bronze + Exports artifacts: S3

**AWS Console → S3 → Buckets**
- `remit-scout-bronze-dev` (raw payloads; used by Plane B)
- `remit-scout-exports-dev` (generated CSV/PDF exports)

What to look for:
- Bronze: recent object keys under the `bronze/` prefix (if configured)
- Exports: `exports/` prefix contains generated files; timestamps correlate with export jobs.

## 6) Exports as CSV: in-product (best UX)

Exports are created through the app and are backed by the exports queue + worker.

UI:
- Dashboard → Enterprise/Exports surfaces

API contract (for reference): `backend/plane-a/src/routes/exports.ts`
- POST `/api/v1/exports` (create)
- GET `/api/v1/exports` (list)
- GET `/api/v1/exports/:id/download` (signed URL)

The history CSV includes: `teer_rate`, `rci_ratio`, `rvi_bps` (`backend/scripts/export-worker-constants.ts`).

## 7) Alerts: where to look (evaluation + send)

### A) Are alerts being evaluated?
**SQS**
- `alert-evaluation` queue depth/age

**CloudWatch Logs**
- Search log groups for `alert` / `AlertEvaluation`
- Look for evaluation events and notification statuses.

### B) Are emails actually sending?
Two common blockers in dev:
1) SES is in sandbox (needs verified recipients or production access).
2) From identity not verified.

Optional (dev-only observation): if Plane A is configured with `ALERTS_NOTIFICATION_AUDIT=1`,
send attempts are persisted to `silver.alert_notification_attempt` and surfaced in the Observer Console.

If the Observer Console shows a 500 error and Plane A logs mention
`relation "silver.alert_notification_attempt" does not exist`, run the dev-only admin endpoint once:
- POST `/api/v1/ops/db/ensure-alert-notification-attempts`

This creates the observation table (equivalent to migration `backend/db/migrations/073_alert_notification_attempts.sql`)
without requiring an ECS image rebuild.

**AWS Console → SES (us-east-1)**
- Verified identities (From domain/email)
- Account dashboard (Production access enabled?)

## 8) Fast mental model (what maps to what)

- **Collection (B2B/B2C)** → SQS queues → ECS workers → write **Silver** tables
- **Indices (Gold)** → scheduled job → reads Silver + FX → writes `gold_export.cdp_daily`
- **Exports** → user request → export job queue → worker → S3 `remit-scout-exports-dev`
- **Ops visibility** → CloudWatch dashboard + `/api/v1/ops/*` endpoints + SQS metrics
