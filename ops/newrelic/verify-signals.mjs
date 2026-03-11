#!/usr/bin/env node

/**
 * Validates New Relic signal readiness for staging/prod.
 *
 * Required env:
 * - NEW_RELIC_USER_API_KEY
 * - NEW_RELIC_ACCOUNT_ID
 * Optional env:
 * - NEW_RELIC_REGION (US|EU, default US)
 * - NEW_RELIC_TARGET_ENV (staging|prod|all, default all)
 * - NEW_RELIC_WINDOW_MINUTES (default 60)
 * - NEW_RELIC_STAGING_AWS_ACCOUNT_ID (optional AWS account scoping)
 * - NEW_RELIC_PROD_AWS_ACCOUNT_ID (optional AWS account scoping)
 * - NEW_RELIC_STAGING_AWS_MODE (push_pull|push_only|otlp_only, default push_only)
 * - NEW_RELIC_PROD_AWS_MODE (push_pull|push_only|otlp_only, default otlp_only)
 * - REQUIRE_ACCOUNT_PINNING (0|1, default 1)
 * - REQUIRE_LOGS (0|1, default 1)
 * - REQUIRE_SPANS (0|1, default 1)
 * - REQUIRE_API_GW_METRICS (0|1, default 1)
 * - REQUIRE_SQS_METRICS (0|1, default 1)
 * - REQUIRE_CUSTOM_METRICS (0|1, default 1)
 */

import {
  buildAwsIntegrationScopeClause,
  buildEnvScopeClause,
  buildEnvironmentFilter,
  buildMetricNamesFilter,
  normalizeEnvName,
} from './nrql-helpers.mjs'

const NEW_RELIC_USER_API_KEY = process.env.NEW_RELIC_USER_API_KEY || ''
const NEW_RELIC_ACCOUNT_ID = Number.parseInt(process.env.NEW_RELIC_ACCOUNT_ID || '', 10)
const NEW_RELIC_REGION = (process.env.NEW_RELIC_REGION || 'US').trim().toUpperCase()
const TARGET_ENV = normalizeEnvName((process.env.NEW_RELIC_TARGET_ENV || 'all').trim().toLowerCase())
const WINDOW_MINUTES = Number.parseInt(process.env.NEW_RELIC_WINDOW_MINUTES || '60', 10)
const NEW_RELIC_STAGING_AWS_ACCOUNT_ID = (process.env.NEW_RELIC_STAGING_AWS_ACCOUNT_ID || '').trim()
const NEW_RELIC_PROD_AWS_ACCOUNT_ID = (process.env.NEW_RELIC_PROD_AWS_ACCOUNT_ID || '').trim()
const normalizeNewRelicAwsMode = (value, fallback = 'push_pull') => {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return fallback
  if (['push_pull', 'push+pull', 'all'].includes(normalized)) return 'push_pull'
  if (['push_only', 'push'].includes(normalized)) return 'push_only'
  if (['otlp_only', 'otlp', 'none', 'disabled'].includes(normalized)) return 'otlp_only'
  throw new Error(`Unsupported New Relic AWS mode: ${value}`)
}
const NEW_RELIC_STAGING_AWS_MODE = normalizeNewRelicAwsMode(process.env.NEW_RELIC_STAGING_AWS_MODE, 'push_only')
const NEW_RELIC_PROD_AWS_MODE = normalizeNewRelicAwsMode(process.env.NEW_RELIC_PROD_AWS_MODE, 'otlp_only')

const requireAccountPinning = process.env.REQUIRE_ACCOUNT_PINNING !== '0'
const requireLogs = process.env.REQUIRE_LOGS !== '0'
const requireSpans = process.env.REQUIRE_SPANS !== '0'
const requireApiGatewayMetrics = process.env.REQUIRE_API_GW_METRICS !== '0'
const requireSqsMetrics = process.env.REQUIRE_SQS_METRICS !== '0'
const requireCustomMetrics = process.env.REQUIRE_CUSTOM_METRICS !== '0'

if (!NEW_RELIC_USER_API_KEY) {
  console.error('Missing NEW_RELIC_USER_API_KEY')
  process.exit(1)
}

if (!Number.isFinite(NEW_RELIC_ACCOUNT_ID)) {
  console.error('Missing/invalid NEW_RELIC_ACCOUNT_ID')
  process.exit(1)
}

if (!Number.isFinite(WINDOW_MINUTES) || WINDOW_MINUTES <= 0) {
  console.error('Invalid NEW_RELIC_WINDOW_MINUTES')
  process.exit(1)
}

const ENDPOINT =
  NEW_RELIC_REGION === 'EU'
    ? 'https://api.eu.newrelic.com/graphql'
    : 'https://api.newrelic.com/graphql'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const shouldRetryHttpStatus = (status) => status === 429 || status >= 500

const gql = async (query, variables = {}) => {
  const maxAttempts = 4
  let lastError = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Key': NEW_RELIC_USER_API_KEY,
        },
        body: JSON.stringify({ query, variables }),
      })

      if (!response.ok) {
        const error = new Error(`NerdGraph request failed: HTTP ${response.status}`)
        if (attempt < maxAttempts && shouldRetryHttpStatus(response.status)) {
          const backoff = 250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 150)
          await sleep(backoff)
          lastError = error
          continue
        }
        throw error
      }

      const payload = await response.json()
      if (payload.errors?.length) {
        throw new Error(`NerdGraph error: ${payload.errors.map((e) => e.message).join(' | ')}`)
      }
      return payload.data
    } catch (error) {
      lastError = error
      if (attempt >= maxAttempts) break
      const backoff = 250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 150)
      await sleep(backoff)
    }
  }
  throw (lastError || new Error('NerdGraph request failed'))
}

const nrqlValue = async (query, key) => {
  const queryDoc = `
    query ReadNrql($accountId: Int!, $nrql: Nrql!) {
      actor {
        account(id: $accountId) {
          nrql(query: $nrql) {
            results
          }
        }
      }
    }
  `
  const data = await gql(queryDoc, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    nrql: query,
  })
  const rows = data.actor.account.nrql.results || []
  if (!rows.length) return 0
  const value = Number(rows[0][key] ?? 0)
  return Number.isFinite(value) ? value : 0
}

const nrqlRows = async (query) => {
  const queryDoc = `
    query ReadNrql($accountId: Int!, $nrql: Nrql!) {
      actor {
        account(id: $accountId) {
          nrql(query: $nrql) {
            results
          }
        }
      }
    }
  `
  const data = await gql(queryDoc, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    nrql: query,
  })
  return data.actor.account.nrql.results || []
}

const verifyTarget = async ({ envName, token, awsAccountId, awsMode }) => {
  const runtimeScope = buildEnvironmentFilter(envName)
  const scope = buildEnvScopeClause({
    envName,
    nameToken: token,
    awsAccountId,
    allowMissingAwsAccount: true,
  })
  const awsMetricScope = buildAwsIntegrationScopeClause({
    envName,
    nameToken: token,
    awsAccountId,
  })
  const apiGatewaySampleAccountScope = awsAccountId
    ? ` AND (aws.accountId = '${awsAccountId}' OR providerAccountName LIKE '%${awsAccountId}%')`
    : ''
  const since = `${WINDOW_MINUTES} minutes ago`
  const queuePrefix = `remit-scout-${envName}-`
  const requireAwsAccountPin = awsMode !== 'otlp_only'
  const requireApiGatewaySignals = requireApiGatewayMetrics && requireAwsAccountPin
  const requireSqsSignals = requireSqsMetrics && requireAwsAccountPin
  const customMetricFamilies = [
    {
      name: 'core_slo_indices',
      required: true,
      metricNames: [
        'slo_actual_value',
        'slo_compliance_ratio',
        'slo_breach_total',
        'indices_teer_rate',
        'indices_rci_ratio',
        'indices_rvi_bps',
        'oanda_sync_failures_total',
        'db_connection_pool_waiting',
        'worker_backpressure_active',
      ],
    },
    {
      name: 'workers',
      required: false,
      metricNames: ['message_failed', 'dlq_sent', 'lock_failed', 'envelope_parse_error', 'stale_dropped'],
    },
    {
      name: 'probes_collectors',
      required: false,
      metricNames: [
        'probe_result',
        'probe_run_total',
        'collector_block_count',
        'collector_avg_attempt_ms',
        'provider_collection_failure_by_provider_total',
        'provider_collection_success_by_provider_total',
      ],
    },
    {
      name: 'business',
      required: false,
      metricNames: [
        'telemetry_search_events_total',
        'telemetry_provider_visits_total',
        'telemetry_affiliate_click_events_total',
        'telemetry_affiliate_conversions_total',
        'telemetry_affiliate_conversion_value',
        'export_jobs_completed',
        'export_jobs_failed',
      ],
    },
    {
      name: 'agents',
      required: false,
      metricNames: [
        'detection_cycle_count',
        'failure_bundle_created',
        'repair_proposal_generated',
        'tool_request_total',
        'tool_request_blocked',
        'knowledge_retrieval_total',
        'knowledge_retrieval_insufficient',
        'stress_escalation_incident',
      ],
    },
  ]
  const familyCounts = {}
  for (const family of customMetricFamilies) {
    familyCounts[family.name] = await nrqlValue(
      `FROM Metric SELECT count(*) AS value ` +
        `WHERE ${buildMetricNamesFilter(family.metricNames)} AND ${runtimeScope} SINCE ${since}`,
      'value',
    )
  }
  const customMetricCount = Object.values(familyCounts).reduce((sum, count) => sum + Number(count || 0), 0)

  const checks = {
    metricCount: await nrqlValue(
      `FROM Metric SELECT count(*) AS value WHERE ${scope} SINCE ${since}`,
      'value',
    ),
    logCount: await nrqlValue(
      `FROM Log SELECT count(*) AS value WHERE ${scope} SINCE ${since}`,
      'value',
    ),
    spanCount: await nrqlValue(
      `FROM Span SELECT count(*) AS value WHERE ${scope} SINCE ${since}`,
      'value',
    ),
    apiGatewayMetricCount: requireApiGatewaySignals
      ? await nrqlValue(
          `FROM Metric SELECT count(*) AS value ` +
            `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${awsMetricScope} ` +
            `AND metricName IN ('aws.apigateway.Count', 'aws.apigateway.Latency.byStage', 'aws.apigateway.5xx') ` +
            `SINCE ${since}`,
          'value',
        )
      : 0,
    apiGatewaySampleCount: requireApiGatewaySignals
      ? await nrqlValue(
          `FROM ApiGatewaySample SELECT count(*) AS value WHERE (${scope} OR providerAccountName LIKE 'remit-scout-${envName}-%')${apiGatewaySampleAccountScope} SINCE ${since}`,
          'value',
        )
      : 0,
    sqsMetricCount: requireSqsSignals
      ? await nrqlValue(
          `FROM Metric SELECT count(*) AS value ` +
            `WHERE aws.Namespace = 'AWS/SQS' ` +
            `AND aws.sqs.QueueName LIKE '${queuePrefix}%' ` +
            `AND metricName LIKE 'aws.sqs.Approximate%' ` +
            `AND ${awsMetricScope} ` +
            `SINCE ${since}`,
          'value',
        )
      : 0,
    customMetricCount,
    customMetricFamilies: familyCounts,
  }

  const failures = []
  if (checks.metricCount <= 0) failures.push('metricCount')
  if (requireLogs && checks.logCount <= 0) failures.push('logCount')
  if (requireSpans && checks.spanCount <= 0) failures.push('spanCount')
  if (requireApiGatewaySignals && checks.apiGatewayMetricCount <= 0 && checks.apiGatewaySampleCount <= 0) {
    failures.push('apiGatewayMetricCount')
  }
  if (requireSqsSignals && checks.sqsMetricCount <= 0) failures.push('sqsMetricCount')
  if (requireCustomMetrics && checks.customMetricCount <= 0) failures.push('customMetricCount')
  if (requireCustomMetrics) {
    for (const family of customMetricFamilies) {
      if (family.required && Number(checks.customMetricFamilies[family.name] || 0) <= 0) {
        failures.push(`customMetricFamily:${family.name}`)
      }
    }
  }

  const diagnostics = {}
  if (failures.length > 0) {
    diagnostics.topNamespaces = await nrqlRows(
      `FROM Metric SELECT count(*) WHERE metricName IS NOT NULL AND ${scope} FACET aws.Namespace SINCE ${since} LIMIT 10`,
    )
    diagnostics.topEntities = await nrqlRows(
      `FROM Metric SELECT count(*) WHERE metricName IS NOT NULL AND ${scope} FACET entity.name SINCE ${since} LIMIT 15`,
    )
    diagnostics.tokenMetricCount = await nrqlValue(
      `FROM Metric SELECT count(*) AS value ` +
        `WHERE ${scope} ` +
        `AND (entity.name LIKE '%${token}%' ` +
        `OR aws.sqs.QueueName LIKE '${queuePrefix}%' ` +
        `OR aws.lambda.FunctionName LIKE '%${token}%' ` +
        `OR appName LIKE '%${token}%') ` +
        `SINCE ${since}`,
      'value',
    )
    diagnostics.customMetricFamilies = checks.customMetricFamilies
  }

  return {
    envName,
    awsMode,
    checks,
    failures,
    diagnostics,
  }
}

const main = async () => {
  const targets = [
    {
      envName: 'staging',
      token: 'remit-scout-staging',
      awsAccountId: NEW_RELIC_STAGING_AWS_ACCOUNT_ID,
      awsMode: NEW_RELIC_STAGING_AWS_MODE,
    },
    {
      envName: 'prod',
      token: 'remit-scout-prod',
      awsAccountId: NEW_RELIC_PROD_AWS_ACCOUNT_ID,
      awsMode: NEW_RELIC_PROD_AWS_MODE,
    },
  ].filter((target) => TARGET_ENV === 'all' || TARGET_ENV === target.envName)

  if (targets.length === 0) {
    throw new Error(`Unsupported NEW_RELIC_TARGET_ENV: ${TARGET_ENV}`)
  }

  if (requireAccountPinning) {
    const missingPins = targets
      .filter((target) => target.awsMode !== 'otlp_only' && !target.awsAccountId)
      .map((target) => target.envName)
    if (missingPins.length > 0) {
      throw new Error(
        `Missing pinned AWS account IDs for target env(s): ${missingPins.join(', ')}. ` +
          `Set NEW_RELIC_STAGING_AWS_ACCOUNT_ID and/or NEW_RELIC_PROD_AWS_ACCOUNT_ID.`,
      )
    }
  }

  const results = []
  for (const target of targets) {
    results.push(await verifyTarget(target))
  }

  console.log(JSON.stringify({ windowMinutes: WINDOW_MINUTES, results }, null, 2))

  const totalFailures = results.reduce((count, result) => count + result.failures.length, 0)
  if (totalFailures > 0) {
    console.error(`Signal readiness failed with ${totalFailures} missing signal group(s).`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})
