# AWS Ops Checklist (Secrets, Rotation, Backup)

Use this checklist for each environment (`dev`, `staging`, `prod`).

## Secrets Manager
- [ ] Database secret created (`remit-scout/{env}/database`) with JSON fields:
  - `username`, `password`, `host`, `port`, `dbname`
- [ ] Redis secret created (`remit-scout/{env}/redis`) with `url`
- [ ] Proxy secrets created:
  - `remit-scout/{env}/proxy-residential`
  - `remit-scout/{env}/proxy-datacenter`
- [ ] Stripe secrets created:
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PLUS`
- [ ] Supabase secrets created:
  - `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- [ ] Plane A JWT secret set (`PLANE_A_JWT_SECRET`)

## SSM Parameter Store
- [ ] Queue URLs set (if not injecting via CDK outputs):
  - `QUOTE_REFRESH_QUEUE_URL`
  - `PLANE_B_INGEST_FANOUT_QUEUE_URL`
  - `PLANE_B_NOTIFICATIONS_QUEUE_URL`
  - `PLANE_B_OPS_ALERT_QUEUE_URL`
- [ ] Queue modes set (off|shadow|queue):
  - `PLANE_B_INGEST_FANOUT_QUEUE_MODE`
  - `PLANE_B_NOTIFICATIONS_QUEUE_MODE`
  - `PLANE_B_OPS_ALERT_QUEUE_MODE`
- [ ] B2C sweep queueing flag set if needed:
  - `PLANE_B_B2C_QUEUE_IN_SWEEP`

## Rotation
- [ ] Enable automatic rotation for DB secret (recommended monthly).
- [ ] Ensure RDS Proxy uses the rotating secret.
- [ ] Validate that DB URL is derived from JSON fields (rotation safe).

## Backup + Restore Testing
- [ ] AWS Backup vault exists (`remit-scout-{env}-db`)
- [ ] Backup plan runs daily; retention is 30d (prod) or 14d (non-prod)
- [ ] Restore testing plan runs monthly (1st @ 03:00 UTC)
- [ ] Alerts topic subscribed:
  - `BackupAlertsTopicArn` from stack outputs

## Observability
- [ ] CloudWatch dashboard exists:
  - `CloudWatchDashboardName` from stack outputs
- [ ] CloudWatch alerts topic subscribed:
  - `CloudWatchAlertsTopicArn` from stack outputs
- [ ] X-Ray enabled for Lambda + ECS (daemon sidecar running)

## Queue Cutover (DB -> SQS)
- [ ] Plane A `QUOTE_REFRESH_QUEUE_URL` set (shadow publish)
- [ ] Plane B `QUOTE_REFRESH_QUEUE_URL` set (SQS consume)
- [ ] `b2c-queue-cleanup` scheduled to prune DB queue rows

