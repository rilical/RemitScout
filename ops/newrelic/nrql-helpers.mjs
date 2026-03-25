const METRIC_NAMESPACE_BY_NAME = Object.freeze({
  slo_actual_value: 'RemitScout',
  slo_compliance_ratio: 'RemitScout',
  slo_breach_total: 'RemitScout',
  worker_backpressure_active: 'RemitScout',
  db_connection_pool_waiting: 'RemitScout',
  oanda_sync_failures_total: 'RemitScout',
  indices_teer_rate: 'RemitScout',
  indices_rci_ratio: 'RemitScout',
  indices_rvi_bps: 'RemitScout',

  telemetry_search_events_total: 'RemitScout/Business',
  telemetry_provider_visits_total: 'RemitScout/Business',
  telemetry_affiliate_click_events_total: 'RemitScout/Business',
  telemetry_affiliate_conversions_total: 'RemitScout/Business',
  telemetry_click_events_total: 'RemitScout/Business',
  telemetry_sessions_started_total: 'RemitScout/Business',
  telemetry_affiliate_conversion_value: 'RemitScout/Business',
  export_jobs_completed: 'RemitScout/Business',
  export_jobs_failed: 'RemitScout/Business',

  message_failed: 'RemitScout/Workers',
  dlq_sent: 'RemitScout/Workers',
  lock_failed: 'RemitScout/Workers',
  envelope_parse_error: 'RemitScout/Workers',
  stale_dropped: 'RemitScout/Workers',

  probe_result: 'RemitScout/Probes',
  probe_run_total: 'RemitScout/Probes',

  collector_block_count: 'RemitScout/Collectors',
  collector_avg_attempt_ms: 'RemitScout/Collectors',
  provider_collection_failure_by_provider_total: 'RemitScout',
  provider_collection_success_by_provider_total: 'RemitScout',
  http_request_duration_seconds: 'RemitScout',
  http_requests_total: 'RemitScout',

  detection_cycle_count: 'RemitScout/Agents',
  failure_bundle_created: 'RemitScout/Agents',
  repair_proposal_generated: 'RemitScout/Agents',
  tool_request_total: 'RemitScout/Agents',
  tool_request_blocked: 'RemitScout/Agents',
  knowledge_retrieval_total: 'RemitScout/Agents',
  knowledge_retrieval_insufficient: 'RemitScout/Agents',
  stress_escalation_incident: 'RemitScout/Agents',
  detection_run_total: 'RemitScout/Agents',
  detection_modules_scanned: 'RemitScout/Agents',
  detection_bundles_by_category: 'RemitScout/Agents',
  module_quarantined: 'RemitScout/Agents',
  deploy_pr_created: 'RemitScout/Agents',
  deploy_pr_deferred: 'RemitScout/Agents',
  deploy_pr_failed: 'RemitScout/Agents',
  stress_computation_total: 'RemitScout/Agents',
  stress_signals_by_level: 'RemitScout/Agents',
  stress_corridors_scanned: 'RemitScout/Agents',
  normalization_success_total: 'RemitScout/Agents',
  normalization_quality_flag_total: 'RemitScout/Agents',
})

const escapeNrqlValue = (value) => String(value).replace(/'/g, "\\'")
const escapeNrqlIdentifier = (value) => String(value).replace(/`/g, '\\`')

export const normalizeEnvName = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return 'dev'
  if (normalized === 'production') return 'prod'
  if (normalized === 'development') return 'dev'
  return normalized
}

const toCompactToken = (value) => String(value || '').replace(/[^a-zA-Z0-9]/g, '')

export const getEnvTokens = (nameToken, envName) => {
  const normalizedEnv = normalizeEnvName(envName)
  const base = String(nameToken || '').trim().toLowerCase()
  const fallback = `remit-scout-${normalizedEnv}`
  const candidates = [base || fallback, fallback]
  const out = new Set()
  for (const token of candidates) {
    if (!token) continue
    out.add(token)
    const compact = toCompactToken(token)
    if (compact) out.add(compact.toLowerCase())
  }
  return Array.from(out)
}

export const buildEnvironmentFilter = (envName) => {
  const normalized = normalizeEnvName(envName)
  if (normalized === 'prod') {
    return `(
      environment = 'prod'
      OR environment = 'production'
      OR \`deployment.environment\` = 'prod'
      OR \`deployment.environment\` = 'production'
    )`
  }
  return `(
    environment = '${escapeNrqlValue(normalized)}'
    OR \`deployment.environment\` = '${escapeNrqlValue(normalized)}'
  )`
}

export const buildEnvScopeClause = ({ envName, nameToken, awsAccountId, allowMissingAwsAccount = true }) => {
  const environmentFilter = buildEnvironmentFilter(envName)
  const tokenPredicates = getEnvTokens(nameToken, envName)
    .flatMap((token) => {
      const escaped = escapeNrqlValue(token)
      return [
        `entity.name LIKE '%${escaped}%'`,
        `aws.lambda.FunctionName LIKE '%${escaped}%'`,
        `aws.sqs.QueueName LIKE '%${escaped}%'`,
        `aws.logs.Resource LIKE '%${escaped}%'`,
        `aws.arn LIKE '%${escaped}%'`,
        `aws.Arn LIKE '%${escaped}%'`,
        `appName LIKE '%${escaped}%'`,
        `providerAccountName LIKE '%${escaped}%'`,
      ]
    })

  let scope = `(
    ${environmentFilter}
    OR ${tokenPredicates.join('\n    OR ')}
  )`

  if (awsAccountId) {
    const escapedAccountId = escapeNrqlValue(awsAccountId)
    const accountClause = allowMissingAwsAccount
      ? `(aws.accountId = '${escapedAccountId}' OR aws.accountId IS NULL OR aws.accountId = '')`
      : `aws.accountId = '${escapedAccountId}'`
    scope = `(${scope}) AND ${accountClause}`
  }

  return scope
}

export const buildAwsIntegrationScopeClause = ({ envName, nameToken, awsAccountId }) => {
  if (awsAccountId) {
    const escapedAccountId = escapeNrqlValue(awsAccountId)
    return `(
      aws.accountId = '${escapedAccountId}'
      OR newrelic.cloudIntegrations.providerAccountId = '${escapedAccountId}'
      OR awsAccountId = '${escapedAccountId}'
      OR providerAccountId = '${escapedAccountId}'
    )`
  }

  const tokenPredicates = getEnvTokens(nameToken, envName)
    .flatMap((token) => {
      const escaped = escapeNrqlValue(token)
      return [
        `entity.name LIKE '%${escaped}%'`,
        `entityName LIKE '%${escaped}%'`,
        `displayName LIKE '%${escaped}%'`,
        `aws.Arn LIKE '%${escaped}%'`,
        `aws.arn LIKE '%${escaped}%'`,
        `providerAccountName LIKE '%${escaped}%'`,
        `newrelic.cloudIntegrations.providerAccountName LIKE '%${escaped}%'`,
      ]
    })

  return `(${tokenPredicates.join('\n      OR ')})`
}

export const quoteNrqlIdentifier = (value) => `\`${escapeNrqlIdentifier(value)}\``

export const buildNamedMetricSelect = (name, aggregator = 'sum') =>
  `${aggregator}(${quoteNrqlIdentifier(name)})`

export const buildNamedMetricFilterExpression = (name, aggregator = 'sum') =>
  `filter(${buildNamedMetricSelect(name, aggregator)}, WHERE ${buildMetricNameFilter(name)})`

export const buildNamedMetricFilterSelect = (name, aggregator = 'sum', alias = name) =>
  `${buildNamedMetricFilterExpression(name, aggregator)} AS '${escapeNrqlValue(alias)}'`

export const buildAwsSummaryField = (name, field = 'max') =>
  `getField(${quoteNrqlIdentifier(name)}, ${field})`

export const buildAwsSummarySelect = (name, field = 'max', aggregator = 'max') =>
  `${aggregator}(${buildAwsSummaryField(name, field)})`

export const buildAwsSummaryFilterExpression = (name, field = 'max', aggregator = 'max') =>
  `filter(${buildAwsSummarySelect(name, field, aggregator)}, WHERE metricName = '${escapeNrqlValue(name)}')`

export const buildAwsSummaryFilterSelect = (name, field = 'max', aggregator = 'max', alias = name) =>
  `${buildAwsSummaryFilterExpression(name, field, aggregator)} AS '${escapeNrqlValue(alias)}'`

export const buildMetricNameVariants = (name) => {
  const escaped = escapeNrqlValue(name)
  return `(
    metricName = '${escaped}'
    OR metricName = 'aws.remitscout.${escaped}'
    OR metricName LIKE '%.${escaped}'
    OR metricName LIKE '%/${escaped}'
    OR metricName LIKE '%${escaped}%'
  )`
}

export const getMetricNamespace = (name) => METRIC_NAMESPACE_BY_NAME[name] || null

const buildNamespaceFilter = (name) => {
  const ns = getMetricNamespace(name)
  if (!ns) return ''
  const escaped = escapeNrqlValue(ns)
  return `(
    aws.Namespace = '${escaped}'
    OR aws.namespace = '${escaped}'
    OR namespace = '${escaped}'
  )`
}

export const buildMetricNameFilter = (name) => {
  const metricClause = buildMetricNameVariants(name)
  const namespaceClause = buildNamespaceFilter(name)
  if (!namespaceClause) return metricClause
  return `(${metricClause} AND ${namespaceClause})`
}

export const buildMetricNamesFilter = (names) =>
  `(${names.map((name) => buildMetricNameFilter(name)).join(' OR ')})`

export const buildAwsMetricLikeFilter = (fragment) => {
  const escaped = escapeNrqlValue(fragment)
  return `(metricName LIKE '%${escaped}%' OR metricName LIKE 'aws.%${escaped}%')`
}

export const metricNamespaceByName = METRIC_NAMESPACE_BY_NAME
