import { describe, expect, it } from 'vitest'

import { evaluateStagingGoLiveReadiness } from '../scripts/ci/staging-go-live-readiness'

const buildBaseEnv = (): NodeJS.ProcessEnv => ({
  ENVIRONMENT: 'staging',
  NODE_ENV: 'staging',
  AWS_REGION: 'us-east-1',
  AWS_ROLE_TO_ASSUME: 'arn:aws:iam::123456789012:role/remit-scout-staging-github-actions',
  STACK_NAME: 'remit-scout-staging',
  SHARED_SECRET_ARN: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:remit-scout-staging-shared', // pragma: allowlist secret
  SES_IDENTITY_ARNS: 'arn:aws:ses:us-east-1:123456789012:identity/staging.remit-scout.com',
  SNS_TOPIC_ARNS: 'arn:aws:sns:us-east-1:123456789012:remit-scout-staging-critical',
  DATABASE_URL_PLANE_B: 'postgres://staging_user:staging_pass@db.internal:5432/remit_scout', // pragma: allowlist secret
  REDIS_URL: 'redis://cache.internal:6379',
  BRONZE_S3_BUCKET: 'remit-scout-bronze-staging',
  EXPORTS_S3_BUCKET: 'remit-scout-exports-staging',
  PUBLIC_SITE_URL: 'https://staging.remit-scout.com',
  PUBLIC_API_BASE: 'https://staging-api.remit-scout.com/api/v1',
  PLANE_A_DOMAIN_NAME: 'staging-api.remit-scout.com',
  PLANE_A_CERT_ARN: 'arn:aws:acm:us-east-1:123456789012:certificate/staging-plane-a',
  PUBLIC_SUPABASE_URL: 'https://rs-staging.supabase.co',
  PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_staging_key',
  SUPABASE_URL: 'https://rs-staging.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_staging_key',
  SUPABASE_SERVICE_ROLE_KEY: 'sb_service_role_staging_key', // pragma: allowlist secret
  STRIPE_SECRET_KEY: 'sk_test_staging_123', // pragma: allowlist secret
  STRIPE_WEBHOOK_SECRET: 'whsec_staging_123', // pragma: allowlist secret
  STRIPE_PRICE_ID_PLUS: 'price_staging_plus_monthly',
  STRIPE_PRICE_ID_PLUS_ANNUAL: 'price_staging_plus_annual',
  PUBLIC_GA4_MEASUREMENT_ID: 'G-STAGING123',
  PUBLIC_GOOGLE_ADS_CONVERSION_ID: 'AW-123456789',
  NEW_RELIC_USER_API_KEY: 'nrua_staging_key', // pragma: allowlist secret
  NEW_RELIC_ACCOUNT_ID: '7756888',
  NEW_RELIC_REGION: 'US',
  NEW_RELIC_INGEST_KEY: 'nr_ingest_staging_key',
  NEW_RELIC_STAGING_AWS_MODE: 'push_only',
  NEW_RELIC_PROD_AWS_MODE: 'otlp_only',
  NEW_RELIC_AWS_METRIC_STREAM_ENABLED: '1',
  NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES: 'AWS/SQS,AWS/ECS,AWS/Lambda,AWS/Events',
  NEW_RELIC_AWS_LOG_FORWARDING_ENABLED: '0',
  NEW_RELIC_STAGING_AWS_ACCOUNT_ID: '123456789012',
  NEW_RELIC_PROD_AWS_ACCOUNT_ID: '210987654321',
  NEW_RELIC_STAGING_AWS_ROLE_ARN: 'arn:aws:iam::123456789012:role/new-relic-staging',
  NEW_RELIC_PROD_AWS_ROLE_ARN: 'arn:aws:iam::210987654321:role/new-relic-prod',
  SLACK_BOT_TOKEN: 'xoxb-staging-bot-token',
  SLACK_APP_TOKEN: 'xapp-staging-app-token',
  SLACK_SIGNING_SECRET: 'slack-signing-secret-staging', // pragma: allowlist secret
  SLACK_CASES_CHANNEL_ID: 'C12345678',
  ALERT_SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/T12345678/B12345678/abcdefghij',
  SENTRY_AUTH_TOKEN: 'sentry-auth-staging',
  SENTRY_ORG: 'remit-scout',
  SENTRY_PROJECT: 'staging-app',
  REQUIRE_NEW_RELIC_GATES: '1',
  TRACING_EXPORTER: 'otlp',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otlp.nr-data.net',
  OTEL_EXPORTER_OTLP_HEADERS: 'api-key=nr_ingest_staging_key',
  NEW_RELIC_LOGS_ENABLED: '0',
  ADMIN_IP_ALLOWLIST: '203.0.113.10/32',
  READ_ONLY_MODE: '0',
  ADMIN_MFA_REQUIRED: '1',
})

describe('staging go-live readiness policy', () => {
  it('accepts a staging env that matches the custom-domain and MFA policy', () => {
    const evaluation = evaluateStagingGoLiveReadiness(buildBaseEnv())

    expect(evaluation.missingRequired).toEqual([])
    expect(evaluation.placeholderViolations).toEqual([])
    expect(evaluation.policyViolations).toEqual([])
  })

  it('blocks staging when PUBLIC_API_BASE does not match the configured Plane A domain', () => {
    const evaluation = evaluateStagingGoLiveReadiness({
      ...buildBaseEnv(),
      PUBLIC_API_BASE: 'https://api-staging.remit-scout.com/api/v1',
    })

    expect(evaluation.policyViolations).toContain(
      'PUBLIC_API_BASE host api-staging.remit-scout.com must match PLANE_A_DOMAIN_NAME staging-api.remit-scout.com',
    )
  })

  it('requires absolute https staging URLs for public site and api hosts', () => {
    const evaluation = evaluateStagingGoLiveReadiness({
      ...buildBaseEnv(),
      PUBLIC_SITE_URL: 'http://staging.remit-scout.com',
      PUBLIC_API_BASE: '/api/v1',
    })

    expect(evaluation.policyViolations).toContain('PUBLIC_SITE_URL must be an absolute https URL')
    expect(evaluation.policyViolations).toContain('PUBLIC_API_BASE must be an absolute https URL')
  })

  it('allows the current shared-host staging config while surfacing parity gaps as recommendations', () => {
    const evaluation = evaluateStagingGoLiveReadiness({
      ...buildBaseEnv(),
      PUBLIC_API_BASE: 'https://staging.remit-scout.com/api/v1',
      PLANE_A_DOMAIN_NAME: '',
      PLANE_A_CERT_ARN: '',
      ADMIN_MFA_REQUIRED: '0',
    })

    expect(evaluation.policyViolations).toEqual([])
    expect(evaluation.missingRequired).toEqual([])
    expect(evaluation.missingRecommended).toContain(
      'PLANE_A_DOMAIN_NAME: Plane A staging custom-domain host (optional until staging API edge is provisioned)',
    )
    expect(evaluation.missingRecommended).toContain(
      'PLANE_A_CERT_ARN: Plane A staging ACM certificate ARN (optional until staging API edge is provisioned)',
    )
    expect(evaluation.missingRecommended).toContain(
      'ADMIN_MFA_REQUIRED: enable admin MFA in staging before enforcing production-parity admin smoke',
    )
  })

  it('blocks partial Plane A custom-domain configuration', () => {
    const evaluation = evaluateStagingGoLiveReadiness({
      ...buildBaseEnv(),
      PLANE_A_CERT_ARN: '',
    })

    expect(evaluation.policyViolations).toContain(
      'PLANE_A_DOMAIN_NAME and PLANE_A_CERT_ARN must be configured together',
    )
  })

  it('allows staging when metric streaming is intentionally disabled', () => {
    const evaluation = evaluateStagingGoLiveReadiness({
      ...buildBaseEnv(),
      NEW_RELIC_AWS_METRIC_STREAM_ENABLED: '0',
      NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES: '',
    })

    expect(evaluation.policyViolations).toEqual([])
  })

  it('blocks drifted New Relic cost-control settings', () => {
    const evaluation = evaluateStagingGoLiveReadiness({
      ...buildBaseEnv(),
      NEW_RELIC_STAGING_AWS_MODE: 'push_pull',
      NEW_RELIC_LOGS_ENABLED: '1',
      NEW_RELIC_AWS_LOG_FORWARDING_ENABLED: '1',
      NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES: 'AWS/SQS,AWS/ECS',
    })

    expect(evaluation.policyViolations).toContain(
      'NEW_RELIC_STAGING_AWS_MODE must be "push_only" in staging',
    )
    expect(evaluation.policyViolations).toContain(
      'NEW_RELIC_LOGS_ENABLED must be "0" in staging to keep CloudWatch as source of truth',
    )
    expect(evaluation.policyViolations).toContain(
      'NEW_RELIC_AWS_LOG_FORWARDING_ENABLED must be "0" in staging',
    )
    expect(evaluation.policyViolations).toContain(
      'NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES must be exactly AWS/SQS, AWS/ECS, AWS/Lambda, AWS/Events',
    )
  })
})
