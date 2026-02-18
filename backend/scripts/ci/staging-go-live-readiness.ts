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
  { key: 'BRONZE_S3_BUCKET', description: 'Bronze raw-data bucket' },
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
  { key: 'PUBLIC_ENABLE_EZOIC', description: 'Ezoic flag enabled for staging test surface' },
  { key: 'SLACK_BOT_TOKEN', description: 'Slack bot token for frontdesk + brain posts' },
  { key: 'SLACK_APP_TOKEN', description: 'Slack app token for Socket Mode' },
  { key: 'SLACK_SIGNING_SECRET', description: 'Slack signing secret for action verification' },
  { key: 'SLACK_CASES_CHANNEL_ID', description: 'Ops channel id for case cards' },
]

const RECOMMENDED_KEYS: Requirement[] = [
  { key: 'SENTRY_AUTH_TOKEN', description: 'Sentry integration token (MCP/evidence)' },
  { key: 'ALERT_SLACK_WEBHOOK_URL', description: 'Alert webhook fallback channel' },
  { key: 'BRAIN_DISPATCH_GITHUB_ACTIONS', description: 'Brain dispatch gate (set to 1 for staging trial)' },
  { key: 'BRAIN_INGEST_GITHUB_ACTIONS', description: 'Brain ingestion gate (set to 1 for closed-loop run ingestion)' },
  { key: 'BRAIN_SLACK_POST_CASE_CARDS', description: 'Brain Slack posting gate' },
]

const PLACEHOLDER_PATTERNS = [/change-me/i, /placeholder/i, /example/i, /your[-_]/i]

const getValue = (key: string) => String(process.env[key] || '').trim()

const isMissing = (value: string) => value.length === 0

const looksLikePlaceholder = (value: string) => PLACEHOLDER_PATTERNS.some(pattern => pattern.test(value))

const hasStagingMarker = (value: string) => /staging/i.test(value)

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

  for (const requirement of REQUIRED_KEYS) {
    const value = getValue(requirement.key)
    if (isMissing(value)) {
      missingRequired.push(`${requirement.key}: ${requirement.description}`)
      continue
    }
    if (looksLikePlaceholder(value)) {
      placeholderViolations.push(`${requirement.key}: looks like placeholder value`)
    }
  }

  for (const requirement of RECOMMENDED_KEYS) {
    const value = getValue(requirement.key)
    if (isMissing(value)) {
      missingRecommended.push(`${requirement.key}: ${requirement.description}`)
    }
  }

  const environment = getValue('ENVIRONMENT').toLowerCase()
  const nodeEnv = getValue('NODE_ENV').toLowerCase()
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

  const ezoic = getValue('PUBLIC_ENABLE_EZOIC').toLowerCase()
  if (ezoic !== 'true' && ezoic !== '1') {
    policyViolations.push('PUBLIC_ENABLE_EZOIC must be true/1 for this go-live profile')
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
