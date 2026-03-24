import { access, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { constants as fsConstants } from 'node:fs'

import { resolveDatabaseUrl as resolveAwsDatabaseUrl } from '../../shared/aws-params'
import { createPool } from '../../shared/db'
import { resolveDbConnectionStringForIpv4 } from '../../shared/db-ipv4'

type Requirement = {
  key: string
  description: string
}

type MigrationSyncEvaluation = {
  missingSchemaMigrationsTable: boolean
  pendingRepoMigrations: string[]
  unexpectedAppliedMigrations: string[]
}

type MigrationSyncOverridePayload = {
  schemaVersion?: string
  status?: 'pass' | 'fail'
  evaluation?: MigrationSyncEvaluation
}

type MisleadingEvidence = {
  file: string
  reason: string
}

type ReleaseEvidenceFilesEvaluation = {
  requiredFiles: string[]
  presentFiles: string[]
  missingFiles: string[]
  misleadingFiles: MisleadingEvidence[]
}

// Historical staging deploys applied these migrations before later insertions
// shifted the canonical numbering in-repo. Treat them as equivalent so the
// release gate detects real schema drift instead of legacy filename churn.
const MIGRATION_ID_ALIASES: Record<string, string> = {
  '104_rights_matrix_audit_tracking.sql': '108_rights_matrix_audit_tracking.sql',
  '105_launch_user_roles.sql': '109_launch_user_roles.sql',
}

export type ReleaseEvidenceManifest = {
  schemaVersion: 'staging-go-live-release-evidence@v1'
  status: 'pass' | 'fail'
  generatedAt: string
  git: {
    requestedDeploySha: string
    actualHeadSha: string
  }
  workflow: {
    runId: string
    runAttempt: string
  }
  migrations: MigrationSyncEvaluation
  artifacts: ReleaseEvidenceFilesEvaluation
  violations: string[]
}

export type StagingReadinessEvaluation = {
  missingRequired: string[]
  missingRecommended: string[]
  placeholderViolations: string[]
  policyViolations: string[]
}

const DEFAULT_MIGRATIONS_DIR = path.resolve(__dirname, '../../db/migrations')
const RELEASE_EVIDENCE_SCHEMA_VERSION = 'staging-go-live-release-evidence@v1' as const
const DEFAULT_REQUIRED_EVIDENCE_FILES = [
  'staging-public-integration-smoke.log',
  'staging-agent-pipeline-health.log',
  'staging-auth-surface-smoke.log',
  'staging-omar-entitlement-smoke.log',
  'staging-enterprise-triangulation-smoke.log',
  'staging-worker-resilience-smoke.log',
  'staging-admin-surface-smoke.log',
  'staging-public-ui-smoke.log',
  'staging-auth-ui-smoke.log',
  'staging-admin-ui-smoke.log',
  'staging-public-integration-post-ui-smoke.log',
  'staging-observability-business-gate.log',
  'staging-sentry-release-scope.json',
  'staging-newrelic-notifications-evidence.json',
  'staging-newrelic-verify-signals.json',
] as const
const SENTRY_RELEASE_SCOPE_SCHEMA_VERSION = 'staging-sentry-release-scope@v1' as const
const NEW_RELIC_STAGING_MIRROR_POLICY = 'Remit-Scout STAGING CloudWatch Mirror'
const NEW_RELIC_PROD_MIRROR_POLICY = 'Remit-Scout PROD CloudWatch Mirror'
const OBSERVABILITY_BUSINESS_GATE_PASS_MARKER = 'Observability business gate passed.'
const OBSERVABILITY_BUSINESS_GATE_FAILURE_MARKERS = [
  'Observability business gate failed',
  'Observability business gate crashed',
]
const MISLEADING_EVIDENCE_RULES: Array<{ file: string; pattern: RegExp; reason: string }> = [
  {
    file: 'staging-admin-surface-smoke.log',
    pattern: /skipped=requires_verified_admin_session/,
    reason: 'admin surface smoke fell back instead of proving verified admin-session coverage',
  },
  {
    file: 'staging-admin-ui-smoke.log',
    pattern: /Skipping privileged admin UI checks/,
    reason: 'admin UI smoke skipped privileged observer or reversible grant/revoke coverage',
  },
]

const REQUIRED_KEYS: Requirement[] = [
  { key: 'ENVIRONMENT', description: 'Runtime environment selector' },
  { key: 'NODE_ENV', description: 'Node runtime mode' },
  { key: 'AWS_REGION', description: 'AWS region for staging deployment role' },
  { key: 'AWS_ROLE_TO_ASSUME', description: 'GitHub OIDC role ARN for staging deploy/evidence' },
  { key: 'STACK_NAME', description: 'CloudFormation/CDK stack name' },
  { key: 'SHARED_SECRET_ARN', description: 'Secrets Manager ARN shared secret reference' },
  { key: 'SES_IDENTITY_ARNS', description: 'SES identity ARNs for notification sender identities' },
  { key: 'SNS_TOPIC_ARNS', description: 'SNS topic ARNs for alarm fanout' },
  { key: 'DATABASE_URL_PLANE_B', description: 'Primary runtime DB URL (Plane B)' },
  { key: 'REDIS_URL', description: 'Redis URL for cache/session/queues' },
  { key: 'BRONZE_S3_BUCKET', description: 'Bronze raw-data bucket' }, // gitleaks:allow -- env var name checklist, not a secret
  { key: 'EXPORTS_S3_BUCKET', description: 'Exports artifact bucket' },
  { key: 'PUBLIC_SITE_URL', description: 'Staging frontend base URL' },
  { key: 'PUBLIC_API_BASE', description: 'Staging public API base URL' },
  { key: 'PUBLIC_SUPABASE_URL', description: 'Frontend Supabase URL' },
  { key: 'PUBLIC_SUPABASE_ANON_KEY', description: 'Frontend Supabase anon key' },
  { key: 'SUPABASE_URL', description: 'Backend Supabase URL' },
  { key: 'SUPABASE_PUBLISHABLE_KEY', description: 'Backend Supabase publishable key' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Backend Supabase service role key' },
  { key: 'STRIPE_SECRET_KEY', description: 'Stripe API secret key (test mode in staging)' },
  { key: 'STRIPE_WEBHOOK_SECRET', description: 'Stripe webhook signing secret' },
  { key: 'STRIPE_PRICE_ID_PLUS', description: 'Stripe monthly price id' },
  { key: 'STRIPE_PRICE_ID_PLUS_ANNUAL', description: 'Stripe annual price id' },
  { key: 'PUBLIC_GA4_MEASUREMENT_ID', description: 'GA4 measurement id' },
  { key: 'PUBLIC_GOOGLE_ADS_CONVERSION_ID', description: 'Google Ads conversion id' },
  { key: 'NEW_RELIC_USER_API_KEY', description: 'New Relic user API key for dashboard/alert/verify gates' },
  { key: 'NEW_RELIC_ACCOUNT_ID', description: 'New Relic account ID' },
  { key: 'NEW_RELIC_REGION', description: 'New Relic region (US/EU)' },
  { key: 'NEW_RELIC_INGEST_KEY', description: 'New Relic ingest key for logs/spans' },
  { key: 'NEW_RELIC_STAGING_AWS_MODE', description: 'Required staging AWS cloud-link mode (push_only)' },
  { key: 'NEW_RELIC_PROD_AWS_MODE', description: 'Required prod AWS cloud-link mode (otlp_only)' },
  { key: 'NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES', description: 'Explicit staging New Relic AWS metric namespace allowlist' },
  { key: 'NEW_RELIC_STAGING_AWS_ACCOUNT_ID', description: 'Staging AWS account ID pinned for verify-signals' },
  { key: 'NEW_RELIC_PROD_AWS_ACCOUNT_ID', description: 'Prod AWS account ID pinned for verify-signals parity' },
  { key: 'NEW_RELIC_STAGING_AWS_ROLE_ARN', description: 'Staging AWS role ARN for New Relic cloud-link sync' },
  { key: 'NEW_RELIC_PROD_AWS_ROLE_ARN', description: 'Prod AWS role ARN for New Relic cloud-link sync' },
  { key: 'SLACK_BOT_TOKEN', description: 'Slack bot token for frontdesk + brain posts' },
  { key: 'SLACK_APP_TOKEN', description: 'Slack app token for Socket Mode' },
  { key: 'SLACK_SIGNING_SECRET', description: 'Slack signing secret for action verification' },
  { key: 'SLACK_CASES_CHANNEL_ID', description: 'Ops channel id for case cards' },
  { key: 'ALERT_SLACK_WEBHOOK_URL', description: 'Alert webhook fallback channel' },
  { key: 'SENTRY_AUTH_TOKEN', description: 'Sentry integration token (MCP/evidence)' },
  { key: 'SENTRY_ORG', description: 'Sentry organization slug' },
  { key: 'SENTRY_PROJECT', description: 'Sentry project slug' },
]

const RECOMMENDED_KEYS: Requirement[] = [
  { key: 'BRAIN_DISPATCH_GITHUB_ACTIONS', description: 'Brain dispatch gate (set to 1 for staging trial)' },
  { key: 'BRAIN_INGEST_GITHUB_ACTIONS', description: 'Brain ingestion gate (set to 1 for closed-loop run ingestion)' },
  { key: 'BRAIN_SLACK_POST_CASE_CARDS', description: 'Brain Slack posting gate' },
  { key: 'PUBLIC_ENABLE_ADS', description: 'Ad network flag (set to 1 when ad provider is onboarded)' },
  { key: 'TRIANGULATION_ENABLED', description: 'Corridor composite triangulation gate' },
  { key: 'EMIT_OBSERVATIONS', description: 'Observation dual-write gate for triangulation readiness' },
  { key: 'PLANE_A_DOMAIN_NAME', description: 'Plane A staging custom-domain host (optional until staging API edge is provisioned)' },
  { key: 'PLANE_A_CERT_ARN', description: 'Plane A staging ACM certificate ARN (optional until staging API edge is provisioned)' },
]

const PLACEHOLDER_PATTERNS = [/change-me/i, /placeholder/i, /example/i, /your[-_]/i]
const AD_PLACEMENT_ID_KEYS = [
  'PUBLIC_AD_COMPARE_INLINE_IDS',
  'PUBLIC_AD_COMPARE_SIDEBAR_IDS',
  'PUBLIC_AD_HOME_INLINE_IDS',
  'PUBLIC_AD_DASHBOARD_INLINE_IDS',
  'PUBLIC_AD_CORRIDOR_INTERSTITIAL_IDS',
  'PUBLIC_AD_CORRIDOR_BELOW_FAQ_IDS',
  'PUBLIC_AD_CORRIDOR_FOOTER_IDS',
  'PUBLIC_AD_BLOG_SIDEBAR_IDS',
  'PUBLIC_AD_BLOG_INLINE_IDS',
  'PUBLIC_AD_BLOG_BANNER_IDS',
] as const
const VALID_SOC2_REPORT_STATES = new Set(['in_progress', 'audited', 'expired', 'revoked'])
const NEW_RELIC_GATE_KEYS = new Set([
  'NEW_RELIC_USER_API_KEY',
  'NEW_RELIC_STAGING_AWS_ROLE_ARN',
  'NEW_RELIC_PROD_AWS_ROLE_ARN',
])
const FALSE_VALUES = new Set(['0', 'false', 'off', 'no'])
const DEFAULT_ENV_VALUES: Record<string, string> = {
  NEW_RELIC_STAGING_AWS_MODE: 'push_only',
  NEW_RELIC_PROD_AWS_MODE: 'otlp_only',
  NEW_RELIC_LOGS_ENABLED: '1',
}

const readEnvValue = (env: NodeJS.ProcessEnv, key: string) => {
  const value = String(env[key] || '').trim()
  if (value) return value
  return DEFAULT_ENV_VALUES[key] || ''
}

const isMissing = (value: string) => value.length === 0

export const normalizeNewRelicAwsMode = (value: string) => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return ''
  if (['push_pull', 'push+pull', 'all'].includes(normalized)) return 'push_pull'
  if (['push_only', 'push'].includes(normalized)) return 'push_only'
  if (['otlp_only', 'otlp', 'none', 'disabled'].includes(normalized)) return 'otlp_only'
  return ''
}

const looksLikeSlackWebhookPlaceholder = (value: string) =>
  /hooks\.slack\.com\/services\/T0{8,}\/B0{8,}\/A{10,}/i.test(value)

const looksLikePlaceholder = (value: string) =>
  PLACEHOLDER_PATTERNS.some(pattern => pattern.test(value)) || looksLikeSlackWebhookPlaceholder(value)

export const hasStagingMarker = (value: string) => /staging/i.test(value)

const isCloudFrontHost = (value: string) => value.toLowerCase().endsWith('.cloudfront.net')

const isValidDateValue = (value: string) => {
  if (!value) return false
  const parsed = Date.parse(value)
  return !Number.isNaN(parsed)
}

const splitCsv = (value: string) =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

export const toOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin.toLowerCase()
  } catch {
    return null
  }
}

const toHttpsUrl = (value: string): URL | null => {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') {
      return null
    }
    return url
  } catch {
    return null
  }
}

const printGroup = (title: string, lines: string[]) => {
  if (!lines.length) return
  console.log(`\n${title}`)
  for (const line of lines) console.log(`- ${line}`)
}

const resolveDatabaseUrl = (env: NodeJS.ProcessEnv): string =>
  readEnvValue(env, 'DATABASE_URL_PLANE_B_MIGRATOR')
  || readEnvValue(env, 'DATABASE_URL_PLANE_B')
  || readEnvValue(env, 'DATABASE_URL')

const resolveReadinessDatabaseUrls = async (env: NodeJS.ProcessEnv = process.env) => {
  if (env !== process.env) {
    return
  }

  await resolveAwsDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_B_MIGRATOR',
    secretArnEnv: 'PLANE_B_DB_MIGRATOR_SECRET_ARN',
    ssmNameEnv: 'PLANE_B_DB_MIGRATOR_SSM_NAME',
    hostEnv: 'PLANE_B_DB_MIGRATOR_HOST',
    portEnv: 'PLANE_B_DB_MIGRATOR_PORT',
    nameEnv: 'PLANE_B_DB_MIGRATOR_NAME',
    usernameEnv: 'PLANE_B_DB_MIGRATOR_USERNAME',
    passwordEnv: 'PLANE_B_DB_MIGRATOR_PASSWORD',
    requireJson: true,
    required: false,
    sslModeEnv: 'PGSSLMODE',
    jsonKeys: ['url', 'DATABASE_URL_PLANE_B_MIGRATOR', 'database_url'],
  })

  await resolveAwsDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_B',
    secretArnEnv: 'PLANE_B_DB_SECRET_ARN',
    ssmNameEnv: 'PLANE_B_DB_SSM_NAME',
    hostEnv: 'PLANE_B_DB_HOST',
    portEnv: 'PLANE_B_DB_PORT',
    nameEnv: 'PLANE_B_DB_NAME',
    usernameEnv: 'PLANE_B_DB_USERNAME',
    passwordEnv: 'PLANE_B_DB_PASSWORD',
    requireJson: true,
    required: false,
    sslModeEnv: 'PGSSLMODE',
    jsonKeys: ['url', 'DATABASE_URL_PLANE_B', 'database_url'],
  })
}

const resolveCliOption = (args: string[], flag: string): string | undefined => {
  const index = args.indexOf(flag)
  if (index === -1 || index === args.length - 1) return undefined
  return args[index + 1]
}

const hasCliFlag = (args: string[], flag: string): boolean => args.includes(flag)

const pathExists = async (targetPath: string) => {
  try {
    await access(targetPath, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

const safeJsonParse = (value: string): unknown | null => {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

const isMigrationSyncEvaluation = (value: unknown): value is MigrationSyncEvaluation => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.missingSchemaMigrationsTable === 'boolean'
    && Array.isArray(candidate.pendingRepoMigrations)
    && candidate.pendingRepoMigrations.every(item => typeof item === 'string')
    && Array.isArray(candidate.unexpectedAppliedMigrations)
    && candidate.unexpectedAppliedMigrations.every(item => typeof item === 'string')
  )
}

const hasExactStringArray = (value: unknown, expected: readonly string[]) => {
  if (!Array.isArray(value) || value.length !== expected.length) return false
  return value.every((item, index) => item === expected[index])
}

const isPositiveNumber = (value: unknown): boolean =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

const listRepoMigrationFiles = async (migrationsDir = DEFAULT_MIGRATIONS_DIR): Promise<string[]> => {
  const files = await readdir(migrationsDir)
  return files
    .filter(file => file.endsWith('.sql') && file !== 'TEMPLATE.sql' && file !== 'TEMPLATE.sql.example')
    .sort()
}

const loadMigrationSyncOverride = async (
  env: NodeJS.ProcessEnv = process.env,
): Promise<MigrationSyncEvaluation | null> => {
  const overridePath = readEnvValue(env, 'STAGING_MIGRATION_SYNC_RESULT_PATH')
  if (!overridePath) {
    return null
  }

  const raw = await readFile(overridePath, 'utf8')
  const parsed = safeJsonParse(raw)
  if (isMigrationSyncEvaluation(parsed)) {
    return parsed
  }
  if (
    parsed
    && typeof parsed === 'object'
    && isMigrationSyncEvaluation((parsed as MigrationSyncOverridePayload).evaluation)
  ) {
    return (parsed as MigrationSyncOverridePayload).evaluation as MigrationSyncEvaluation
  }
  throw new Error(`Migration sync override at ${overridePath} is not valid JSON evidence`)
}

export const evaluateMigrationSync = ({
  repoMigrations,
  appliedMigrations,
}: {
  repoMigrations: string[]
  appliedMigrations: string[]
}): MigrationSyncEvaluation => {
  const canonicalizeMigrationId = (file: string) => MIGRATION_ID_ALIASES[file] || file
  const repoSet = new Set(repoMigrations.map(canonicalizeMigrationId))
  const appliedSet = new Set(appliedMigrations.map(canonicalizeMigrationId))

  return {
    missingSchemaMigrationsTable: false,
    pendingRepoMigrations: repoMigrations.filter(file => !appliedSet.has(canonicalizeMigrationId(file))),
    unexpectedAppliedMigrations: appliedMigrations
      .filter(file => !repoSet.has(canonicalizeMigrationId(file)))
      .sort(),
  }
}

export const readMigrationSync = async (
  databaseUrl: string,
  migrationsDir = DEFAULT_MIGRATIONS_DIR,
): Promise<MigrationSyncEvaluation> => {
  const repoMigrations = await listRepoMigrationFiles(migrationsDir)
  const resolvedDatabaseUrl = await resolveDbConnectionStringForIpv4(databaseUrl)
  const pool = createPool(resolvedDatabaseUrl)

  try {
    const existsResult = await pool.query<{ relation: string | null }>(
      "SELECT to_regclass('public.schema_migrations') AS relation",
    )
    if (!existsResult.rows[0]?.relation) {
      return {
        missingSchemaMigrationsTable: true,
        pendingRepoMigrations: repoMigrations,
        unexpectedAppliedMigrations: [],
      }
    }

    const appliedResult = await pool.query<{ id: string }>(
      'SELECT id FROM public.schema_migrations ORDER BY id ASC',
    )
    return evaluateMigrationSync({
      repoMigrations,
      appliedMigrations: appliedResult.rows.map(row => row.id),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/tenant or user not found/i.test(message)) {
      throw new Error(
        'Migration sync could not connect with the current Plane B database credentials. ' +
        'Provide DATABASE_URL_PLANE_B_MIGRATOR, PLANE_B_DB_MIGRATOR_SECRET_ARN, ' +
        'PLANE_B_DB_MIGRATOR_SSM_NAME, PLANE_B_DB_SECRET_ARN, or PLANE_B_DB_SSM_NAME for hosted readiness.',
      )
    }
    throw error
  } finally {
    await pool.end()
  }
}

export const evaluateReleaseEvidenceFiles = (
  files: Record<string, string>,
  requiredFiles: readonly string[] = DEFAULT_REQUIRED_EVIDENCE_FILES,
): ReleaseEvidenceFilesEvaluation => {
  const presentFiles = Object.keys(files).sort()
  const missingFiles = requiredFiles.filter(file => !(file in files))
  const misleadingFiles = MISLEADING_EVIDENCE_RULES.flatMap(rule => {
    const content = files[rule.file]
    if (!content || !rule.pattern.test(content)) return []
    return [{ file: rule.file, reason: rule.reason }]
  })

  const notificationsEvidenceRaw = files['staging-newrelic-notifications-evidence.json']
  if (notificationsEvidenceRaw) {
    const parsed = safeJsonParse(notificationsEvidenceRaw) as {
      verification?: { passed?: unknown; mirrorPoliciesRequired?: unknown }
      workflows?: {
        staging?: { matchedPolicyNames?: unknown }
        prod?: { matchedPolicyNames?: unknown }
      }
    } | null
    if (!parsed) {
      misleadingFiles.push({
        file: 'staging-newrelic-notifications-evidence.json',
        reason: 'New Relic notifications evidence is not valid JSON',
      })
    } else {
      if (parsed.verification?.passed !== true) {
        misleadingFiles.push({
          file: 'staging-newrelic-notifications-evidence.json',
          reason: 'New Relic notifications evidence did not pass verification',
        })
      }
      if (parsed.verification?.mirrorPoliciesRequired !== true) {
        misleadingFiles.push({
          file: 'staging-newrelic-notifications-evidence.json',
          reason: 'New Relic notifications evidence did not require mirrored CloudWatch policies',
        })
      }
      if (
        !hasExactStringArray(
          parsed.workflows?.staging?.matchedPolicyNames,
          [NEW_RELIC_STAGING_MIRROR_POLICY],
        )
      ) {
        misleadingFiles.push({
          file: 'staging-newrelic-notifications-evidence.json',
          reason: `New Relic staging workflow evidence must match only ${NEW_RELIC_STAGING_MIRROR_POLICY}`,
        })
      }
      if (
        !hasExactStringArray(
          parsed.workflows?.prod?.matchedPolicyNames,
          [NEW_RELIC_PROD_MIRROR_POLICY],
        )
      ) {
        misleadingFiles.push({
          file: 'staging-newrelic-notifications-evidence.json',
          reason: `New Relic prod workflow evidence must match only ${NEW_RELIC_PROD_MIRROR_POLICY}`,
        })
      }
    }
  }

  const sentryReleaseScopeEvidenceRaw = files['staging-sentry-release-scope.json']
  if (sentryReleaseScopeEvidenceRaw) {
    const parsed = safeJsonParse(sentryReleaseScopeEvidenceRaw) as {
      schemaVersion?: unknown
      status?: unknown
      release?: unknown
      checkedAt?: unknown
      workflow?: {
        runId?: unknown
        runAttempt?: unknown
      }
    } | null
    if (!parsed) {
      misleadingFiles.push({
        file: 'staging-sentry-release-scope.json',
        reason: 'Sentry release scope evidence is not valid JSON',
      })
    } else {
      if (parsed.schemaVersion !== SENTRY_RELEASE_SCOPE_SCHEMA_VERSION) {
        misleadingFiles.push({
          file: 'staging-sentry-release-scope.json',
          reason: `Sentry release scope evidence must use schema ${SENTRY_RELEASE_SCOPE_SCHEMA_VERSION}`,
        })
      }
      if (parsed.status !== 'pass') {
        misleadingFiles.push({
          file: 'staging-sentry-release-scope.json',
          reason: 'Sentry release scope evidence did not record a passing scope check',
        })
      }
      if (typeof parsed.release !== 'string' || !parsed.release.startsWith('readiness-scope-check-')) {
        misleadingFiles.push({
          file: 'staging-sentry-release-scope.json',
          reason: 'Sentry release scope evidence must record the readiness scope-check release id',
        })
      }
      if (typeof parsed.checkedAt !== 'string' || !isValidDateValue(parsed.checkedAt)) {
        misleadingFiles.push({
          file: 'staging-sentry-release-scope.json',
          reason: 'Sentry release scope evidence must record a valid checkedAt timestamp',
        })
      }
      if (typeof parsed.workflow?.runId !== 'string' || parsed.workflow.runId.trim().length === 0) {
        misleadingFiles.push({
          file: 'staging-sentry-release-scope.json',
          reason: 'Sentry release scope evidence must record the workflow run id',
        })
      }
      if (typeof parsed.workflow?.runAttempt !== 'string' || parsed.workflow.runAttempt.trim().length === 0) {
        misleadingFiles.push({
          file: 'staging-sentry-release-scope.json',
          reason: 'Sentry release scope evidence must record the workflow run attempt',
        })
      }
    }
  }

  const observabilityBusinessGateLog = files['staging-observability-business-gate.log']
  if (observabilityBusinessGateLog) {
    for (const marker of OBSERVABILITY_BUSINESS_GATE_FAILURE_MARKERS) {
      if (observabilityBusinessGateLog.includes(marker)) {
        misleadingFiles.push({
          file: 'staging-observability-business-gate.log',
          reason: `Observability business gate log contains failure marker: ${marker}`,
        })
      }
    }
    if (!observabilityBusinessGateLog.includes(OBSERVABILITY_BUSINESS_GATE_PASS_MARKER)) {
      misleadingFiles.push({
        file: 'staging-observability-business-gate.log',
        reason: `Observability business gate log must contain pass marker: ${OBSERVABILITY_BUSINESS_GATE_PASS_MARKER}`,
      })
    }
  }

  const verifySignalsEvidenceRaw = files['staging-newrelic-verify-signals.json']
  if (verifySignalsEvidenceRaw) {
    const parsed = safeJsonParse(verifySignalsEvidenceRaw) as {
      results?: Array<{
        envName?: unknown
        awsMode?: unknown
        failures?: unknown
        checks?: {
          metricCount?: unknown
          logCount?: unknown
          spanCount?: unknown
          sqsMetricCount?: unknown
          customMetricCount?: unknown
          customMetricFamilies?: { core_slo_indices?: unknown }
        }
      }>
    } | null
    const result = parsed?.results?.[0]
    const failures = Array.isArray(result?.failures) ? result?.failures : null
    if (!parsed) {
      misleadingFiles.push({
        file: 'staging-newrelic-verify-signals.json',
        reason: 'New Relic verify-signals evidence is not valid JSON',
      })
    } else if (!Array.isArray(parsed.results) || parsed.results.length !== 1) {
      misleadingFiles.push({
        file: 'staging-newrelic-verify-signals.json',
        reason: 'New Relic verify-signals evidence must contain exactly one staging result',
      })
    } else {
      if (result?.envName !== 'staging') {
        misleadingFiles.push({
          file: 'staging-newrelic-verify-signals.json',
          reason: 'New Relic verify-signals evidence must target staging',
        })
      }
      if (result?.awsMode !== 'push_only') {
        misleadingFiles.push({
          file: 'staging-newrelic-verify-signals.json',
          reason: 'New Relic verify-signals evidence must record staging awsMode=push_only',
        })
      }
      if (!failures || failures.length > 0) {
        misleadingFiles.push({
          file: 'staging-newrelic-verify-signals.json',
          reason: 'New Relic verify-signals evidence reported missing signal groups',
        })
      }
      if (!isPositiveNumber(result?.checks?.metricCount)) {
        misleadingFiles.push({
          file: 'staging-newrelic-verify-signals.json',
          reason: 'New Relic verify-signals evidence must show non-zero metricCount',
        })
      }
      if (!isPositiveNumber(result?.checks?.logCount)) {
        misleadingFiles.push({
          file: 'staging-newrelic-verify-signals.json',
          reason: 'New Relic verify-signals evidence must show non-zero logCount',
        })
      }
      if (!isPositiveNumber(result?.checks?.spanCount)) {
        misleadingFiles.push({
          file: 'staging-newrelic-verify-signals.json',
          reason: 'New Relic verify-signals evidence must show non-zero spanCount',
        })
      }
      if (!isPositiveNumber(result?.checks?.sqsMetricCount)) {
        misleadingFiles.push({
          file: 'staging-newrelic-verify-signals.json',
          reason: 'New Relic verify-signals evidence must show non-zero sqsMetricCount for staging push_only mode',
        })
      }
      if (!isPositiveNumber(result?.checks?.customMetricCount)) {
        misleadingFiles.push({
          file: 'staging-newrelic-verify-signals.json',
          reason: 'New Relic verify-signals evidence must show non-zero customMetricCount',
        })
      }
      if (!isPositiveNumber(result?.checks?.customMetricFamilies?.core_slo_indices)) {
        misleadingFiles.push({
          file: 'staging-newrelic-verify-signals.json',
          reason: 'New Relic verify-signals evidence must show core_slo_indices delivery',
        })
      }
    }
  }

  return {
    requiredFiles: [...requiredFiles],
    presentFiles,
    missingFiles,
    misleadingFiles,
  }
}

const loadReleaseEvidenceFiles = async (
  artifactDir: string,
  requiredFiles: readonly string[] = DEFAULT_REQUIRED_EVIDENCE_FILES,
): Promise<Record<string, string>> => {
  const result: Record<string, string> = {}
  for (const file of requiredFiles) {
    const target = path.join(artifactDir, file)
    if (!(await pathExists(target))) continue
    result[file] = await readFile(target, 'utf8')
  }
  return result
}

const collectReleaseEvidenceViolations = (
  manifest: Pick<ReleaseEvidenceManifest, 'git' | 'migrations' | 'artifacts'>,
): string[] => {
  const violations: string[] = []
  const requestedDeploySha = manifest.git.requestedDeploySha.trim()
  const actualHeadSha = manifest.git.actualHeadSha.trim()

  if (!requestedDeploySha) {
    violations.push('requested deploy SHA is missing; readiness evidence must be tied to an exact commit')
  }
  if (!actualHeadSha) {
    violations.push('actual checked-out HEAD SHA is missing from readiness evidence')
  }
  if (requestedDeploySha && actualHeadSha && requestedDeploySha !== actualHeadSha) {
    violations.push(
      `requested deploy SHA ${requestedDeploySha} does not match checked-out HEAD SHA ${actualHeadSha}`,
    )
  }
  if (manifest.migrations.missingSchemaMigrationsTable) {
    violations.push('public.schema_migrations is missing in the target database')
  }
  if (manifest.migrations.pendingRepoMigrations.length > 0) {
    violations.push(
      `pending repo migrations detected: ${manifest.migrations.pendingRepoMigrations.join(', ')}`,
    )
  }
  if (manifest.migrations.unexpectedAppliedMigrations.length > 0) {
    violations.push(
      `database contains applied migrations not present in this repo checkout: ${manifest.migrations.unexpectedAppliedMigrations.join(', ')}`,
    )
  }
  if (manifest.artifacts.missingFiles.length > 0) {
    violations.push(`missing release evidence files: ${manifest.artifacts.missingFiles.join(', ')}`)
  }
  for (const item of manifest.artifacts.misleadingFiles) {
    violations.push(`misleading evidence in ${item.file}: ${item.reason}`)
  }
  return violations
}

export const buildReleaseEvidenceManifest = async ({
  artifactDir,
  env = process.env,
  migrationsDir = DEFAULT_MIGRATIONS_DIR,
}: {
  artifactDir: string
  env?: NodeJS.ProcessEnv
  migrationsDir?: string
}): Promise<ReleaseEvidenceManifest> => {
  const override = await loadMigrationSyncOverride(env)
  const migrations = override
    ? override
    : await (async () => {
        await resolveReadinessDatabaseUrls(env)
        const databaseUrl = resolveDatabaseUrl(env)
        return databaseUrl
          ? readMigrationSync(databaseUrl, migrationsDir)
          : {
              missingSchemaMigrationsTable: true,
              pendingRepoMigrations: await listRepoMigrationFiles(migrationsDir),
              unexpectedAppliedMigrations: [],
            }
      })()
  const artifacts = evaluateReleaseEvidenceFiles(await loadReleaseEvidenceFiles(artifactDir))
  const manifestBase = {
    git: {
      requestedDeploySha: readEnvValue(env, 'READINESS_DEPLOY_SHA'),
      actualHeadSha: readEnvValue(env, 'GITHUB_SHA'),
    },
    migrations,
    artifacts,
  }
  const violations = collectReleaseEvidenceViolations(manifestBase)

  return {
    schemaVersion: RELEASE_EVIDENCE_SCHEMA_VERSION,
    status: violations.length === 0 ? 'pass' : 'fail',
    generatedAt: new Date().toISOString(),
    git: manifestBase.git,
    workflow: {
      runId: readEnvValue(env, 'GITHUB_RUN_ID'),
      runAttempt: readEnvValue(env, 'GITHUB_RUN_ATTEMPT'),
    },
    migrations,
    artifacts,
    violations,
  }
}

export const validateReleaseEvidenceManifest = (
  manifest: ReleaseEvidenceManifest,
  expectedSha?: string,
): string[] => {
  const violations: string[] = collectReleaseEvidenceViolations(manifest)

  if (manifest.schemaVersion !== RELEASE_EVIDENCE_SCHEMA_VERSION) {
    violations.push(
      `unsupported release-evidence schema version ${manifest.schemaVersion}; expected ${RELEASE_EVIDENCE_SCHEMA_VERSION}`,
    )
  }
  if (manifest.status !== 'pass') {
    violations.push(`release evidence manifest status is ${manifest.status}`)
  }
  if (manifest.violations.length > 0) {
    violations.push(...manifest.violations)
  }
  if (expectedSha) {
    const normalizedExpected = expectedSha.trim()
    if (manifest.git.requestedDeploySha !== normalizedExpected) {
      violations.push(
        `release evidence requested SHA ${manifest.git.requestedDeploySha || '<empty>'} does not match expected SHA ${normalizedExpected}`,
      )
    }
    if (manifest.git.actualHeadSha !== normalizedExpected) {
      violations.push(
        `release evidence actual HEAD SHA ${manifest.git.actualHeadSha || '<empty>'} does not match expected SHA ${normalizedExpected}`,
      )
    }
  }

  return [...new Set(violations)]
}

export const evaluateStagingGoLiveReadiness = (
  env: NodeJS.ProcessEnv = process.env,
): StagingReadinessEvaluation => {
  const missingRequired: string[] = []
  const missingRecommended: string[] = []
  const placeholderViolations: string[] = []
  const policyViolations: string[] = []

  const requireNewRelicGates = !FALSE_VALUES.has(readEnvValue(env, 'REQUIRE_NEW_RELIC_GATES').toLowerCase())
  const stagingNewRelicAwsMode = normalizeNewRelicAwsMode(readEnvValue(env, 'NEW_RELIC_STAGING_AWS_MODE'))
  const prodNewRelicAwsMode = normalizeNewRelicAwsMode(readEnvValue(env, 'NEW_RELIC_PROD_AWS_MODE'))
  const metricStreamEnabled = readEnvValue(env, 'NEW_RELIC_AWS_METRIC_STREAM_ENABLED').toLowerCase()
  const shouldSoftenNewRelicRequirement = (key: string) => {
    if (key === 'NEW_RELIC_USER_API_KEY') {
      return !requireNewRelicGates
    }
    if (key === 'NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES') {
      return FALSE_VALUES.has(metricStreamEnabled)
    }
    if (key === 'NEW_RELIC_STAGING_AWS_ACCOUNT_ID' || key === 'NEW_RELIC_STAGING_AWS_ROLE_ARN') {
      return !requireNewRelicGates || stagingNewRelicAwsMode === 'otlp_only'
    }
    if (key === 'NEW_RELIC_PROD_AWS_ACCOUNT_ID' || key === 'NEW_RELIC_PROD_AWS_ROLE_ARN') {
      return prodNewRelicAwsMode === 'otlp_only' || (!requireNewRelicGates && NEW_RELIC_GATE_KEYS.has(key))
    }
    return !requireNewRelicGates && NEW_RELIC_GATE_KEYS.has(key)
  }

  for (const requirement of REQUIRED_KEYS) {
    const value = readEnvValue(env, requirement.key)
    if (isMissing(value)) {
      if (shouldSoftenNewRelicRequirement(requirement.key)) {
        missingRecommended.push(
          `${requirement.key}: ${requirement.description} (non-blocking in current New Relic mode)`,
        )
        continue
      }
      missingRequired.push(`${requirement.key}: ${requirement.description}`)
      continue
    }
    if (looksLikePlaceholder(value)) {
      if (shouldSoftenNewRelicRequirement(requirement.key)) {
        missingRecommended.push(
          `${requirement.key}: looks like placeholder value (non-blocking in current New Relic mode)`,
        )
        continue
      }
      placeholderViolations.push(`${requirement.key}: looks like placeholder value`)
    }
  }

  for (const requirement of RECOMMENDED_KEYS) {
    const value = readEnvValue(env, requirement.key)
    if (isMissing(value)) {
      missingRecommended.push(`${requirement.key}: ${requirement.description}`)
      continue
    }
    if (looksLikePlaceholder(value)) {
      placeholderViolations.push(`${requirement.key}: looks like placeholder value`)
    }
  }

  const environment = readEnvValue(env, 'ENVIRONMENT').toLowerCase()
  const nodeEnv = readEnvValue(env, 'NODE_ENV').toLowerCase()
  const triangulationEnabled = ['1', 'true', 'yes', 'on'].includes(
    readEnvValue(env, 'TRIANGULATION_ENABLED').toLowerCase(),
  )
  const soc2ReportState = (
    readEnvValue(env, 'COMPLIANCE_SOC2_TYPE_II_REPORT_STATE')
    || readEnvValue(env, 'COMPLIANCE_SOC2_TYPE_II_STATUS')
  ).toLowerCase()
  const soc2ReportDate = readEnvValue(env, 'COMPLIANCE_SOC2_TYPE_II_REPORT_DATE')
  const soc2ReportExpiresOn = readEnvValue(env, 'COMPLIANCE_SOC2_TYPE_II_EXPIRES_ON')

  if (environment !== 'staging') {
    policyViolations.push(`ENVIRONMENT must be "staging" (received "${environment || '<empty>'}")`)
  }
  if (nodeEnv !== 'staging') {
    policyViolations.push(`NODE_ENV must be "staging" (received "${nodeEnv || '<empty>'}")`)
  }
  if (!requireNewRelicGates) {
    policyViolations.push('REQUIRE_NEW_RELIC_GATES must stay enabled for staging readiness evidence')
  }

  const stackName = readEnvValue(env, 'STACK_NAME')
  if (stackName && !hasStagingMarker(stackName)) {
    policyViolations.push('STACK_NAME must include "staging" to keep env isolation explicit')
  }

  const publicSiteUrl = readEnvValue(env, 'PUBLIC_SITE_URL')
  if (publicSiteUrl && !hasStagingMarker(publicSiteUrl)) {
    policyViolations.push('PUBLIC_SITE_URL must contain a staging hostname')
  }
  if (publicSiteUrl && !toHttpsUrl(publicSiteUrl)) {
    policyViolations.push('PUBLIC_SITE_URL must be an absolute https URL')
  }

  const publicApiBase = readEnvValue(env, 'PUBLIC_API_BASE')
  const publicApiUrl = publicApiBase ? toHttpsUrl(publicApiBase) : null
  if (publicApiBase && !publicApiUrl) {
    policyViolations.push('PUBLIC_API_BASE must be an absolute https URL')
  }

  const planeADomainName = readEnvValue(env, 'PLANE_A_DOMAIN_NAME').toLowerCase()
  const planeACertArn = readEnvValue(env, 'PLANE_A_CERT_ARN')
  if (planeADomainName && !hasStagingMarker(planeADomainName)) {
    policyViolations.push('PLANE_A_DOMAIN_NAME must contain a staging hostname')
  }
  if ((planeADomainName && !planeACertArn) || (!planeADomainName && planeACertArn)) {
    policyViolations.push('PLANE_A_DOMAIN_NAME and PLANE_A_CERT_ARN must be configured together')
  }
  if (publicApiUrl) {
    const publicApiHost = publicApiUrl.host.toLowerCase()

    if (planeADomainName) {
      if (publicApiHost !== planeADomainName) {
        policyViolations.push(
          `PUBLIC_API_BASE host ${publicApiHost} must match PLANE_A_DOMAIN_NAME ${planeADomainName}`,
        )
      }
    } else if (!hasStagingMarker(publicApiHost) && !isCloudFrontHost(publicApiHost)) {
      policyViolations.push(
        'PUBLIC_API_BASE must resolve to a staging/shared hostname or the live Plane A CloudFront domain',
      )
    }
  }

  const adminMfaRequired = readEnvValue(env, 'ADMIN_MFA_REQUIRED').toLowerCase()
  if (adminMfaRequired && FALSE_VALUES.has(adminMfaRequired)) {
    missingRecommended.push(
      'ADMIN_MFA_REQUIRED: enable admin MFA in staging before enforcing production-parity admin smoke',
    )
  }

  const readOnlyMode = readEnvValue(env, 'READ_ONLY_MODE') || '0'
  if (readOnlyMode !== '0') {
    policyViolations.push(`READ_ONLY_MODE must be "0" for staging (received "${readOnlyMode}")`)
  }

  const e2eMockApi = readEnvValue(env, 'E2E_MOCK_API')
  if (e2eMockApi === '1') {
    policyViolations.push('E2E_MOCK_API must not be enabled in staging')
  }

  const corsMethodsRaw = readEnvValue(env, 'PLANE_A_CORS_ALLOWED_METHODS')
  if (corsMethodsRaw) {
    const methods = new Set(splitCsv(corsMethodsRaw).map(value => value.toUpperCase()))
    const requiredMethods = ['POST', 'PATCH', 'DELETE', 'OPTIONS']
    const missingMethods = requiredMethods.filter(method => !methods.has(method))
    if (missingMethods.length > 0) {
      policyViolations.push(
        `PLANE_A_CORS_ALLOWED_METHODS must include ${requiredMethods.join(', ')} (missing ${missingMethods.join(', ')})`,
      )
    }
  }

  const corsHeadersRaw = readEnvValue(env, 'PLANE_A_CORS_ALLOWED_HEADERS')
  if (corsHeadersRaw) {
    const headers = new Set(splitCsv(corsHeadersRaw).map(value => value.toLowerCase()))
    const requiredHeaders = ['authorization', 'content-type']
    const missingHeaders = requiredHeaders.filter(header => !headers.has(header))
    if (missingHeaders.length > 0) {
      policyViolations.push(
        `PLANE_A_CORS_ALLOWED_HEADERS must include ${requiredHeaders.join(', ')} (missing ${missingHeaders.join(', ')})`,
      )
    }
  }

  const corsOriginsRaw = readEnvValue(env, 'PLANE_A_CORS_ORIGINS')
  const siteOrigin = toOrigin(publicSiteUrl)
  if (siteOrigin && corsOriginsRaw) {
    const corsOrigins = new Set(splitCsv(corsOriginsRaw).map(value => value.toLowerCase().replace(/\/$/, '')))
    if (!corsOrigins.has(siteOrigin)) {
      policyViolations.push(`PLANE_A_CORS_ORIGINS must include PUBLIC_SITE_URL origin (${siteOrigin})`)
    }
  }

  const wafAdminAllowlist = readEnvValue(env, 'WAF_ADMIN_ALLOWLIST_IPS')
  const adminIpAllowlist = readEnvValue(env, 'ADMIN_IP_ALLOWLIST')
  if (!wafAdminAllowlist && !adminIpAllowlist) {
    policyViolations.push('Either WAF_ADMIN_ALLOWLIST_IPS or ADMIN_IP_ALLOWLIST must be set for admin route protection')
  }

  const stripeSecret = readEnvValue(env, 'STRIPE_SECRET_KEY')
  if (stripeSecret && !stripeSecret.startsWith('sk_test_')) {
    policyViolations.push('STRIPE_SECRET_KEY must be Stripe test-mode key (sk_test_*) for staging')
  }

  const ga4 = readEnvValue(env, 'PUBLIC_GA4_MEASUREMENT_ID')
  if (ga4 && !ga4.startsWith('G-')) {
    policyViolations.push('PUBLIC_GA4_MEASUREMENT_ID should start with "G-"')
  }

  const ads = readEnvValue(env, 'PUBLIC_GOOGLE_ADS_CONVERSION_ID')
  if (ads && !ads.startsWith('AW-')) {
    policyViolations.push('PUBLIC_GOOGLE_ADS_CONVERSION_ID should start with "AW-"')
  }

  const adFlag = readEnvValue(env, 'PUBLIC_ENABLE_ADS').toLowerCase()
  if (adFlag === 'true' || adFlag === '1') {
    for (const key of AD_PLACEMENT_ID_KEYS) {
      const raw = readEnvValue(env, key)
      if (!raw) {
        policyViolations.push(`${key} must be set when PUBLIC_ENABLE_ADS=1`)
        continue
      }
      const ids = splitCsv(raw)
        .map(value => Number(value))
        .filter(value => Number.isInteger(value) && value > 0)
      if (ids.length === 0) {
        policyViolations.push(`${key} must contain one or more positive integer placement IDs`)
        continue
      }
      if (ids.includes(101)) {
        policyViolations.push(`${key} contains fallback placement ID 101; replace with real ad provider placement IDs`)
      }
    }
  }

  const alertSlackWebhook = readEnvValue(env, 'ALERT_SLACK_WEBHOOK_URL')
  if (alertSlackWebhook && !/^https:\/\/hooks\.slack\.com\/services\//i.test(alertSlackWebhook)) {
    policyViolations.push('ALERT_SLACK_WEBHOOK_URL must be a valid Slack incoming webhook URL')
  }
  if (looksLikeSlackWebhookPlaceholder(alertSlackWebhook)) {
    policyViolations.push('ALERT_SLACK_WEBHOOK_URL is still a placeholder webhook value')
  }

  const sentryOrg = readEnvValue(env, 'SENTRY_ORG')
  if (sentryOrg && sentryOrg !== 'remit-scout') {
    policyViolations.push(`SENTRY_ORG must be remit-scout (received "${sentryOrg}")`)
  }

  const tracingExporter = readEnvValue(env, 'TRACING_EXPORTER').toLowerCase()
  if (
    tracingExporter &&
    !tracingExporter.includes('otlp') &&
    tracingExporter !== 'both' &&
    tracingExporter !== 'all'
  ) {
    policyViolations.push('TRACING_EXPORTER must include otlp in staging for New Relic span export')
  }

  if (stagingNewRelicAwsMode !== 'push_only') {
    policyViolations.push('NEW_RELIC_STAGING_AWS_MODE must be "push_only" in staging')
  }
  if (prodNewRelicAwsMode !== 'otlp_only') {
    policyViolations.push('NEW_RELIC_PROD_AWS_MODE must be "otlp_only" in staging readiness')
  }

  const stagingAwsAccountId = readEnvValue(env, 'NEW_RELIC_STAGING_AWS_ACCOUNT_ID')
  const prodAwsAccountId = readEnvValue(env, 'NEW_RELIC_PROD_AWS_ACCOUNT_ID')
  const stagingAwsRoleArn = readEnvValue(env, 'NEW_RELIC_STAGING_AWS_ROLE_ARN')
  const prodAwsRoleArn = readEnvValue(env, 'NEW_RELIC_PROD_AWS_ROLE_ARN')
  if (stagingAwsAccountId && prodAwsAccountId && stagingAwsAccountId === prodAwsAccountId) {
    policyViolations.push(
      'NEW_RELIC_STAGING_AWS_ACCOUNT_ID and NEW_RELIC_PROD_AWS_ACCOUNT_ID must differ to preserve env account pinning',
    )
  }
  if (stagingAwsAccountId && stagingAwsRoleArn && !stagingAwsRoleArn.includes(`:${stagingAwsAccountId}:`)) {
    policyViolations.push(
      'NEW_RELIC_STAGING_AWS_ROLE_ARN must belong to NEW_RELIC_STAGING_AWS_ACCOUNT_ID',
    )
  }
  if (prodAwsAccountId && prodAwsRoleArn && !prodAwsRoleArn.includes(`:${prodAwsAccountId}:`)) {
    policyViolations.push(
      'NEW_RELIC_PROD_AWS_ROLE_ARN must belong to NEW_RELIC_PROD_AWS_ACCOUNT_ID',
    )
  }

  const logsEnabled = readEnvValue(env, 'NEW_RELIC_LOGS_ENABLED').toLowerCase()
  if (!logsEnabled || FALSE_VALUES.has(logsEnabled)) {
    policyViolations.push('NEW_RELIC_LOGS_ENABLED must be "1" in staging so deploy/readiness gates stay aligned')
  }

  const logForwardingEnabled = readEnvValue(env, 'NEW_RELIC_AWS_LOG_FORWARDING_ENABLED').toLowerCase()
  if (!logForwardingEnabled || !FALSE_VALUES.has(logForwardingEnabled)) {
    policyViolations.push('NEW_RELIC_AWS_LOG_FORWARDING_ENABLED must be "0" in staging')
  }

  if (!FALSE_VALUES.has(metricStreamEnabled)) {
    const metricNamespaces = new Set(
      splitCsv(readEnvValue(env, 'NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES')),
    )
    const requiredMetricNamespaces = ['AWS/SQS', 'AWS/ECS', 'AWS/Lambda', 'AWS/Events']
    if (
      metricNamespaces.size !== requiredMetricNamespaces.length
      || requiredMetricNamespaces.some(namespace => !metricNamespaces.has(namespace))
    ) {
      policyViolations.push(
        `NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES must be exactly ${requiredMetricNamespaces.join(', ')}`,
      )
    }
  }

  if (triangulationEnabled) {
    const emitObservations = readEnvValue(env, 'EMIT_OBSERVATIONS').toLowerCase()
    const normalizationQueueMode = readEnvValue(env, 'NORMALIZATION_QUEUE_MODE').toLowerCase()
    const agentStressQueueMode = readEnvValue(env, 'AGENT_STRESS_QUEUE_MODE').toLowerCase()
    const goldLiveQueueMode = readEnvValue(env, 'GOLD_LIVE_QUEUE_MODE').toLowerCase()
    const stressResponderEnabled = readEnvValue(env, 'STRESS_RESPONDER_SERVICE_ENABLED').toLowerCase()
    const normalizationServiceEnabled = readEnvValue(env, 'NORMALIZATION_SERVICE_ENABLED').toLowerCase()

    if (!['1', 'true', 'yes', 'on'].includes(emitObservations)) {
      policyViolations.push('EMIT_OBSERVATIONS must be enabled when TRIANGULATION_ENABLED=1')
    }
    if (normalizationQueueMode && normalizationQueueMode !== 'queue') {
      policyViolations.push('NORMALIZATION_QUEUE_MODE must be "queue" when TRIANGULATION_ENABLED=1')
    }
    if (agentStressQueueMode && agentStressQueueMode !== 'queue') {
      policyViolations.push('AGENT_STRESS_QUEUE_MODE must be "queue" when TRIANGULATION_ENABLED=1')
    }
    if (goldLiveQueueMode && goldLiveQueueMode !== 'queue') {
      policyViolations.push('GOLD_LIVE_QUEUE_MODE must be "queue" when TRIANGULATION_ENABLED=1')
    }
    if (stressResponderEnabled && FALSE_VALUES.has(stressResponderEnabled)) {
      policyViolations.push('STRESS_RESPONDER_SERVICE_ENABLED must not disable the stress responder when TRIANGULATION_ENABLED=1')
    }
    if (normalizationServiceEnabled && FALSE_VALUES.has(normalizationServiceEnabled)) {
      policyViolations.push('NORMALIZATION_SERVICE_ENABLED must not disable normalization when TRIANGULATION_ENABLED=1')
    }
  }

  const otlpEndpoint = readEnvValue(env, 'OTEL_EXPORTER_OTLP_ENDPOINT')
  const otlpHeaders = readEnvValue(env, 'OTEL_EXPORTER_OTLP_HEADERS')
  const newRelicIngestKey = readEnvValue(env, 'NEW_RELIC_INGEST_KEY')
  if (otlpEndpoint.includes('nr-data.net') && !otlpHeaders && !newRelicIngestKey) {
    policyViolations.push(
      'OTEL_EXPORTER_OTLP_HEADERS or NEW_RELIC_INGEST_KEY is required for New Relic OTLP endpoint',
    )
  }

  if (soc2ReportState && !VALID_SOC2_REPORT_STATES.has(soc2ReportState)) {
    policyViolations.push(
      `COMPLIANCE_SOC2_TYPE_II_REPORT_STATE must be in_progress|audited|expired|revoked (received "${soc2ReportState}")`,
    )
  }
  if (soc2ReportDate && !isValidDateValue(soc2ReportDate)) {
    policyViolations.push(`COMPLIANCE_SOC2_TYPE_II_REPORT_DATE is not a valid date (${soc2ReportDate})`)
  }
  if (soc2ReportExpiresOn && !isValidDateValue(soc2ReportExpiresOn)) {
    policyViolations.push(`COMPLIANCE_SOC2_TYPE_II_EXPIRES_ON is not a valid date (${soc2ReportExpiresOn})`)
  }

  const publicSupabaseUrl = readEnvValue(env, 'PUBLIC_SUPABASE_URL')
  const backendSupabaseUrl = readEnvValue(env, 'SUPABASE_URL')
  if (publicSupabaseUrl && backendSupabaseUrl && publicSupabaseUrl !== backendSupabaseUrl) {
    policyViolations.push('PUBLIC_SUPABASE_URL and SUPABASE_URL must match in staging')
  }

  const publicSupabaseAnon = readEnvValue(env, 'PUBLIC_SUPABASE_ANON_KEY')
  const backendSupabaseAnon = readEnvValue(env, 'SUPABASE_PUBLISHABLE_KEY')
  if (publicSupabaseAnon && backendSupabaseAnon && publicSupabaseAnon !== backendSupabaseAnon) {
    policyViolations.push('PUBLIC_SUPABASE_ANON_KEY and SUPABASE_PUBLISHABLE_KEY must match in staging')
  }

  return {
    missingRequired,
    missingRecommended,
    placeholderViolations,
    policyViolations,
  }
}

export const evaluateAndPrintMigrationSync = async (
  env: NodeJS.ProcessEnv = process.env,
  label = 'staging',
): Promise<MigrationSyncEvaluation | null> => {
  const override = await loadMigrationSyncOverride(env)
  if (override) {
    console.log(
      `\nUsing migration sync evidence from ${readEnvValue(env, 'STAGING_MIGRATION_SYNC_RESULT_PATH')}`,
    )
    const migrationViolations: string[] = []
    if (override.missingSchemaMigrationsTable) {
      migrationViolations.push('public.schema_migrations table is missing')
    }
    if (override.pendingRepoMigrations.length > 0) {
      migrationViolations.push(
        `pending repo migrations: ${override.pendingRepoMigrations.join(', ')}`,
      )
    }
    if (override.unexpectedAppliedMigrations.length > 0) {
      migrationViolations.push(
        `unexpected applied migrations: ${override.unexpectedAppliedMigrations.join(', ')}`,
      )
    }

    printGroup(`Migration sync violations (${label})`, migrationViolations)
    if (migrationViolations.length === 0) {
      console.log(`\n✅ Migration sync check passed (${label})`)
    }
    return override
  }

  await resolveReadinessDatabaseUrls(env)
  const databaseUrl = resolveDatabaseUrl(env)
  if (!databaseUrl) {
    return null
  }

  const migrationSync = await readMigrationSync(databaseUrl)
  const migrationViolations: string[] = []
  if (migrationSync.missingSchemaMigrationsTable) {
    migrationViolations.push('public.schema_migrations table is missing')
  }
  if (migrationSync.pendingRepoMigrations.length > 0) {
    migrationViolations.push(
      `pending repo migrations: ${migrationSync.pendingRepoMigrations.join(', ')}`,
    )
  }
  if (migrationSync.unexpectedAppliedMigrations.length > 0) {
    migrationViolations.push(
      `unexpected applied migrations: ${migrationSync.unexpectedAppliedMigrations.join(', ')}`,
    )
  }

  printGroup(`Migration sync violations (${label})`, migrationViolations)

  if (migrationViolations.length === 0) {
    console.log(`\n✅ Migration sync check passed (${label})`)
  }

  return migrationSync
}

export const runMigrationSyncCheck = async (
  env: NodeJS.ProcessEnv = process.env,
  label = 'release-gate',
): Promise<void> => {
  const migrationSync = await evaluateAndPrintMigrationSync(env, label)
  if (!migrationSync) {
    throw new Error('Missing DATABASE_URL_PLANE_B for migration sync check')
  }
  if (
    migrationSync.missingSchemaMigrationsTable
    || migrationSync.pendingRepoMigrations.length
    || migrationSync.unexpectedAppliedMigrations.length
  ) {
    throw new Error(`Migration sync check failed (${label})`)
  }
}

export const run = async (env: NodeJS.ProcessEnv = process.env) => {
  const evaluation = evaluateStagingGoLiveReadiness(env)

  printGroup('Missing required keys', evaluation.missingRequired)
  printGroup('Placeholder values detected', evaluation.placeholderViolations)
  printGroup('Policy violations', evaluation.policyViolations)
  printGroup('Missing recommended keys (non-blocking)', evaluation.missingRecommended)

  const migrationSync = await evaluateAndPrintMigrationSync(env)
  const migrationViolations =
    migrationSync
      ? [
          ...(migrationSync.missingSchemaMigrationsTable ? ['public.schema_migrations table is missing'] : []),
          ...(migrationSync.pendingRepoMigrations.length
            ? [`pending repo migrations: ${migrationSync.pendingRepoMigrations.join(', ')}`]
            : []),
          ...(migrationSync.unexpectedAppliedMigrations.length
            ? [`unexpected applied migrations: ${migrationSync.unexpectedAppliedMigrations.join(', ')}`]
            : []),
        ]
      : []

  if (
    evaluation.missingRequired.length
    || evaluation.placeholderViolations.length
    || evaluation.policyViolations.length
    || migrationViolations.length
  ) {
    throw new Error('Staging go-live readiness failed')
  }

  console.log('\n✅ Staging go-live readiness passed')
}

const isDirectExecution = /(^|[/\\])staging-go-live-readiness\.(ts|js)$/.test(process.argv[1] || '')

if (isDirectExecution) {
  const main = async () => {
    const args = process.argv.slice(2)
    if (hasCliFlag(args, '--check-migration-sync')) {
      const label = resolveCliOption(args, '--label') || 'release-gate'
      await runMigrationSyncCheck(process.env, label)
      return
    }

    if (hasCliFlag(args, '--write-release-evidence')) {
      const artifactDir = resolveCliOption(args, '--artifact-dir')
      const outputPath = resolveCliOption(args, '--output')
      if (!artifactDir || !outputPath) {
        throw new Error('--write-release-evidence requires --artifact-dir and --output')
      }

      const manifest = await buildReleaseEvidenceManifest({ artifactDir })
      await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
      printGroup('Release evidence violations', manifest.violations)
      if (manifest.status !== 'pass') {
        throw new Error('Release evidence validation failed')
      }
      console.log(`\n✅ Release evidence manifest written to ${outputPath}`)
      return
    }

    if (hasCliFlag(args, '--verify-release-evidence')) {
      const manifestPath = resolveCliOption(args, '--manifest')
      const expectedSha = resolveCliOption(args, '--expected-sha')
      if (!manifestPath) {
        throw new Error('--verify-release-evidence requires --manifest')
      }

      const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ReleaseEvidenceManifest
      const violations = validateReleaseEvidenceManifest(manifest, expectedSha)
      printGroup('Release evidence verification failures', violations)
      if (violations.length > 0) {
        throw new Error('Release evidence verification failed')
      }
      console.log(`\n✅ Release evidence verified for ${expectedSha || manifest.git.actualHeadSha}`)
      return
    }

    await run()
  }

  main().catch(error => {
    console.error(
      error instanceof Error ? error.message : 'Staging go-live readiness failed',
    )
    process.exit(1)
  })
}
