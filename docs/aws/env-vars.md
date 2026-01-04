# AWS Environment Variables (Sprint 2 baseline)

Use this as a reminder for what must be configured in AWS (ECS/Lambda/EC2). Store secrets in AWS Secrets Manager and non-secrets in SSM Parameter Store. If unsure, treat the value as a secret.

## Plane A (API/Auth/Billing)
- PLANE_A_PORT
- PLANE_A_RATE_LIMIT_MAX
- PLANE_A_RATE_LIMIT_WINDOW_MS
- PLANE_A_REQUIRE_API_KEY
- PLANE_A_REQUIRE_JWT
- PLANE_A_API_KEYS
- PLANE_A_JWT_SECRET
- PLANE_A_JWT_ISSUER (API Gateway JWT authorizer)
- PLANE_A_JWT_AUDIENCES (comma-separated, API Gateway JWT authorizer)
- PLANE_A_ENABLE_JWT_AUTH (1|true to enable API Gateway JWT auth)
- PLANE_C_BASE_URL
- PLANE_A_CORS_ORIGINS (comma-separated, optional)
- PLANE_A_CORS_ALLOWED_HEADERS (comma-separated, optional)
- PLANE_A_CORS_ALLOWED_METHODS (comma-separated, optional)
- PLANE_A_CORS_ALLOW_CREDENTIALS (1|true, optional)
- PLANE_A_DOMAIN_NAME (optional, CloudFront custom domain)
- PLANE_A_CERT_ARN (optional, ACM cert for CloudFront)
- PLANE_A_HOSTED_ZONE_ID (optional, Route 53 zone ID)
- PLANE_A_HOSTED_ZONE_NAME (optional, Route 53 zone name)
- PLANE_A_API_THROTTLE_RATE (optional, API Gateway stage throttle)
- PLANE_A_API_THROTTLE_BURST (optional, API Gateway stage throttle)

## Plane C (Publisher)
- PLANE_C_PORT
- PLANE_C_ENABLE_IAM_AUTH (1|true to require SigV4 at API Gateway)
- PLANE_C_DISABLE_EXECUTE_ENDPOINT (1|true to disable execute-api endpoint)
- PLANE_C_API_THROTTLE_RATE (optional, API Gateway stage throttle)
- PLANE_C_API_THROTTLE_BURST (optional, API Gateway stage throttle)

## Database
- DATABASE_URL
- DATABASE_URL_PLANE_A
- DATABASE_URL_PLANE_B
- DATABASE_URL_PLANE_C
- PGSSLMODE (set to require in production)

## Storage (Bronze S3)
- BRONZE_S3_BUCKET
- BRONZE_S3_PREFIX

## Storage (Exports S3)
- EXPORTS_S3_BUCKET
- EXPORTS_S3_PREFIX
- EXPORT_JOB_MAX_ACTIVE_PER_USER

## Geo
- GEO_COUNTRY_HEADER

## Supabase Auth
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_JWKS_URL (optional)
- SUPABASE_AUTH_VERIFY_MODE (auto|jwks|remote)
- SUPABASE_AUTH_REMOTE_VERIFY_CACHE_TTL_SECONDS

## Frontend (Public)
- PUBLIC_SUPABASE_URL
- PUBLIC_SUPABASE_ANON_KEY

## Stripe Billing
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID_PLUS
- FRONTEND_BASE_URL

## Newsletter
- NEWSLETTER_EMAIL_ENABLED
- NEWSLETTER_EMAIL_FROM
- NEWSLETTER_EMAIL_FROM_NAME
- NEWSLETTER_BASE_URL
- NEWSLETTER_TOKEN_EXPIRY_HOURS
- NEWSLETTER_WELCOME_ENABLED

## Observability
- CLOUDWATCH_METRICS_ENABLED
- CLOUDWATCH_NAMESPACE
- CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS
- CLOUDWATCH_HIGH_CARDINALITY_METRICS
- TRACING_EXPORTER (xray|otlp|none)
- OTEL_LAMBDA_LAYER_ARN (optional AWS OTel Lambda layer)

## Queues (SQS)
- QUOTE_REFRESH_QUEUE_URL
- QUOTE_REFRESH_DLQ_URL
- QUOTE_REFRESH_QUEUE_MODE (off|shadow|queue)
- EXPORT_JOB_QUEUE_URL
- EXPORT_JOB_QUEUE_MODE (off|shadow|queue)
- PLANE_B_INGEST_FANOUT_QUEUE_URL
- PLANE_B_NOTIFICATIONS_QUEUE_URL
- PLANE_B_OPS_ALERT_QUEUE_URL
- PLANE_B_INGEST_FANOUT_QUEUE_MODE (off|shadow|queue)
- PLANE_B_NOTIFICATIONS_QUEUE_MODE (off|shadow|queue)
- PLANE_B_OPS_ALERT_QUEUE_MODE (off|shadow|queue)
- PLANE_B_B2C_QUEUE_IN_SWEEP (enable enqueue during sweeps)

## Proxy infrastructure (Plane B)
- PROXY_RESIDENTIAL_URL (Tier 1 B2B; residential/ISP proxy endpoint)
- PROXY_DATACENTER_URL (Tier 2 B2B; rotating datacenter proxy endpoint)
- PROXY_RESIDENTIAL_SECRET_ARN (optional; Secrets Manager source)
- PROXY_RESIDENTIAL_SECRET_JSON_KEY (optional; JSON field name for proxy URL)
- PROXY_RESIDENTIAL_SSM_NAME (optional; SSM parameter name)
- PROXY_DATACENTER_SECRET_ARN (optional; Secrets Manager source)
- PROXY_DATACENTER_SECRET_JSON_KEY (optional; JSON field name for proxy URL)
- PROXY_DATACENTER_SSM_NAME (optional; SSM parameter name)

## CI/CD (CodePipeline)
- PIPELINE_CONNECTION_ARN
- PIPELINE_REPO_OWNER
- PIPELINE_REPO_NAME
- PIPELINE_REPO_BRANCH
- PIPELINE_ENABLE_DEPLOY

## Edge Security (WAF/CloudFront)
- ENABLE_CLOUDFRONT (1|true)
- ENABLE_WAF (1|true)
- WAF_ALLOWLIST_IPS (comma-separated CIDRs)
- WAF_BLOCKLIST_IPS (comma-separated CIDRs)
- WAF_ENABLE_BOT_CONTROL (1|true)

## Test-only (optional)
- RUN_BRONZE_GUARDRAIL_TEST
