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
 * - REQUIRE_LOGS (0|1, default 1)
 * - REQUIRE_SPANS (0|1, default 1)
 * - REQUIRE_API_GW_METRICS (0|1, default 1)
 * - REQUIRE_SQS_METRICS (0|1, default 1)
 * - REQUIRE_CUSTOM_METRICS (0|1, default 1)
 */

const NEW_RELIC_USER_API_KEY = process.env.NEW_RELIC_USER_API_KEY || ''
const NEW_RELIC_ACCOUNT_ID = Number.parseInt(process.env.NEW_RELIC_ACCOUNT_ID || '', 10)
const NEW_RELIC_REGION = (process.env.NEW_RELIC_REGION || 'US').trim().toUpperCase()
const TARGET_ENV = (process.env.NEW_RELIC_TARGET_ENV || 'all').trim().toLowerCase()
const WINDOW_MINUTES = Number.parseInt(process.env.NEW_RELIC_WINDOW_MINUTES || '60', 10)

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

const gql = async (query, variables = {}) => {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-Key': NEW_RELIC_USER_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`NerdGraph request failed: HTTP ${response.status}`)
  }

  const payload = await response.json()
  if (payload.errors?.length) {
    throw new Error(`NerdGraph error: ${payload.errors.map((e) => e.message).join(' | ')}`)
  }
  return payload.data
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

const scopeClause = (token, envName, awsAccountId) => {
  const environmentFilter =
    envName === 'prod'
      ? `(environment = 'prod' OR environment = 'production')`
      : `environment = '${envName}'`

  return `(
    ${environmentFilter}
    OR entity.name LIKE '%${token}%'
    OR aws.lambda.FunctionName LIKE '%${token}%'
    OR aws.sqs.QueueName LIKE '%${token}%'
    OR aws.logs.Resource LIKE '%${token}%'
    OR appName LIKE '%${token}%'
    ${awsAccountId ? `OR aws.accountId = '${awsAccountId}'` : ''}
  )`
}

const verifyTarget = async ({ envName, token, awsAccountId }) => {
  const scope = scopeClause(token, envName, awsAccountId)
  const since = `${WINDOW_MINUTES} minutes ago`
  const queuePrefix = `remit-scout-${envName}-`

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
    apiGatewayMetricCount: await nrqlValue(
      `FROM Metric SELECT count(*) AS value WHERE aws.Namespace = 'AWS/ApiGateway' AND ${scope} SINCE ${since}`,
      'value',
    ),
    apiGatewaySampleCount: await nrqlValue(
      `FROM ApiGatewaySample SELECT count(*) AS value WHERE (${scope} OR providerAccountName LIKE 'remit-scout-${envName}-%') SINCE ${since}`,
      'value',
    ),
    sqsMetricCount: await nrqlValue(
      `FROM Metric SELECT count(*) AS value WHERE aws.Namespace = 'AWS/SQS' AND aws.sqs.QueueName LIKE '${queuePrefix}%' SINCE ${since}`,
      'value',
    ),
    customMetricCount: await nrqlValue(
      `FROM Metric SELECT count(*) AS value ` +
        `WHERE metricName IN (` +
        `'slo_actual_value','slo_compliance_ratio','slo_breach_total','worker_backpressure_active','cross_plane_hop_duration_ms',` +
        `'aws.remitscout.slo_actual_value','aws.remitscout.slo_compliance_ratio','aws.remitscout.slo_breach_total','aws.remitscout.worker_backpressure_active','aws.remitscout.cross_plane_hop_duration_ms'` +
        `) AND ${scope} SINCE ${since}`,
      'value',
    ),
  }

  const failures = []
  if (checks.metricCount <= 0) failures.push('metricCount')
  if (requireLogs && checks.logCount <= 0) failures.push('logCount')
  if (requireSpans && checks.spanCount <= 0) failures.push('spanCount')
  if (requireApiGatewayMetrics && checks.apiGatewayMetricCount <= 0 && checks.apiGatewaySampleCount <= 0) {
    failures.push('apiGatewayMetricCount')
  }
  if (requireSqsMetrics && checks.sqsMetricCount <= 0) failures.push('sqsMetricCount')
  if (requireCustomMetrics && checks.customMetricCount <= 0) failures.push('customMetricCount')

  const diagnostics = {}
  if (failures.length > 0) {
    diagnostics.topNamespaces = await nrqlRows(
      `FROM Metric SELECT count(*) WHERE metricName IS NOT NULL FACET aws.Namespace SINCE ${since} LIMIT 10`,
    )
    diagnostics.topEntities = await nrqlRows(
      `FROM Metric SELECT count(*) WHERE metricName IS NOT NULL FACET entity.name SINCE ${since} LIMIT 15`,
    )
    diagnostics.tokenMetricCount = await nrqlValue(
      `FROM Metric SELECT count(*) AS value ` +
        `WHERE entity.name LIKE '%${token}%' ` +
        `OR aws.sqs.QueueName LIKE '${queuePrefix}%' ` +
        `OR aws.lambda.FunctionName LIKE '%${token}%' ` +
        `OR appName LIKE '%${token}%' ` +
        `SINCE ${since}`,
      'value',
    )
  }

  return {
    envName,
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
      awsAccountId: process.env.NEW_RELIC_STAGING_AWS_ACCOUNT_ID || '',
    },
    {
      envName: 'prod',
      token: 'remit-scout-prod',
      awsAccountId: process.env.NEW_RELIC_PROD_AWS_ACCOUNT_ID || '',
    },
  ].filter((target) => TARGET_ENV === 'all' || TARGET_ENV === target.envName)

  if (targets.length === 0) {
    throw new Error(`Unsupported NEW_RELIC_TARGET_ENV: ${TARGET_ENV}`)
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
