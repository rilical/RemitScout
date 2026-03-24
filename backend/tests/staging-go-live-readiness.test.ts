import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  buildReleaseEvidenceManifest,
  evaluateMigrationSync,
  evaluateStagingGoLiveReadiness,
  validateReleaseEvidenceManifest,
} from '../scripts/ci/staging-go-live-readiness'

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
  NEW_RELIC_LOGS_ENABLED: '1',
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

  it('allows the current Plane A CloudFront staging config while surfacing parity gaps as recommendations', () => {
    const evaluation = evaluateStagingGoLiveReadiness({
      ...buildBaseEnv(),
      PUBLIC_API_BASE: 'https://d2y41w4y2l2rad.cloudfront.net/api/v1',
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

    expect(evaluation.missingRequired).toEqual([])
    expect(evaluation.policyViolations).toEqual([])
  })

  it('defaults omitted New Relic mode flags to the staging deploy contract', () => {
    const env = buildBaseEnv()
    delete env.NEW_RELIC_STAGING_AWS_MODE
    delete env.NEW_RELIC_PROD_AWS_MODE
    delete env.NEW_RELIC_LOGS_ENABLED

    const evaluation = evaluateStagingGoLiveReadiness(env)

    expect(evaluation.missingRequired).toEqual([])
    expect(evaluation.policyViolations).toEqual([])
  })

  it('blocks attempts to disable New Relic hard gates in staging readiness', () => {
    const evaluation = evaluateStagingGoLiveReadiness({
      ...buildBaseEnv(),
      REQUIRE_NEW_RELIC_GATES: '0',
    })

    expect(evaluation.policyViolations).toContain(
      'REQUIRE_NEW_RELIC_GATES must stay enabled for staging readiness evidence',
    )
  })

  it('blocks New Relic account-pinning drift across staging and prod', () => {
    const evaluation = evaluateStagingGoLiveReadiness({
      ...buildBaseEnv(),
      NEW_RELIC_PROD_AWS_ACCOUNT_ID: '123456789012',
      NEW_RELIC_PROD_AWS_ROLE_ARN: 'arn:aws:iam::999999999999:role/new-relic-prod',
    })

    expect(evaluation.policyViolations).toContain(
      'NEW_RELIC_STAGING_AWS_ACCOUNT_ID and NEW_RELIC_PROD_AWS_ACCOUNT_ID must differ to preserve env account pinning',
    )
    expect(evaluation.policyViolations).toContain(
      'NEW_RELIC_PROD_AWS_ROLE_ARN must belong to NEW_RELIC_PROD_AWS_ACCOUNT_ID',
    )
  })

  it('blocks drifted New Relic staging policy settings', () => {
    const evaluation = evaluateStagingGoLiveReadiness({
      ...buildBaseEnv(),
      NEW_RELIC_STAGING_AWS_MODE: 'push_pull',
      NEW_RELIC_LOGS_ENABLED: '0',
      NEW_RELIC_AWS_LOG_FORWARDING_ENABLED: '1',
      NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES: 'AWS/SQS,AWS/ECS',
    })

    expect(evaluation.policyViolations).toContain(
      'NEW_RELIC_STAGING_AWS_MODE must be "push_only" in staging',
    )
    expect(evaluation.policyViolations).toContain(
      'NEW_RELIC_LOGS_ENABLED must be "1" in staging so deploy/readiness gates stay aligned',
    )
    expect(evaluation.policyViolations).toContain(
      'NEW_RELIC_AWS_LOG_FORWARDING_ENABLED must be "0" in staging',
    )
    expect(evaluation.policyViolations).toContain(
      'NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES must be exactly AWS/SQS, AWS/ECS, AWS/Lambda, AWS/Events',
    )
  })

  it('detects pending repo migrations and unexpected applied migrations', () => {
    const evaluation = evaluateMigrationSync({
      repoMigrations: ['001_init.sql', '002_add_quotes.sql', '003_add_exports.sql'],
      appliedMigrations: ['001_init.sql', '099_manual_hotfix.sql'],
    })

    expect(evaluation.missingSchemaMigrationsTable).toBe(false)
    expect(evaluation.pendingRepoMigrations).toEqual(['002_add_quotes.sql', '003_add_exports.sql'])
    expect(evaluation.unexpectedAppliedMigrations).toEqual(['099_manual_hotfix.sql'])
  })

  it('treats legacy-applied migration ids as equivalent to the canonical renumbered files', () => {
    const evaluation = evaluateMigrationSync({
      repoMigrations: [
        '104_observation_module_registry_triangulation_hardening.sql',
        '105_provider_reliability_control_plane.sql',
        '108_rights_matrix_audit_tracking.sql',
        '109_launch_user_roles.sql',
      ],
      appliedMigrations: [
        '104_observation_module_registry_triangulation_hardening.sql',
        '105_provider_reliability_control_plane.sql',
        '104_rights_matrix_audit_tracking.sql',
        '105_launch_user_roles.sql',
      ],
    })

    expect(evaluation.missingSchemaMigrationsTable).toBe(false)
    expect(evaluation.pendingRepoMigrations).toEqual([])
    expect(evaluation.unexpectedAppliedMigrations).toEqual([])
  })

  it('fails release evidence validation when required logs or SHA binding are missing', () => {
    const violations = validateReleaseEvidenceManifest(
      {
        schemaVersion: 'staging-go-live-release-evidence@v1',
        status: 'fail',
        generatedAt: '2026-03-17T12:00:00.000Z',
        git: {
          requestedDeploySha: 'deadbeef',
          actualHeadSha: 'deadbeef',
        },
        workflow: {
          runId: '123',
          runAttempt: '1',
        },
        migrations: {
          missingSchemaMigrationsTable: false,
          pendingRepoMigrations: ['117_new_gate.sql'],
          unexpectedAppliedMigrations: [],
        },
        artifacts: {
          requiredFiles: ['staging-admin-surface-smoke.log'],
          presentFiles: [],
          missingFiles: ['staging-admin-surface-smoke.log'],
          misleadingFiles: [],
        },
        violations: [
          'pending repo migrations detected: 117_new_gate.sql',
          'missing release evidence files: staging-admin-surface-smoke.log',
        ],
      },
      'cafebabe',
    )

    expect(violations).toContain('release evidence manifest status is fail')
    expect(violations).toContain('pending repo migrations detected: 117_new_gate.sql')
    expect(violations).toContain('missing release evidence files: staging-admin-surface-smoke.log')
    expect(violations).toContain(
      'release evidence requested SHA deadbeef does not match expected SHA cafebabe',
    )
    expect(violations).toContain(
      'release evidence actual HEAD SHA deadbeef does not match expected SHA cafebabe',
    )
  })

  it('builds a passing release evidence manifest when logs are present and clean', async () => {
    const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'staging-readiness-artifacts-'))
    const migrationsDir = await mkdtemp(path.join(os.tmpdir(), 'staging-readiness-migrations-'))

    try {
      await writeFile(path.join(migrationsDir, '001_init.sql'), '-- migration\n', 'utf8')
      await writeFile(path.join(migrationsDir, '002_gate.sql'), '-- migration\n', 'utf8')

      await Promise.all([
        writeFile(path.join(artifactDir, 'staging-public-integration-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-agent-pipeline-health.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-auth-surface-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-omar-entitlement-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-enterprise-triangulation-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-worker-resilience-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-admin-surface-smoke.log'), 'observer exercised\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-public-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-auth-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-admin-ui-smoke.log'), 'grant revoke complete\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-public-integration-post-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-observability-business-gate.log'), 'Observability business gate passed.\n', 'utf8'),
        writeFile(
          path.join(artifactDir, 'staging-sentry-release-scope.json'),
          `${JSON.stringify({
            schemaVersion: 'staging-sentry-release-scope@v1',
            status: 'pass',
            release: 'readiness-scope-check-123-2',
            checkedAt: '2026-03-17T12:00:00.000Z',
            workflow: {
              runId: '123',
              runAttempt: '2',
            },
          }, null, 2)}\n`,
          'utf8',
        ),
        writeFile(
          path.join(artifactDir, 'staging-newrelic-notifications-evidence.json'),
          `${JSON.stringify({
            verification: {
              passed: true,
              mirrorPoliciesRequired: true,
            },
            workflows: {
              staging: { matchedPolicyNames: ['Remit-Scout STAGING CloudWatch Mirror'] },
              prod: { matchedPolicyNames: ['Remit-Scout PROD CloudWatch Mirror'] },
            },
          }, null, 2)}\n`,
          'utf8',
        ),
        writeFile(
          path.join(artifactDir, 'staging-newrelic-verify-signals.json'),
          `${JSON.stringify({
            results: [
              {
                envName: 'staging',
                awsMode: 'push_only',
                failures: [],
                checks: {
                  metricCount: 12,
                  logCount: 8,
                  spanCount: 5,
                  sqsMetricCount: 3,
                  customMetricCount: 7,
                  customMetricFamilies: {
                    core_slo_indices: 4,
                  },
                },
              },
            ],
          }, null, 2)}\n`,
          'utf8',
        ),
      ])

      const manifest = await buildReleaseEvidenceManifest({
        artifactDir,
        migrationsDir,
        env: {
          READINESS_DEPLOY_SHA: 'cafebabe',
          GITHUB_SHA: 'cafebabe',
          GITHUB_RUN_ID: '123',
          GITHUB_RUN_ATTEMPT: '2',
        },
      })

      manifest.migrations = {
        missingSchemaMigrationsTable: false,
        pendingRepoMigrations: [],
        unexpectedAppliedMigrations: [],
      }
      manifest.violations = []
      manifest.status = 'pass'

      expect(validateReleaseEvidenceManifest(manifest, 'cafebabe')).toEqual([])
    } finally {
      await rm(artifactDir, { recursive: true, force: true })
      await rm(migrationsDir, { recursive: true, force: true })
    }
  })

  it('fails release evidence validation when New Relic proof is missing or false-green', async () => {
    const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'staging-readiness-artifacts-'))
    const migrationsDir = await mkdtemp(path.join(os.tmpdir(), 'staging-readiness-migrations-'))

    try {
      await writeFile(path.join(migrationsDir, '001_init.sql'), '-- migration\n', 'utf8')

      await Promise.all([
        writeFile(path.join(artifactDir, 'staging-public-integration-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-agent-pipeline-health.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-auth-surface-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-omar-entitlement-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-enterprise-triangulation-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-worker-resilience-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-admin-surface-smoke.log'), 'observer exercised\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-public-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-auth-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-admin-ui-smoke.log'), 'grant revoke complete\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-public-integration-post-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-observability-business-gate.log'), 'Observability business gate passed.\n', 'utf8'),
        writeFile(
          path.join(artifactDir, 'staging-sentry-release-scope.json'),
          `${JSON.stringify({
            schemaVersion: 'staging-sentry-release-scope@v1',
            status: 'pass',
            release: 'readiness-scope-check-123-2',
            checkedAt: '2026-03-17T12:00:00.000Z',
            workflow: {
              runId: '123',
              runAttempt: '2',
            },
          }, null, 2)}\n`,
          'utf8',
        ),
        writeFile(
          path.join(artifactDir, 'staging-newrelic-notifications-evidence.json'),
          `${JSON.stringify({
            verification: {
              passed: false,
              mirrorPoliciesRequired: false,
            },
            workflows: {
              staging: { matchedPolicyNames: [] },
              prod: { matchedPolicyNames: [] },
            },
          }, null, 2)}\n`,
          'utf8',
        ),
        writeFile(
          path.join(artifactDir, 'staging-newrelic-verify-signals.json'),
          `${JSON.stringify({
            results: [
              {
                envName: 'staging',
                awsMode: 'push_only',
                failures: ['logCount'],
                checks: {
                  metricCount: 1,
                  logCount: 0,
                  spanCount: 2,
                  sqsMetricCount: 1,
                  customMetricCount: 0,
                  customMetricFamilies: {
                    core_slo_indices: 0,
                  },
                },
              },
            ],
          }, null, 2)}\n`,
          'utf8',
        ),
      ])

      const manifest = await buildReleaseEvidenceManifest({
        artifactDir,
        migrationsDir,
        env: {
          READINESS_DEPLOY_SHA: 'cafebabe',
          GITHUB_SHA: 'cafebabe',
          GITHUB_RUN_ID: '123',
          GITHUB_RUN_ATTEMPT: '2',
        },
      })

      expect(manifest.status).toBe('fail')
      expect(manifest.violations).toContain(
        'misleading evidence in staging-newrelic-notifications-evidence.json: New Relic notifications evidence did not pass verification',
      )
      expect(manifest.violations).toContain(
        'misleading evidence in staging-newrelic-verify-signals.json: New Relic verify-signals evidence reported missing signal groups',
      )
      expect(manifest.violations).toContain(
        'misleading evidence in staging-newrelic-verify-signals.json: New Relic verify-signals evidence must show non-zero customMetricCount',
      )
    } finally {
      await rm(artifactDir, { recursive: true, force: true })
      await rm(migrationsDir, { recursive: true, force: true })
    }
  })

  it('fails release evidence validation when Sentry release-scope proof is malformed', async () => {
    const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'staging-readiness-artifacts-'))
    const migrationsDir = await mkdtemp(path.join(os.tmpdir(), 'staging-readiness-migrations-'))

    try {
      await writeFile(path.join(migrationsDir, '001_init.sql'), '-- migration\n', 'utf8')

      await Promise.all([
        writeFile(path.join(artifactDir, 'staging-public-integration-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-agent-pipeline-health.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-auth-surface-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-omar-entitlement-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-enterprise-triangulation-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-worker-resilience-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-admin-surface-smoke.log'), 'observer exercised\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-public-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-auth-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-admin-ui-smoke.log'), 'grant revoke complete\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-public-integration-post-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-observability-business-gate.log'), 'Observability business gate passed.\n', 'utf8'),
        writeFile(
          path.join(artifactDir, 'staging-sentry-release-scope.json'),
          `${JSON.stringify({
            schemaVersion: 'staging-sentry-release-scope@v1',
            status: 'fail',
            release: '',
            checkedAt: 'not-a-date',
            workflow: {
              runId: '',
              runAttempt: '',
            },
          }, null, 2)}\n`,
          'utf8',
        ),
        writeFile(
          path.join(artifactDir, 'staging-newrelic-notifications-evidence.json'),
          `${JSON.stringify({
            verification: {
              passed: true,
              mirrorPoliciesRequired: true,
            },
            workflows: {
              staging: { matchedPolicyNames: ['Remit-Scout STAGING CloudWatch Mirror'] },
              prod: { matchedPolicyNames: ['Remit-Scout PROD CloudWatch Mirror'] },
            },
          }, null, 2)}\n`,
          'utf8',
        ),
        writeFile(
          path.join(artifactDir, 'staging-newrelic-verify-signals.json'),
          `${JSON.stringify({
            results: [
              {
                envName: 'staging',
                awsMode: 'push_only',
                failures: [],
                checks: {
                  metricCount: 12,
                  logCount: 8,
                  spanCount: 5,
                  sqsMetricCount: 3,
                  customMetricCount: 7,
                  customMetricFamilies: {
                    core_slo_indices: 4,
                  },
                },
              },
            ],
          }, null, 2)}\n`,
          'utf8',
        ),
      ])

      const manifest = await buildReleaseEvidenceManifest({
        artifactDir,
        migrationsDir,
        env: {
          READINESS_DEPLOY_SHA: 'cafebabe',
          GITHUB_SHA: 'cafebabe',
          GITHUB_RUN_ID: '123',
          GITHUB_RUN_ATTEMPT: '2',
        },
      })

      expect(manifest.status).toBe('fail')
      expect(manifest.violations).toContain(
        'misleading evidence in staging-sentry-release-scope.json: Sentry release scope evidence did not record a passing scope check',
      )
      expect(manifest.violations).toContain(
        'misleading evidence in staging-sentry-release-scope.json: Sentry release scope evidence must record the readiness scope-check release id',
      )
      expect(manifest.violations).toContain(
        'misleading evidence in staging-sentry-release-scope.json: Sentry release scope evidence must record a valid checkedAt timestamp',
      )
    } finally {
      await rm(artifactDir, { recursive: true, force: true })
      await rm(migrationsDir, { recursive: true, force: true })
    }
  })

  it('fails release evidence validation when the observability business gate log does not prove a pass', async () => {
    const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'staging-readiness-artifacts-'))
    const migrationsDir = await mkdtemp(path.join(os.tmpdir(), 'staging-readiness-migrations-'))

    try {
      await writeFile(path.join(migrationsDir, '001_init.sql'), '-- migration\n', 'utf8')

      await Promise.all([
        writeFile(path.join(artifactDir, 'staging-public-integration-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-agent-pipeline-health.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-auth-surface-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-omar-entitlement-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-enterprise-triangulation-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-worker-resilience-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-admin-surface-smoke.log'), 'observer exercised\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-public-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-auth-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-admin-ui-smoke.log'), 'grant revoke complete\n', 'utf8'),
        writeFile(path.join(artifactDir, 'staging-public-integration-post-ui-smoke.log'), 'ok\n', 'utf8'),
        writeFile(
          path.join(artifactDir, 'staging-observability-business-gate.log'),
          'Observability business gate failed: 2 checks failed\n',
          'utf8',
        ),
        writeFile(
          path.join(artifactDir, 'staging-sentry-release-scope.json'),
          `${JSON.stringify({
            schemaVersion: 'staging-sentry-release-scope@v1',
            status: 'pass',
            release: 'readiness-scope-check-123-2',
            checkedAt: '2026-03-17T12:00:00.000Z',
            workflow: {
              runId: '123',
              runAttempt: '2',
            },
          }, null, 2)}\n`,
          'utf8',
        ),
        writeFile(
          path.join(artifactDir, 'staging-newrelic-notifications-evidence.json'),
          `${JSON.stringify({
            verification: {
              passed: true,
              mirrorPoliciesRequired: true,
            },
            workflows: {
              staging: { matchedPolicyNames: ['Remit-Scout STAGING CloudWatch Mirror'] },
              prod: { matchedPolicyNames: ['Remit-Scout PROD CloudWatch Mirror'] },
            },
          }, null, 2)}\n`,
          'utf8',
        ),
        writeFile(
          path.join(artifactDir, 'staging-newrelic-verify-signals.json'),
          `${JSON.stringify({
            results: [
              {
                envName: 'staging',
                awsMode: 'push_only',
                failures: [],
                checks: {
                  metricCount: 12,
                  logCount: 8,
                  spanCount: 5,
                  sqsMetricCount: 3,
                  customMetricCount: 7,
                  customMetricFamilies: {
                    core_slo_indices: 4,
                  },
                },
              },
            ],
          }, null, 2)}\n`,
          'utf8',
        ),
      ])

      const manifest = await buildReleaseEvidenceManifest({
        artifactDir,
        migrationsDir,
        env: {
          READINESS_DEPLOY_SHA: 'cafebabe',
          GITHUB_SHA: 'cafebabe',
          GITHUB_RUN_ID: '123',
          GITHUB_RUN_ATTEMPT: '2',
        },
      })

      expect(manifest.status).toBe('fail')
      expect(manifest.violations).toContain(
        'misleading evidence in staging-observability-business-gate.log: Observability business gate log contains failure marker: Observability business gate failed',
      )
      expect(manifest.violations).toContain(
        'misleading evidence in staging-observability-business-gate.log: Observability business gate log must contain pass marker: Observability business gate passed.',
      )
    } finally {
      await rm(artifactDir, { recursive: true, force: true })
      await rm(migrationsDir, { recursive: true, force: true })
    }
  })
})
