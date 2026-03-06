export {}

type Requirement = {
  key: string
  description: string
}

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

const getValue = (key: string) => String(process.env[key] || '').trim()

const isMissing = (value: string) => value.length === 0

const normalizeNewRelicAwsMode = (value: string) => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return 'push_pull'
  if (['push_pull', 'push+pull', 'all'].includes(normalized)) return 'push_pull'
  if (['push_only', 'push'].includes(normalized)) return 'push_only'
  if (['otlp_only', 'otlp', 'none', 'disabled'].includes(normalized)) return 'otlp_only'
  return 'push_pull'
}

const looksLikeSlackWebhookPlaceholder = (value: string) =>
  /hooks\.slack\.com\/services\/T0{8,}\/B0{8,}\/A{10,}/i.test(value)

const looksLikePlaceholder = (value: string) =>
  PLACEHOLDER_PATTERNS.some(pattern => pattern.test(value)) || looksLikeSlackWebhookPlaceholder(value)

const hasStagingMarker = (value: string) => /staging/i.test(value)

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

const toOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin.toLowerCase()
  } catch {
    return null
  }
}

const printGroup = (title: string, lines: string[]) => {
  if (!lines.length) return
  console.log(`\n${title}`)
  for (const line of lines) console.log(`- ${line}`)
}

const run = () => {
  const missingRequired: string[] = []
  const missingRecommended: string[] = []
  const placeholderViolations: string[] = []
  const policyViolations: string[] = []
  const requireNewRelicGates = !['0', 'false', 'off', 'no'].includes(
    getValue('REQUIRE_NEW_RELIC_GATES').toLowerCase(),
  )
  const stagingNewRelicAwsMode = normalizeNewRelicAwsMode(getValue('NEW_RELIC_STAGING_AWS_MODE'))
  const prodNewRelicAwsMode = normalizeNewRelicAwsMode(getValue('NEW_RELIC_PROD_AWS_MODE'))
  const shouldSoftenNewRelicRequirement = (key: string) => {
    if (key === 'NEW_RELIC_USER_API_KEY') {
      return !requireNewRelicGates
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
    const value = getValue(requirement.key)
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
    const value = getValue(requirement.key)
    if (isMissing(value)) {
      missingRecommended.push(`${requirement.key}: ${requirement.description}`)
      continue
    }
    if (looksLikePlaceholder(value)) {
      placeholderViolations.push(`${requirement.key}: looks like placeholder value`)
    }
  }

  const environment = getValue('ENVIRONMENT').toLowerCase()
  const nodeEnv = getValue('NODE_ENV').toLowerCase()
  const triangulationEnabled = ['1', 'true', 'yes', 'on'].includes(getValue('TRIANGULATION_ENABLED').toLowerCase())
  const soc2ReportState = (getValue('COMPLIANCE_SOC2_TYPE_II_REPORT_STATE') || getValue('COMPLIANCE_SOC2_TYPE_II_STATUS')).toLowerCase()
  const soc2ReportDate = getValue('COMPLIANCE_SOC2_TYPE_II_REPORT_DATE')
  const soc2ReportExpiresOn = getValue('COMPLIANCE_SOC2_TYPE_II_EXPIRES_ON')

  if (environment !== 'staging') {
    policyViolations.push(`ENVIRONMENT must be "staging" (received "${environment || '<empty>'}")`)
  }
  if (nodeEnv !== 'staging') {
    policyViolations.push(`NODE_ENV must be "staging" (received "${nodeEnv || '<empty>'}")`)
  }

  const stackName = getValue('STACK_NAME')
  if (stackName && !hasStagingMarker(stackName)) {
    policyViolations.push('STACK_NAME must include "staging" to keep env isolation explicit')
  }

  const publicSiteUrl = getValue('PUBLIC_SITE_URL')
  if (publicSiteUrl && !hasStagingMarker(publicSiteUrl)) {
    policyViolations.push('PUBLIC_SITE_URL must contain a staging hostname')
  }

  const publicApiBase = getValue('PUBLIC_API_BASE')
  if (publicApiBase && !hasStagingMarker(publicApiBase)) {
    policyViolations.push('PUBLIC_API_BASE must contain a staging hostname')
  }

  const readOnlyMode = getValue('READ_ONLY_MODE') || '0'
  if (readOnlyMode !== '0') {
    policyViolations.push(`READ_ONLY_MODE must be "0" for staging (received "${readOnlyMode}")`)
  }

  const e2eMockApi = getValue('E2E_MOCK_API')
  if (e2eMockApi === '1') {
    policyViolations.push('E2E_MOCK_API must not be enabled in staging')
  }

  const corsMethodsRaw = getValue('PLANE_A_CORS_ALLOWED_METHODS')
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

  const corsHeadersRaw = getValue('PLANE_A_CORS_ALLOWED_HEADERS')
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

  const corsOriginsRaw = getValue('PLANE_A_CORS_ORIGINS')
  const siteOrigin = toOrigin(publicSiteUrl)
  if (siteOrigin && corsOriginsRaw) {
    const corsOrigins = new Set(splitCsv(corsOriginsRaw).map(value => value.toLowerCase().replace(/\/$/, '')))
    if (!corsOrigins.has(siteOrigin)) {
      policyViolations.push(`PLANE_A_CORS_ORIGINS must include PUBLIC_SITE_URL origin (${siteOrigin})`)
    }
  }

  const wafAdminAllowlist = getValue('WAF_ADMIN_ALLOWLIST_IPS')
  const adminIpAllowlist = getValue('ADMIN_IP_ALLOWLIST')
  if (!wafAdminAllowlist && !adminIpAllowlist) {
    policyViolations.push('Either WAF_ADMIN_ALLOWLIST_IPS or ADMIN_IP_ALLOWLIST must be set for admin route protection')
  }

  const stripeSecret = getValue('STRIPE_SECRET_KEY')
  if (stripeSecret && !stripeSecret.startsWith('sk_test_')) {
    policyViolations.push('STRIPE_SECRET_KEY must be Stripe test-mode key (sk_test_*) for staging')
  }

  const ga4 = getValue('PUBLIC_GA4_MEASUREMENT_ID')
  if (ga4 && !ga4.startsWith('G-')) {
    policyViolations.push('PUBLIC_GA4_MEASUREMENT_ID should start with "G-"')
  }

  const ads = getValue('PUBLIC_GOOGLE_ADS_CONVERSION_ID')
  if (ads && !ads.startsWith('AW-')) {
    policyViolations.push('PUBLIC_GOOGLE_ADS_CONVERSION_ID should start with "AW-"')
  }

  const adFlag = getValue('PUBLIC_ENABLE_ADS').toLowerCase()
  if (adFlag === 'true' || adFlag === '1') {
    for (const key of AD_PLACEMENT_ID_KEYS) {
      const raw = getValue(key)
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

  const alertSlackWebhook = getValue('ALERT_SLACK_WEBHOOK_URL')
  if (alertSlackWebhook && !/^https:\/\/hooks\.slack\.com\/services\//i.test(alertSlackWebhook)) {
    policyViolations.push('ALERT_SLACK_WEBHOOK_URL must be a valid Slack incoming webhook URL')
  }
  if (looksLikeSlackWebhookPlaceholder(alertSlackWebhook)) {
    policyViolations.push('ALERT_SLACK_WEBHOOK_URL is still a placeholder webhook value')
  }

  const sentryOrg = getValue('SENTRY_ORG')
  if (sentryOrg && sentryOrg !== 'remit-scout') {
    policyViolations.push(`SENTRY_ORG must be remit-scout (received "${sentryOrg}")`)
  }

  const tracingExporter = getValue('TRACING_EXPORTER').toLowerCase()
  if (
    tracingExporter &&
    !tracingExporter.includes('otlp') &&
    tracingExporter !== 'both' &&
    tracingExporter !== 'all'
  ) {
    policyViolations.push('TRACING_EXPORTER must include otlp in staging for New Relic span export')
  }

  const logsEnabled = getValue('NEW_RELIC_LOGS_ENABLED').toLowerCase()
  if (logsEnabled && ['0', 'false', 'off', 'no'].includes(logsEnabled)) {
    policyViolations.push('NEW_RELIC_LOGS_ENABLED must not disable New Relic logs in staging')
  }

  if (triangulationEnabled) {
    const emitObservations = getValue('EMIT_OBSERVATIONS').toLowerCase()
    const normalizationQueueMode = getValue('NORMALIZATION_QUEUE_MODE').toLowerCase()
    const agentStressQueueMode = getValue('AGENT_STRESS_QUEUE_MODE').toLowerCase()
    const goldLiveQueueMode = getValue('GOLD_LIVE_QUEUE_MODE').toLowerCase()
    const stressResponderEnabled = getValue('STRESS_RESPONDER_SERVICE_ENABLED').toLowerCase()
    const normalizationServiceEnabled = getValue('NORMALIZATION_SERVICE_ENABLED').toLowerCase()

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
    if (stressResponderEnabled && ['0', 'false', 'off', 'no'].includes(stressResponderEnabled)) {
      policyViolations.push('STRESS_RESPONDER_SERVICE_ENABLED must not disable the stress responder when TRIANGULATION_ENABLED=1')
    }
    if (normalizationServiceEnabled && ['0', 'false', 'off', 'no'].includes(normalizationServiceEnabled)) {
      policyViolations.push('NORMALIZATION_SERVICE_ENABLED must not disable normalization when TRIANGULATION_ENABLED=1')
    }
  }

  const otlpEndpoint = getValue('OTEL_EXPORTER_OTLP_ENDPOINT')
  const otlpHeaders = getValue('OTEL_EXPORTER_OTLP_HEADERS')
  const newRelicIngestKey = getValue('NEW_RELIC_INGEST_KEY')
  if (otlpEndpoint.includes('nr-data.net') && !otlpHeaders && !newRelicIngestKey) {
    policyViolations.push(
      'OTEL_EXPORTER_OTLP_HEADERS or NEW_RELIC_INGEST_KEY is required for New Relic OTLP endpoint',
    )
  }

  if (soc2ReportState) {
    if (!VALID_SOC2_REPORT_STATES.has(soc2ReportState)) {
      policyViolations.push(
        `COMPLIANCE_SOC2_TYPE_II_REPORT_STATE must be in_progress|audited|expired|revoked (received "${soc2ReportState}")`,
      )
    }
  }
  if (soc2ReportDate && !isValidDateValue(soc2ReportDate)) {
    policyViolations.push(`COMPLIANCE_SOC2_TYPE_II_REPORT_DATE is not a valid date (${soc2ReportDate})`)
  }
  if (soc2ReportExpiresOn && !isValidDateValue(soc2ReportExpiresOn)) {
    policyViolations.push(`COMPLIANCE_SOC2_TYPE_II_EXPIRES_ON is not a valid date (${soc2ReportExpiresOn})`)
  }

  const publicSupabaseUrl = getValue('PUBLIC_SUPABASE_URL')
  const backendSupabaseUrl = getValue('SUPABASE_URL')
  if (publicSupabaseUrl && backendSupabaseUrl && publicSupabaseUrl !== backendSupabaseUrl) {
    policyViolations.push('PUBLIC_SUPABASE_URL and SUPABASE_URL must match in staging')
  }

  const publicSupabaseAnon = getValue('PUBLIC_SUPABASE_ANON_KEY')
  const backendSupabaseAnon = getValue('SUPABASE_PUBLISHABLE_KEY')
  if (publicSupabaseAnon && backendSupabaseAnon && publicSupabaseAnon !== backendSupabaseAnon) {
    policyViolations.push('PUBLIC_SUPABASE_ANON_KEY and SUPABASE_PUBLISHABLE_KEY must match in staging')
  }

  printGroup('Missing required keys', missingRequired)
  printGroup('Placeholder values detected', placeholderViolations)
  printGroup('Policy violations', policyViolations)
  printGroup('Missing recommended keys (non-blocking)', missingRecommended)

  if (missingRequired.length || placeholderViolations.length || policyViolations.length) {
    console.error('\n❌ Staging go-live readiness failed')
    process.exit(1)
  }

  console.log('\n✅ Staging go-live readiness passed')
}

try {
  run()
} catch (error) {
  console.error('Staging go-live readiness check failed:', error instanceof Error ? error.message : String(error))
  process.exit(1)
}
