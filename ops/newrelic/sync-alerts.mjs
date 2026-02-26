#!/usr/bin/env node

/**
 * Mirrors critical CloudWatch gates into New Relic NRQL alert conditions.
 *
 * Required env:
 * - NEW_RELIC_USER_API_KEY
 * - NEW_RELIC_ACCOUNT_ID
 * Optional env:
 * - NEW_RELIC_REGION (US|EU, default US)
 */

const NEW_RELIC_USER_API_KEY = process.env.NEW_RELIC_USER_API_KEY || ''
const NEW_RELIC_ACCOUNT_ID = Number.parseInt(process.env.NEW_RELIC_ACCOUNT_ID || '', 10)
const NEW_RELIC_REGION = (process.env.NEW_RELIC_REGION || 'US').trim().toUpperCase()

if (!NEW_RELIC_USER_API_KEY) {
  console.error('Missing NEW_RELIC_USER_API_KEY')
  process.exit(1)
}

if (!Number.isFinite(NEW_RELIC_ACCOUNT_ID)) {
  console.error('Missing/invalid NEW_RELIC_ACCOUNT_ID')
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

const findPolicyByName = async (name) => {
  const query = `
    query PolicyByName($accountId: Int!, $name: String!) {
      actor {
        account(id: $accountId) {
          alerts {
            policiesSearch(searchCriteria: { name: $name }) {
              policies {
                id
                name
                incidentPreference
              }
            }
          }
        }
      }
    }
  `

  const data = await gql(query, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    name,
  })

  const policies = data.actor.account.alerts.policiesSearch.policies || []
  return policies.find((policy) => policy.name === name) || null
}

const createPolicy = async (name) => {
  const mutation = `
    mutation CreatePolicy($accountId: Int!, $policy: AlertsPolicyInput!) {
      alertsPolicyCreate(accountId: $accountId, policy: $policy) {
        id
        name
        incidentPreference
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    policy: {
      name,
      incidentPreference: 'PER_POLICY',
    },
  })

  return data.alertsPolicyCreate
}

const ensurePolicy = async (name) => {
  const existing = await findPolicyByName(name)
  if (existing) {
    return { ...existing, mode: 'existing' }
  }
  const created = await createPolicy(name)
  return { ...created, mode: 'created' }
}

const findStaticCondition = async (policyId, name) => {
  const query = `
    query FindStaticCondition($accountId: Int!, $policyId: ID!, $name: String!) {
      actor {
        account(id: $accountId) {
          alerts {
            nrqlConditionsSearch(searchCriteria: { policyId: $policyId, name: $name }) {
              nrqlConditions {
                id
                name
                ... on AlertsNrqlStaticCondition {
                  enabled
                  nrql {
                    query
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  const data = await gql(query, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    policyId,
    name,
  })

  const conditions = data.actor.account.alerts.nrqlConditionsSearch.nrqlConditions || []
  return conditions.find((condition) => condition.name === name) || null
}

const createStaticCondition = async (policyId, condition) => {
  const mutation = `
    mutation CreateStaticCondition(
      $accountId: Int!
      $policyId: ID!
      $condition: AlertsNrqlConditionStaticInput!
    ) {
      alertsNrqlConditionStaticCreate(
        accountId: $accountId
        policyId: $policyId
        condition: $condition
      ) {
        id
        name
        enabled
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    policyId,
    condition,
  })
  return data.alertsNrqlConditionStaticCreate
}

const updateStaticCondition = async (id, condition) => {
  const mutation = `
    mutation UpdateStaticCondition(
      $accountId: Int!
      $id: ID!
      $condition: AlertsNrqlConditionUpdateStaticInput!
    ) {
      alertsNrqlConditionStaticUpdate(accountId: $accountId, id: $id, condition: $condition) {
        id
        name
        enabled
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    id,
    condition,
  })
  return data.alertsNrqlConditionStaticUpdate
}

const toConditionInput = (definition) => ({
  name: definition.name,
  description: definition.description,
  enabled: true,
  nrql: {
    query: definition.query,
  },
  runbookUrl: definition.runbookUrl,
  terms: [
    {
      priority: 'CRITICAL',
      operator: definition.operator,
      threshold: definition.threshold,
      thresholdDuration: definition.thresholdDuration,
      thresholdOccurrences: definition.thresholdOccurrences,
    },
  ],
  violationTimeLimitSeconds: 86400,
})

const toConditionUpdateInput = (definition) => ({
  name: definition.name,
  description: definition.description,
  enabled: true,
  nrql: {
    query: definition.query,
  },
  runbookUrl: definition.runbookUrl,
  terms: [
    {
      priority: 'CRITICAL',
      operator: definition.operator,
      threshold: definition.threshold,
      thresholdDuration: definition.thresholdDuration,
      thresholdOccurrences: definition.thresholdOccurrences,
    },
  ],
  violationTimeLimitSeconds: 86400,
})

const scopeClause = (token, envName) =>
  `(
    environment = '${envName}'
    OR entity.name LIKE '%${token}%'
    OR aws.lambda.FunctionName LIKE '%${token}%'
    OR aws.sqs.QueueName LIKE '%${token}%'
    OR aws.logs.Resource LIKE '%${token}%'
    OR appName LIKE '%${token}%'
  )`

const metricNameFilter = (name) =>
  `(metricName = '${name}' OR metricName = 'aws.remitscout.${name}')`

const buildConditionDefinitions = ({ envName, envLabel, token }) => {
  const scope = scopeClause(token, envName)
  const queueNamePrefix = `remit-scout-${envName}-`
  const runtimeEnvironmentFilter =
    envName === 'prod'
      ? `(environment = 'prod' OR environment = 'production')`
      : `environment = '${envName}'`
  const apiErrorThreshold = envName === 'prod' ? 0.02 : 0.05
  const probeFailureBurstThreshold = envName === 'prod' ? 3 : 5
  const runbookBase =
    process.env.NEW_RELIC_RUNBOOK_BASE_URL ||
    'https://github.com/rilical/Remit-Scout-V2/blob/main/docs/runbooks'

  return [
    {
      name: `[${envLabel}] api-error-rate-high (mirror)`,
      description: 'Mirror of CloudWatch gate: remit-scout-<env>-api-error-rate-high',
      query:
        `FROM Metric SELECT ` +
        `filter(sum(value), WHERE metricName LIKE 'aws.apigateway.5XXError%') ` +
        `/ filter(sum(value), WHERE metricName LIKE 'aws.apigateway.Count%') ` +
        `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${scope}`,
      operator: 'ABOVE',
      threshold: apiErrorThreshold,
      thresholdDuration: 600,
      thresholdOccurrences: 'AT_LEAST_ONCE',
      runbookUrl: `${runbookBase}/indices-readiness.md`,
    },
    {
      name: `[${envLabel}] api-p99-latency-high (mirror)`,
      description: 'Mirror of CloudWatch gate: remit-scout-<env>-api-p99-latency-high',
      query:
        `FROM Metric SELECT percentile(value, 99) ` +
        `WHERE aws.Namespace = 'AWS/ApiGateway' ` +
        `AND metricName LIKE 'aws.apigateway.Latency%' ` +
        `AND ${scope}`,
      operator: 'ABOVE',
      threshold: 5000,
      thresholdDuration: 900,
      thresholdOccurrences: 'AT_LEAST_ONCE',
      runbookUrl: `${runbookBase}/indices-readiness.md`,
    },
    {
      name: `[${envLabel}] dlq-depth-high (mirror)`,
      description: 'Mirror of DLQ depth critical signal (>=1)',
      query:
        `FROM Metric SELECT sum(value) ` +
        `WHERE metricName LIKE 'aws.sqs.ApproximateNumberOfMessagesVisible%' ` +
        `AND aws.sqs.QueueName LIKE '${queueNamePrefix}%-dlq'`,
      operator: 'ABOVE_OR_EQUALS',
      threshold: 1,
      thresholdDuration: 300,
      thresholdOccurrences: 'AT_LEAST_ONCE',
      runbookUrl: `${runbookBase}/dev-pause-resume.md`,
    },
    {
      name: `[${envLabel}] slo-breach-total (mirror)`,
      description: 'Mirror of SLO breach metric signal',
      query:
        `FROM Metric SELECT sum(value) ` +
        `WHERE ${metricNameFilter('slo_breach_total')} ` +
        `AND ${runtimeEnvironmentFilter}`,
      operator: 'ABOVE_OR_EQUALS',
      threshold: 1,
      thresholdDuration: 300,
      thresholdOccurrences: 'AT_LEAST_ONCE',
      runbookUrl: `${runbookBase}/freshness-slo.md`,
    },
    {
      name: `[${envLabel}] provider-probe-failures-high (mirror)`,
      description: 'Mirror of provider probe failure burst alarm',
      query:
        `FROM Metric SELECT sum(value) ` +
        `WHERE ${metricNameFilter('probe_result')} ` +
        `AND Status = 'failure' AND ${runtimeEnvironmentFilter}`,
      operator: 'ABOVE_OR_EQUALS',
      threshold: probeFailureBurstThreshold,
      thresholdDuration: 300,
      thresholdOccurrences: 'AT_LEAST_ONCE',
      runbookUrl: `${runbookBase}/provider-outage.md`,
    },
  ]
}

const upsertCondition = async (policyId, definition) => {
  const existing = await findStaticCondition(policyId, definition.name)
  if (existing) {
    const updated = await updateStaticCondition(
      existing.id,
      toConditionUpdateInput(definition),
    )
    return { mode: 'updated', id: updated.id, name: updated.name }
  }

  const created = await createStaticCondition(policyId, toConditionInput(definition))
  return { mode: 'created', id: created.id, name: created.name }
}

const main = async () => {
  const targets = [
    { envName: 'staging', envLabel: 'STAGING', token: 'remit-scout-staging' },
    { envName: 'prod', envLabel: 'PROD', token: 'remit-scout-prod' },
  ]

  for (const target of targets) {
    const policyName = `Remit-Scout ${target.envLabel} CloudWatch Mirror`
    const policy = await ensurePolicy(policyName)
    console.log(`${policy.mode.toUpperCase()}: policy ${policy.name} (${policy.id})`)

    const definitions = buildConditionDefinitions(target)
    for (const definition of definitions) {
      const result = await upsertCondition(policy.id, definition)
      console.log(`  ${result.mode.toUpperCase()}: ${result.name} (${result.id})`)
    }
  }
}

main().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})
