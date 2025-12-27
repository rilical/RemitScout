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
- PLANE_C_BASE_URL

## Plane C (Publisher)
- PLANE_C_PORT

## Database
- DATABASE_URL
- DATABASE_URL_PLANE_A
- DATABASE_URL_PLANE_B
- DATABASE_URL_PLANE_C

## Geo
- GEO_COUNTRY_HEADER

## Supabase Auth
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_JWKS_URL (optional)
- SUPABASE_AUTH_VERIFY_MODE (auto|jwks|remote)
- SUPABASE_AUTH_REMOTE_VERIFY_CACHE_TTL_SECONDS

## Stripe Billing
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID_PLUS
- FRONTEND_BASE_URL

## Test-only (optional)
- RUN_BRONZE_GUARDRAIL_TEST
