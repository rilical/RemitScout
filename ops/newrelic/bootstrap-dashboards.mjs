#!/usr/bin/env node

/**
 * Bootstraps Remit-Scout New Relic dashboards via NerdGraph.
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

const nrql = (query) => ({
  accountId: NEW_RELIC_ACCOUNT_ID,
  query,
})

const widgetBillboard = (title, query, row, column, width = 3, height = 3) => ({
  title,
  layout: { row, column, width, height },
  configuration: {
    billboard: {
      nrqlQueries: [nrql(query)],
    },
  },
})

const widgetLine = (title, query, row, column, width = 4, height = 3) => ({
  title,
  layout: { row, column, width, height },
  configuration: {
    line: {
      nrqlQueries: [nrql(query)],
    },
  },
})

const widgetTable = (title, query, row, column, width = 6, height = 4) => ({
  title,
  layout: { row, column, width, height },
  configuration: {
    table: {
      nrqlQueries: [nrql(query)],
    },
  },
})

const widgetMarkdown = (title, text, row, column, width = 12, height = 2) => ({
  title,
  layout: { row, column, width, height },
  configuration: {
    markdown: {
      text,
    },
  },
})

const envScopeClause = (nameToken, envName) =>
  `(
    environment = '${envName}'
    OR entity.name LIKE '%${nameToken}%'
    OR aws.lambda.FunctionName LIKE '%${nameToken}%'
    OR aws.sqs.QueueName LIKE '%${nameToken}%'
    OR aws.logs.Resource LIKE '%${nameToken}%'
    OR aws.arn LIKE '%${nameToken}%'
    OR aws.Arn LIKE '%${nameToken}%'
    OR appName LIKE '%${nameToken}%'
  )`

const buildDashboardInput = ({ environmentName, envName, nameToken }) => {
  const scope = envScopeClause(nameToken, envName)
  const queueNamePrefix = `remit-scout-${envName}-`
  const dashboardName = `Remit-Scout ${environmentName} Ops`

  return {
    name: dashboardName,
    description: `Remit-Scout ${environmentName} operational dashboard (API-managed).`,
    permissions: 'PRIVATE',
    pages: [
      {
        name: 'Incident Command',
        widgets: [
          widgetMarkdown(
            'Read Me First',
            `Source of truth dashboard for ${environmentName} incidents.\n` +
              `Use this page first for triage, then drill into API, queue, and provider pages.\n\n` +
              `This dashboard is managed by \`ops/newrelic/bootstrap-dashboards.mjs\`.`,
            1,
            1,
            12,
            2,
          ),
          widgetBillboard(
            `${environmentName} Metric Events (60m)`,
            `FROM Metric SELECT count(*) WHERE ${scope} SINCE 60 minutes ago`,
            3,
            1,
          ),
          widgetBillboard(
            `${environmentName} Log Events (60m)`,
            `FROM Log SELECT count(*) WHERE ${scope} SINCE 60 minutes ago`,
            3,
            4,
          ),
          widgetBillboard(
            `${environmentName} Span Events (60m)`,
            `FROM Span SELECT count(*) WHERE ${scope} SINCE 60 minutes ago`,
            3,
            7,
          ),
          widgetBillboard(
            'SLO Breaches (60m)',
            `FROM Metric SELECT sum(value) WHERE metricName = 'slo_breach_total' AND environment = '${envName}' SINCE 60 minutes ago`,
            3,
            10,
          ),
          widgetLine(
            'Deploy Gate Signals: API 5xx + p99',
            `FROM Metric SELECT ` +
              `filter(sum(value), WHERE metricName LIKE 'aws.apigateway.5XXError%') AS '5xx', ` +
              `percentile(value, 99) AS 'p99_ms' ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${scope} SINCE 6 hours ago TIMESERIES 10 minutes`,
            6,
            1,
            6,
            4,
          ),
          widgetLine(
            'DLQ Depth (All Remit-Scout DLQs)',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName LIKE 'aws.sqs.ApproximateNumberOfMessagesVisible%' ` +
              `AND aws.sqs.QueueName LIKE '${queueNamePrefix}%-dlq' ` +
              `SINCE 6 hours ago TIMESERIES 10 minutes`,
            6,
            7,
            6,
            4,
          ),
          widgetTable(
            'Top Conditions by Volume',
            `FROM Metric SELECT count(*) WHERE ${scope} FACET metricName SINCE 6 hours ago LIMIT 25`,
            10,
            1,
          ),
          widgetTable(
            'Top Entities by Signal Volume',
            `FROM Metric SELECT count(*) WHERE ${scope} FACET entity.name SINCE 6 hours ago LIMIT 25`,
            10,
            7,
          ),
        ],
      },
      {
        name: 'API Reliability',
        widgets: [
          widgetLine(
            'API Requests / 4xx / 5xx',
            `FROM Metric SELECT ` +
              `filter(sum(value), WHERE metricName LIKE 'aws.apigateway.Count%') AS 'requests', ` +
              `filter(sum(value), WHERE metricName LIKE 'aws.apigateway.4XXError%') AS '4xx', ` +
              `filter(sum(value), WHERE metricName LIKE 'aws.apigateway.5XXError%') AS '5xx' ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${scope} SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'API Latency p95/p99 (ms)',
            `FROM Metric SELECT percentile(value, 95, 99) ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' ` +
              `AND metricName LIKE 'aws.apigateway.Latency%' ` +
              `AND ${scope} SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'Cross-Plane Hop p95 (ms)',
            `FROM Metric SELECT percentile(value, 95) ` +
              `WHERE metricName = 'cross_plane_hop_duration_ms' ` +
              `AND environment = '${envName}' SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetLine(
            'Cross-Plane Error Amplification',
            `FROM Metric SELECT average(value) ` +
              `WHERE metricName = 'cross_plane_error_amplification' ` +
              `AND environment = '${envName}' SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            7,
            6,
            4,
          ),
          widgetTable(
            'API Metric Breakdown',
            `FROM Metric SELECT sum(value) ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${scope} ` +
              `FACET metricName SINCE 6 hours ago LIMIT 30`,
            9,
            1,
          ),
          widgetTable(
            'Top API Entities',
            `FROM Metric SELECT count(*) ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${scope} ` +
              `FACET entity.name SINCE 6 hours ago LIMIT 25`,
            9,
            7,
          ),
        ],
      },
      {
        name: 'Queue + Worker Health',
        widgets: [
          widgetLine(
            'Queue Depth (Visible Messages)',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName LIKE 'aws.sqs.ApproximateNumberOfMessagesVisible%' ` +
              `AND aws.sqs.QueueName LIKE '${queueNamePrefix}%' ` +
              `SINCE 6 hours ago FACET aws.sqs.QueueName TIMESERIES 10 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'Queue Age (Oldest Message, sec)',
            `FROM Metric SELECT max(value) ` +
              `WHERE metricName LIKE 'aws.sqs.ApproximateAgeOfOldestMessage%' ` +
              `AND aws.sqs.QueueName LIKE '${queueNamePrefix}%' ` +
              `SINCE 6 hours ago FACET aws.sqs.QueueName TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'DLQ Depth',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName LIKE 'aws.sqs.ApproximateNumberOfMessagesVisible%' ` +
              `AND aws.sqs.QueueName LIKE '${queueNamePrefix}%-dlq' ` +
              `SINCE 6 hours ago FACET aws.sqs.QueueName TIMESERIES 10 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetLine(
            'Worker Failures / DLQ Sends / Lock Failures',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName IN ('message_failed', 'dlq_sent', 'lock_failed', 'envelope_parse_error', 'stale_dropped') ` +
              `AND environment = '${envName}' FACET metricName SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            7,
            6,
            4,
          ),
          widgetLine(
            'Backpressure Active',
            `FROM Metric SELECT max(value) ` +
              `WHERE metricName = 'worker_backpressure_active' ` +
              `AND environment = '${envName}' FACET worker SINCE 6 hours ago TIMESERIES 10 minutes`,
            9,
            1,
            6,
            4,
          ),
          widgetTable(
            'Queue Signal Inventory',
            `FROM Metric SELECT count(*) WHERE aws.sqs.QueueName LIKE '${queueNamePrefix}%' FACET metricName SINCE 6 hours ago LIMIT 50`,
            9,
            7,
          ),
        ],
      },
      {
        name: 'Data Freshness + Indices',
        widgets: [
          widgetLine(
            'SLO Actual Values',
            `FROM Metric SELECT latest(value) ` +
              `WHERE metricName = 'slo_actual_value' ` +
              `AND environment = '${envName}' FACET slo_name SINCE 6 hours ago TIMESERIES 15 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'SLO Compliance Ratios',
            `FROM Metric SELECT latest(value) ` +
              `WHERE metricName = 'slo_compliance_ratio' ` +
              `AND environment = '${envName}' FACET slo_name SINCE 6 hours ago TIMESERIES 15 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'Indices Availability / Suppression / Confidence',
            `FROM Metric SELECT latest(value) ` +
              `WHERE metricName = 'slo_actual_value' ` +
              `AND environment = '${envName}' ` +
              `AND slo_name IN ('indices_available_ratio', 'indices_suppressed_ratio', 'weight_confidence_p10') ` +
              `FACET slo_name SINCE 6 hours ago TIMESERIES 15 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetLine(
            'Gold-Live Queue Age',
            `FROM Metric SELECT max(value) ` +
              `WHERE metricName LIKE 'aws.sqs.ApproximateAgeOfOldestMessage%' ` +
              `AND aws.sqs.QueueName LIKE '${queueNamePrefix}gold-live%' ` +
              `SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            7,
            6,
            4,
          ),
          widgetLine(
            'OANDA Sync Failures',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName = 'oanda_sync_failures_total' ` +
              `AND environment = '${envName}' SINCE 24 hours ago TIMESERIES 30 minutes`,
            9,
            1,
            6,
            4,
          ),
          widgetTable(
            'Freshness Metrics by Name',
            `FROM Metric SELECT latest(value) ` +
              `WHERE metricName = 'slo_actual_value' AND environment = '${envName}' ` +
              `FACET slo_name, time_window SINCE 6 hours ago LIMIT 50`,
            9,
            7,
          ),
        ],
      },
      {
        name: 'Provider Reliability',
        widgets: [
          widgetLine(
            'Probe Failures by Provider',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName = 'probe_result' ` +
              `AND Status = 'failure' AND environment = '${envName}' ` +
              `FACET ProviderId SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'Probe Heartbeat (runs)',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName = 'probe_run_total' AND environment = '${envName}' ` +
              `FACET ProviderId SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'Provider Collection Failures',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName = 'provider_collection_failure_by_provider_total' ` +
              `AND environment = '${envName}' FACET provider_id ` +
              `SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetLine(
            'Provider Collection Successes',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName = 'provider_collection_success_by_provider_total' ` +
              `AND environment = '${envName}' FACET provider_id ` +
              `SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            7,
            6,
            4,
          ),
          widgetLine(
            'Collector Blocks / Attempt Latency',
            `FROM Metric SELECT average(value) ` +
              `WHERE metricName IN ('collector_block_count', 'collector_avg_attempt_ms') ` +
              `AND environment = '${envName}' FACET metricName, ProviderId ` +
              `SINCE 6 hours ago TIMESERIES 10 minutes`,
            9,
            1,
            6,
            4,
          ),
          widgetTable(
            'Provider Signal Inventory',
            `FROM Metric SELECT count(*) WHERE environment = '${envName}' ` +
              `AND (ProviderId IS NOT NULL OR provider_id IS NOT NULL) ` +
              `FACET metricName SINCE 6 hours ago LIMIT 50`,
            9,
            7,
          ),
        ],
      },
      {
        name: 'Business Growth + Revenue',
        widgets: [
          widgetBillboard(
            'Search Events (24h)',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName = 'telemetry_search_events_total' ` +
              `AND environment = '${envName}' SINCE 24 hours ago`,
            1,
            1,
          ),
          widgetBillboard(
            'Provider Visits (24h)',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName = 'telemetry_provider_visits_total' ` +
              `AND environment = '${envName}' SINCE 24 hours ago`,
            1,
            4,
          ),
          widgetBillboard(
            'Affiliate Clicks (24h)',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName = 'telemetry_affiliate_click_events_total' ` +
              `AND environment = '${envName}' SINCE 24 hours ago`,
            1,
            7,
          ),
          widgetBillboard(
            'Affiliate Conversions (24h)',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName = 'telemetry_affiliate_conversions_total' ` +
              `AND environment = '${envName}' SINCE 24 hours ago`,
            1,
            10,
          ),
          widgetLine(
            'Sessions / Searches / Clicks / Conversions',
            `FROM Metric SELECT ` +
              `filter(sum(value), WHERE metricName = 'telemetry_sessions_started_total') AS 'sessions', ` +
              `filter(sum(value), WHERE metricName = 'telemetry_search_events_total') AS 'searches', ` +
              `filter(sum(value), WHERE metricName = 'telemetry_click_events_total') AS 'clicks', ` +
              `filter(sum(value), WHERE metricName = 'telemetry_affiliate_conversions_total') AS 'conversions' ` +
              `WHERE environment = '${envName}' SINCE 24 hours ago TIMESERIES 30 minutes`,
            4,
            1,
            6,
            4,
          ),
          widgetLine(
            'Affiliate Conversion Value (Money Made Proxy)',
            `FROM Metric SELECT sum(value) ` +
              `WHERE metricName = 'telemetry_affiliate_conversion_value' ` +
              `AND environment = '${envName}' ` +
              `FACET conversion_currency SINCE 24 hours ago TIMESERIES 30 minutes`,
            4,
            7,
            6,
            4,
          ),
          widgetTable(
            'Top Providers by Clicks (24h)',
            `FROM Metric SELECT sum(value) AS clicks ` +
              `WHERE metricName = 'telemetry_click_events_total' ` +
              `AND environment = '${envName}' ` +
              `FACET provider_id SINCE 24 hours ago LIMIT 25`,
            8,
            1,
          ),
          widgetTable(
            'Top Providers by Conversion Value (24h)',
            `FROM Metric SELECT sum(value) AS conversion_value ` +
              `WHERE metricName = 'telemetry_affiliate_conversion_value' ` +
              `AND environment = '${envName}' ` +
              `FACET provider_id, conversion_currency SINCE 24 hours ago LIMIT 25`,
            8,
            7,
          ),
          widgetTable(
            'Acquisition Sources (Sessions, 24h)',
            `FROM Metric SELECT sum(value) AS sessions ` +
              `WHERE metricName = 'telemetry_sessions_started_total' ` +
              `AND environment = '${envName}' ` +
              `FACET acquisition_source SINCE 24 hours ago LIMIT 20`,
            12,
            1,
          ),
          widgetTable(
            'Browser Traffic: Top Pages (24h)',
            `FROM PageView SELECT count(*) ` +
              `WHERE appName LIKE '%remit-scout%' ` +
              `FACET pageUrl SINCE 24 hours ago LIMIT 25`,
            12,
            7,
          ),
          widgetLine(
            'Analytics API Throughput (Spans)',
            `FROM Span SELECT count(*) ` +
              `WHERE name LIKE 'HTTP % /api/v1/analytics/%' ` +
              `AND ${scope} SINCE 24 hours ago TIMESERIES 30 minutes`,
            16,
            1,
            6,
            4,
          ),
          widgetLine(
            'Telemetry API Throughput (Spans)',
            `FROM Span SELECT count(*) ` +
              `WHERE name LIKE 'HTTP % /api/v1/telemetry/%' ` +
              `AND ${scope} SINCE 24 hours ago TIMESERIES 30 minutes`,
            16,
            7,
            6,
            4,
          ),
        ],
      },
      {
        name: 'Platform Capacity',
        widgets: [
          widgetLine(
            'Aurora: CPU + Connections',
            `FROM Metric SELECT average(value) ` +
              `WHERE aws.Namespace = 'AWS/RDS' ` +
              `AND metricName IN ('aws.rds.CPUUtilization', 'aws.rds.DatabaseConnections') ` +
              `AND ${scope} FACET metricName SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'Aurora: Memory / Disk Queue / Replica Lag',
            `FROM Metric SELECT average(value) ` +
              `WHERE aws.Namespace = 'AWS/RDS' ` +
              `AND metricName IN ('aws.rds.FreeableMemory', 'aws.rds.DiskQueueDepth', 'aws.rds.AuroraReplicaLagMaximum') ` +
              `AND ${scope} FACET metricName SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'Redis: Connections + Engine CPU',
            `FROM Metric SELECT average(value) ` +
              `WHERE aws.Namespace = 'AWS/ElastiCache' ` +
              `AND metricName IN ('aws.elasticache.CurrConnections', 'aws.elasticache.MaxConnections', 'aws.elasticache.EngineCPUUtilization') ` +
              `AND ${scope} FACET metricName SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetLine(
            'ECS: CPU / Memory / RestartCount',
            `FROM Metric SELECT average(value) ` +
              `WHERE aws.Namespace IN ('AWS/ECS', 'ECS/ContainerInsights') ` +
              `AND (metricName LIKE '%CPU%' OR metricName LIKE '%Memory%' OR metricName LIKE '%RestartCount%') ` +
              `AND ${scope} FACET metricName SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            7,
            6,
            4,
          ),
          widgetLine(
            'DB Pool Waiting',
            `FROM Metric SELECT max(value) ` +
              `WHERE metricName = 'db_connection_pool_waiting' AND environment = '${envName}' ` +
              `FACET pool_name SINCE 6 hours ago TIMESERIES 10 minutes`,
            9,
            1,
            6,
            4,
          ),
          widgetTable(
            'Top Infra Metric Names',
            `FROM Metric SELECT count(*) WHERE ${scope} FACET aws.Namespace, metricName SINCE 6 hours ago LIMIT 50`,
            9,
            7,
          ),
        ],
      },
    ],
  }
}

const findDashboardGuidByName = async (name) => {
  const query = `
    query FindDashboard($query: String!) {
      actor {
        entitySearch(query: $query) {
          results {
            entities {
              guid
              name
              type
            }
          }
        }
      }
    }
  `

  const searchQuery = `type = 'DASHBOARD' AND name = '${name}'`
  const data = await gql(query, { query: searchQuery })
  const entities = data.actor.entitySearch.results.entities || []
  const dashboard = entities.find((entity) => entity.name === name)
  return dashboard?.guid || null
}

const createDashboard = async (dashboard) => {
  const mutation = `
    mutation CreateDashboard($accountId: Int!, $dashboard: DashboardInput!) {
      dashboardCreate(accountId: $accountId, dashboard: $dashboard) {
        entityResult {
          guid
          name
          updatedAt
        }
        errors {
          description
          type
        }
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    dashboard,
  })

  const result = data.dashboardCreate
  if (result.errors?.length) {
    throw new Error(
      `dashboardCreate errors: ${result.errors.map((e) => e.description || e.type).join(' | ')}`,
    )
  }
  return result.entityResult.guid
}

const updateDashboard = async (guid, dashboard) => {
  const mutation = `
    mutation UpdateDashboard($guid: EntityGuid!, $dashboard: DashboardInput!) {
      dashboardUpdate(guid: $guid, dashboard: $dashboard) {
        entityResult {
          guid
          name
          updatedAt
        }
        errors {
          description
          type
        }
      }
    }
  `

  const data = await gql(mutation, { guid, dashboard })
  const result = data.dashboardUpdate
  if (result.errors?.length) {
    throw new Error(
      `dashboardUpdate errors: ${result.errors.map((e) => e.description || e.type).join(' | ')}`,
    )
  }
  return result.entityResult.guid
}

const getDashboardPermalink = async (guid) => {
  const query = `
    query DashboardPermalink($guid: EntityGuid!) {
      actor {
        entity(guid: $guid) {
          ... on DashboardEntity {
            guid
            name
            permalink
          }
        }
      }
    }
  `
  const data = await gql(query, { guid })
  return data.actor.entity?.permalink || ''
}

const upsertDashboard = async (dashboardInput) => {
  const existingGuid = await findDashboardGuidByName(dashboardInput.name)
  const guid = existingGuid
    ? await updateDashboard(existingGuid, dashboardInput)
    : await createDashboard(dashboardInput)
  const permalink = await getDashboardPermalink(guid)
  return { name: dashboardInput.name, guid, permalink, mode: existingGuid ? 'updated' : 'created' }
}

const main = async () => {
  const targets = [
    { environmentName: 'Staging', envName: 'staging', nameToken: 'remit-scout-staging' },
    { environmentName: 'Production', envName: 'prod', nameToken: 'remit-scout-prod' },
  ]

  const results = []
  for (const target of targets) {
    const dashboardInput = buildDashboardInput(target)
    const result = await upsertDashboard(dashboardInput)
    results.push(result)
  }

  for (const result of results) {
    console.log(`${result.mode.toUpperCase()}: ${result.name}`)
    console.log(`  guid: ${result.guid}`)
    console.log(`  url: ${result.permalink}`)
  }
}

main().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})
