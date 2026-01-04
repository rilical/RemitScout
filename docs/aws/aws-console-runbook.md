# AWS Console Runbook (Remit-Scout AWS-Native Cutover)

This runbook lists the AWS Console and account steps required to finish the
AWS-native migration. It is designed to be executed after CDK stacks and
runtime wiring are in place.

## 0) Prereqs
- Choose environment name: `dev`, `staging`, `prod` (used in resource names).
- Choose AWS region. CloudFront WAF requires `us-east-1` for the WAF Web ACL.
- Ensure you have permissions for:
  - Secrets Manager, SSM Parameter Store
  - ECR, ECS, EventBridge, Lambda, API Gateway, CloudFront, WAF
  - CloudWatch Logs/Metrics, X-Ray
  - RDS/Aurora + RDS Proxy

For a full operational checklist (secrets, rotation, backup drills), see:
`docs/aws/aws-ops-checklist.md`.

## 1) Create Secrets Manager entries (rotate-safe format)

### Database (Aurora / RDS Proxy)
Create a secret per environment for DB credentials (example path):
`remit-scout/{env}/database`

Preferred JSON payload:
```json
{
  "username": "remit",
  "password": "YOUR_PASSWORD",
  "host": "YOUR_RDS_PROXY_ENDPOINT",
  "port": "5432",
  "dbname": "remit_scout"
}
```

Notes:
- Code can also read `url` or `DATABASE_URL_PLANE_*`, but the JSON is safer for
  rotation. RDS rotates username/password without rebuilding URLs.

### Redis
`remit-scout/{env}/redis`
```json
{ "url": "redis://:password@your-redis-endpoint:6379" }
```

### Proxy endpoints (Plane B)
`remit-scout/{env}/proxy-residential`
```json
{ "url": "http://user:pass@residential-proxy.example.com:8080" }
```

`remit-scout/{env}/proxy-datacenter`
```json
{ "url": "http://user:pass@datacenter-rotator.example.com:8080" }
```

These URLs are used by the proxy tier router:
- Tier 1 B2B -> `RESIDENTIAL_PREMIUM` -> `PROXY_RESIDENTIAL_URL`
- Tier 2 B2B -> `DATACENTER_ROTATING` -> `PROXY_DATACENTER_URL`

### CDK inputs
Provide secret ARNs (or SSM names) to CDK via environment variables or context.
See `docs/aws/env-vars.md` for the exact variable names.

## 2) Create SSM parameters (non-secret config)

If you prefer SSM for non-sensitive values, use:
`/remit-scout/{env}/...`

Recommended:
- Queue mode flags (off|shadow|queue)
- Feature flags for queue cutover
- Non-secret endpoints

## 3) CodeStar connection (for CodePipeline)
1. AWS Console -> Developer Tools -> CodeStar connections
2. Create GitHub connection
3. Approve in GitHub
4. Copy Connection ARN and set:
   - `PIPELINE_CONNECTION_ARN`
   - `PIPELINE_REPO_OWNER`
   - `PIPELINE_REPO_NAME`
   - `PIPELINE_REPO_BRANCH`
   - `PIPELINE_ENABLE_DEPLOY` (true if you want CDK deploy stage)

## 4) ECR repository + image push
1. Create ECR repo: `remit-scout/backend`
2. Build and push image tag used by CDK (default `latest` or `BACKEND_IMAGE_TAG`)
3. Ensure the tag exists before deploying ECS services.

## 5) CDK bootstrap + deploy
1. Bootstrap (once per account/region):
   - `cdk bootstrap aws://ACCOUNT_ID/REGION`
2. Deploy:
   - `pnpm -C infrastructure/cdk deploy -c env=dev`
3. Confirm outputs:
   - API Gateway endpoints
   - CloudFront domain (Plane A)
   - SQS queue URLs
   - RDS Proxy endpoint
   - Bronze bucket name

## 6) Configure CloudFront + WAF
1. Validate WAF Web ACL exists (only in `us-east-1`).
2. If you need custom domain:
   - Request ACM cert in `us-east-1`
   - Add CNAMEs or Route 53 records to CloudFront distribution
   - Provide `PLANE_A_DOMAIN_NAME` + `PLANE_A_CERT_ARN` to CDK (env or context)
   - Optional: `PLANE_A_HOSTED_ZONE_ID` + `PLANE_A_HOSTED_ZONE_NAME` to create Route 53 alias
3. Adjust WAF rules if rate limiting or managed rules need tuning.

## 7) Verify Lambdas, ECS, and EventBridge schedules
1. Lambda (Plane A / Plane C):
   - Check `/healthz`, `/readyz`, `/metrics`
   - Check CloudWatch Logs for startup errors
2. ECS:
   - Plane B ingestion service
   - Ingest fanout worker
   - Notifications worker
   - Ops alerts worker
3. EventBridge rules:
   - gold-* jobs
   - b2c-refresh worker (ECS target)
   - b2c-retry-failed, stoplist-auto-resume, queue cleanup

## 8) Queue cutover (DB -> SQS)
1. Set queue URLs in environment/SSM:
   - `QUOTE_REFRESH_QUEUE_URL`
   - `PLANE_B_INGEST_FANOUT_QUEUE_URL`
   - `PLANE_B_NOTIFICATIONS_QUEUE_URL`
   - `PLANE_B_OPS_ALERT_QUEUE_URL`
2. Enable queue modes:
   - `PLANE_B_INGEST_FANOUT_QUEUE_MODE=queue`
   - `PLANE_B_NOTIFICATIONS_QUEUE_MODE=queue`
   - `PLANE_B_OPS_ALERT_QUEUE_MODE=queue`
3. Run queue cleanup job once:
   - `b2c-queue-cleanup` (EventBridge rule) or manual trigger
4. Monitor SQS metrics (oldest message age, inflight, DLQ).

## 9) Proxy tier validation (B2B tiers)
1. Verify `silver.corridor_priority.proxy_tier`:
   - Tier 1 -> `RESIDENTIAL_PREMIUM`
   - Tier 2 -> `DATACENTER_ROTATING`
2. Confirm Plane B tasks have proxy envs:
   - `PROXY_RESIDENTIAL_URL`
   - `PROXY_DATACENTER_URL`
3. Use a rotating datacenter proxy endpoint for Tier 2 B2B.
4. Monitor proxy usage logs (`proxy_usage` events in Plane B logs).

## 10) Observability (CloudWatch/X-Ray)
1. Enable X-Ray on Lambda + ECS (already enabled in CDK).
2. CloudWatch:
   - Logs -> verify all services are streaming logs
   - Metrics -> confirm `RemitScout` namespace appears
   - Dashboard -> check `remit-scout-{env}` exists
3. Create dashboards + alarms for:
   - Queue depth + DLQ
   - Lambda errors/latency
   - ECS task restarts
   - RDS CPU/Connections
4. Subscribe to alarm notifications:
   - Output: `CloudWatchAlertsTopicArn`

## 11) Backup monitoring + restore drills
1. Subscribe to the backup alerts SNS topic:
   - Output: `BackupAlertsTopicArn`
   - Add email/Slack/SMS subscription as needed.
2. Confirm AWS Backup plan is running:
   - Vault: `remit-scout-{env}-db`
   - Daily backups with retention (prod: 35d, non-prod: 14d).
3. Confirm restore testing plan:
   - Plan name: `remit-scout-{env}-db-restore`
   - Schedule: monthly (1st at 03:00 UTC by default)
4. Watch for `RESTORE_JOB_FAILED` events and confirm drill results monthly.

## 12) Post-cutover validation
1. API checks:
   - `/api/quotes/current`
   - `/api/popular-corridors`
   - `/internal/publisher/validate`
2. Gold cache jobs:
   - Validate `gold.popular_corridors`, `gold.fx_rates`, `gold.pulse_cache`
3. B2B ingest:
   - Verify tier schedules, proxy usage, and ops alert queues
