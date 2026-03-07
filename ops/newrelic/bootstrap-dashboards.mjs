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

import {
  buildAwsIntegrationScopeClause,
  buildAwsSummaryFilterSelect,
  buildEnvScopeClause,
  buildEnvironmentFilter,
  buildMetricNameFilter,
  buildMetricNamesFilter,
  buildNamedMetricFilterSelect,
  buildNamedMetricSelect,
} from './nrql-helpers.mjs'

const NEW_RELIC_USER_API_KEY = process.env.NEW_RELIC_USER_API_KEY || ''
const NEW_RELIC_ACCOUNT_ID = Number.parseInt(process.env.NEW_RELIC_ACCOUNT_ID || '', 10)
const NEW_RELIC_REGION = (process.env.NEW_RELIC_REGION || 'US').trim().toUpperCase()
const NEW_RELIC_STAGING_AWS_ACCOUNT_ID = (process.env.NEW_RELIC_STAGING_AWS_ACCOUNT_ID || '').trim()
const NEW_RELIC_PROD_AWS_ACCOUNT_ID = (process.env.NEW_RELIC_PROD_AWS_ACCOUNT_ID || '').trim()

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

const buildDashboardInput = ({ environmentName, envName, nameToken, awsAccountId }) => {
  const scope = buildEnvScopeClause({
    envName,
    nameToken,
    awsAccountId,
    allowMissingAwsAccount: true,
  })
  const awsScope = buildAwsIntegrationScopeClause({
    envName,
    nameToken,
    awsAccountId,
  })
  const runtimeEnvironmentFilter = buildEnvironmentFilter(envName)
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
            `FROM Metric SELECT ${buildNamedMetricSelect('slo_breach_total')} ` +
              `WHERE ${buildMetricNameFilter('slo_breach_total')} AND ${runtimeEnvironmentFilter} ` +
              `SINCE 60 minutes ago`,
            3,
            10,
          ),
          widgetLine(
            'Deploy Gate Signals: API 5xx + p99',
            `FROM Metric SELECT ` +
              `${buildAwsSummaryFilterSelect('aws.apigateway.5xx', 'total', 'sum', '5xx')}, ` +
              `percentile(getField(\`aws.apigateway.Latency.byStage\`, max), 99) AS 'p99_ms' ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${awsScope} SINCE 6 hours ago TIMESERIES 10 minutes`,
            6,
            1,
            6,
            4,
          ),
          widgetLine(
            'DLQ Depth (All Remit-Scout DLQs)',
            `FROM Metric SELECT max(getField(\`aws.sqs.ApproximateNumberOfMessagesVisible\`, max)) ` +
              `WHERE metricName = 'aws.sqs.ApproximateNumberOfMessagesVisible' ` +
              `AND aws.sqs.QueueName LIKE '${queueNamePrefix}%-dlq' ` +
              `AND ${awsScope} ` +
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
              `${buildAwsSummaryFilterSelect('aws.apigateway.Count', 'total', 'sum', 'requests')}, ` +
              `${buildAwsSummaryFilterSelect('aws.apigateway.4xx', 'total', 'sum', '4xx')}, ` +
              `${buildAwsSummaryFilterSelect('aws.apigateway.5xx', 'total', 'sum', '5xx')} ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${awsScope} SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'API Latency p95/p99 (ms)',
            `FROM Metric SELECT percentile(getField(\`aws.apigateway.Latency.byStage\`, max), 95, 99) ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' ` +
              `AND metricName = 'aws.apigateway.Latency.byStage' ` +
              `AND ${awsScope} SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetMarkdown(
            'Cross-Plane Hop (Not Instrumented)',
            'Cross-plane hop custom metric is not currently emitted in this profile. Use API Gateway and Span widgets for triage.',
            5,
            1,
            6,
            2,
          ),
          widgetMarkdown(
            'Cross-Plane Error Amplification (Not Instrumented)',
            'Cross-plane amplification custom metric is not currently emitted in this profile. Treat this as explicit coverage gap.',
            5,
            7,
            6,
            2,
          ),
          widgetTable(
            'API Metric Breakdown',
            `FROM Metric SELECT count(*) ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${awsScope} ` +
              `FACET metricName SINCE 6 hours ago LIMIT 30`,
            9,
            1,
          ),
          widgetTable(
            'Top API Entities',
            `FROM Metric SELECT count(*) ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${awsScope} ` +
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
            `FROM Metric SELECT max(getField(\`aws.sqs.ApproximateNumberOfMessagesVisible\`, max)) ` +
              `WHERE metricName = 'aws.sqs.ApproximateNumberOfMessagesVisible' ` +
              `AND aws.sqs.QueueName LIKE '${queueNamePrefix}%' ` +
              `AND ${awsScope} ` +
              `SINCE 6 hours ago FACET aws.sqs.QueueName TIMESERIES 10 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'Queue Age (Oldest Message, sec)',
            `FROM Metric SELECT max(getField(\`aws.sqs.ApproximateAgeOfOldestMessage\`, max)) ` +
              `WHERE metricName = 'aws.sqs.ApproximateAgeOfOldestMessage' ` +
              `AND aws.sqs.QueueName LIKE '${queueNamePrefix}%' ` +
              `AND ${awsScope} ` +
              `SINCE 6 hours ago FACET aws.sqs.QueueName TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'DLQ Depth',
            `FROM Metric SELECT max(getField(\`aws.sqs.ApproximateNumberOfMessagesVisible\`, max)) ` +
              `WHERE metricName = 'aws.sqs.ApproximateNumberOfMessagesVisible' ` +
              `AND aws.sqs.QueueName LIKE '${queueNamePrefix}%-dlq' ` +
              `AND ${awsScope} ` +
              `SINCE 6 hours ago FACET aws.sqs.QueueName TIMESERIES 10 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetLine(
            'Worker Failures / DLQ Sends / Lock Failures',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('message_failed', 'sum', 'message_failed')}, ` +
              `${buildNamedMetricFilterSelect('dlq_sent', 'sum', 'dlq_sent')}, ` +
              `${buildNamedMetricFilterSelect('lock_failed', 'sum', 'lock_failed')}, ` +
              `${buildNamedMetricFilterSelect('envelope_parse_error', 'sum', 'envelope_parse_error')}, ` +
              `${buildNamedMetricFilterSelect('stale_dropped', 'sum', 'stale_dropped')} ` +
              `WHERE ${runtimeEnvironmentFilter} SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            7,
            6,
            4,
          ),
          widgetLine(
            'Backpressure Active',
            `FROM Metric SELECT ${buildNamedMetricSelect('worker_backpressure_active', 'max')} ` +
              `WHERE ${buildMetricNameFilter('worker_backpressure_active')} ` +
              `AND ${runtimeEnvironmentFilter} FACET worker SINCE 6 hours ago TIMESERIES 10 minutes`,
            9,
            1,
            6,
            4,
          ),
          widgetTable(
            'Queue Signal Inventory',
            `FROM Metric SELECT count(*) ` +
              `WHERE aws.sqs.QueueName LIKE '${queueNamePrefix}%' ` +
              `AND ${awsScope} ` +
              `FACET metricName SINCE 6 hours ago LIMIT 50`,
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
            `FROM Metric SELECT ${buildNamedMetricSelect('slo_actual_value', 'latest')} ` +
              `WHERE ${buildMetricNameFilter('slo_actual_value')} ` +
              `AND ${runtimeEnvironmentFilter} FACET slo_name SINCE 6 hours ago TIMESERIES 15 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'SLO Compliance Ratios',
            `FROM Metric SELECT ${buildNamedMetricSelect('slo_compliance_ratio', 'latest')} ` +
              `WHERE ${buildMetricNameFilter('slo_compliance_ratio')} ` +
              `AND ${runtimeEnvironmentFilter} FACET slo_name SINCE 6 hours ago TIMESERIES 15 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'Indices Availability / Suppression / Confidence',
            `FROM Metric SELECT ${buildNamedMetricSelect('slo_actual_value', 'latest')} ` +
              `WHERE ${buildMetricNameFilter('slo_actual_value')} ` +
              `AND ${runtimeEnvironmentFilter} ` +
              `AND slo_name IN ('indices_available_ratio', 'indices_suppressed_ratio', 'weight_confidence_p10') ` +
              `FACET slo_name SINCE 6 hours ago TIMESERIES 15 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetLine(
            'Gold-Live Queue Age',
            `FROM Metric SELECT max(getField(\`aws.sqs.ApproximateAgeOfOldestMessage\`, max)) ` +
              `WHERE metricName = 'aws.sqs.ApproximateAgeOfOldestMessage' ` +
              `AND aws.sqs.QueueName LIKE '${queueNamePrefix}gold-live%' ` +
              `AND ${awsScope} ` +
              `SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            7,
            6,
            4,
          ),
          widgetLine(
            'OANDA Sync Failures',
            `FROM Metric SELECT ${buildNamedMetricSelect('oanda_sync_failures_total')} ` +
              `WHERE ${buildMetricNameFilter('oanda_sync_failures_total')} ` +
              `AND ${runtimeEnvironmentFilter} SINCE 24 hours ago TIMESERIES 30 minutes`,
            9,
            1,
            6,
            4,
          ),
          widgetTable(
            'Freshness Metrics by Name',
            `FROM Metric SELECT ${buildNamedMetricSelect('slo_actual_value', 'latest')} ` +
              `WHERE ${buildMetricNameFilter('slo_actual_value')} AND ${runtimeEnvironmentFilter} ` +
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
            `FROM Metric SELECT ${buildNamedMetricSelect('probe_result')} ` +
              `WHERE ${buildMetricNameFilter('probe_result')} ` +
              `AND Status = 'failure' AND ${runtimeEnvironmentFilter} ` +
              `FACET ProviderId SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'Probe Heartbeat (runs)',
            `FROM Metric SELECT ${buildNamedMetricSelect('probe_run_total')} ` +
              `WHERE ${buildMetricNameFilter('probe_run_total')} AND ${runtimeEnvironmentFilter} ` +
              `FACET ProviderId SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'Provider Collection Failures',
            `FROM Metric SELECT ${buildNamedMetricSelect('provider_collection_failure_by_provider_total')} ` +
              `WHERE ${buildMetricNameFilter('provider_collection_failure_by_provider_total')} ` +
              `AND ${runtimeEnvironmentFilter} FACET provider_id ` +
              `SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetLine(
            'Provider Collection Successes',
            `FROM Metric SELECT ${buildNamedMetricSelect('provider_collection_success_by_provider_total')} ` +
              `WHERE ${buildMetricNameFilter('provider_collection_success_by_provider_total')} ` +
              `AND ${runtimeEnvironmentFilter} FACET provider_id ` +
              `SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            7,
            6,
            4,
          ),
          widgetLine(
            'Collector Blocks / Attempt Latency',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('collector_block_count', 'sum', 'block_count')}, ` +
              `${buildNamedMetricFilterSelect('collector_avg_attempt_ms', 'average', 'avg_attempt_ms')} ` +
              `WHERE ${runtimeEnvironmentFilter} FACET ProviderId ` +
              `SINCE 6 hours ago TIMESERIES 10 minutes`,
            9,
            1,
            6,
            4,
          ),
          widgetTable(
            'Provider Signal Inventory',
            `FROM Metric SELECT count(*) WHERE ${runtimeEnvironmentFilter} ` +
              `AND (ProviderId IS NOT NULL OR provider_id IS NOT NULL) ` +
              `FACET metricName SINCE 6 hours ago LIMIT 50`,
            9,
            7,
          ),
        ],
      },
      {
        name: 'Indices (TEER/RCI/RVI)',
        widgets: [
          widgetLine(
            'Indices Aggregate: TEER Rate',
            `FROM Metric SELECT ${buildNamedMetricSelect('indices_teer_rate', 'latest')} ` +
              `WHERE ${buildMetricNameFilter('indices_teer_rate')} ` +
              `AND ${runtimeEnvironmentFilter} SINCE 24 hours ago TIMESERIES 30 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'Indices Aggregate: RCI Ratio / RVI BPS',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('indices_rci_ratio', 'latest', 'rci_ratio')}, ` +
              `${buildNamedMetricFilterSelect('indices_rvi_bps', 'latest', 'rvi_bps')} ` +
              `WHERE ${runtimeEnvironmentFilter} SINCE 24 hours ago TIMESERIES 30 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'Indices Availability / Suppression / Confidence',
            `FROM Metric SELECT ${buildNamedMetricSelect('slo_actual_value', 'latest')} ` +
              `WHERE ${buildMetricNameFilter('slo_actual_value')} ` +
              `AND ${runtimeEnvironmentFilter} ` +
              `AND slo_name IN ('indices_available_ratio', 'indices_suppressed_ratio', 'weight_confidence_p10') ` +
              `FACET slo_name SINCE 24 hours ago TIMESERIES 30 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetTable(
            'Indices Metric Inventory',
            `FROM Metric SELECT count(*) ` +
              `WHERE ${buildMetricNamesFilter(['indices_teer_rate', 'indices_rci_ratio', 'indices_rvi_bps', 'slo_actual_value'])} ` +
              `AND ${runtimeEnvironmentFilter} FACET metricName SINCE 24 hours ago LIMIT 20`,
            5,
            7,
          ),
        ],
      },
      {
        name: 'Exports Health',
        widgets: [
          widgetBillboard(
            'Exports Completed (24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('export_jobs_completed')} ` +
              `WHERE ${buildMetricNameFilter('export_jobs_completed')} AND ${runtimeEnvironmentFilter} SINCE 24 hours ago`,
            1,
            1,
          ),
          widgetBillboard(
            'Exports Failed (24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('export_jobs_failed')} ` +
              `WHERE ${buildMetricNameFilter('export_jobs_failed')} AND ${runtimeEnvironmentFilter} SINCE 24 hours ago`,
            1,
            4,
          ),
          widgetLine(
            'Export Queue Depth / Age',
            `FROM Metric SELECT ` +
              `${buildAwsSummaryFilterSelect('aws.sqs.ApproximateNumberOfMessagesVisible', 'max', 'max', 'visible')}, ` +
              `${buildAwsSummaryFilterSelect('aws.sqs.ApproximateAgeOfOldestMessage', 'max', 'max', 'oldest_sec')} ` +
              `WHERE aws.sqs.QueueName LIKE '${queueNamePrefix}export-job%' ` +
              `AND ${awsScope} ` +
              `SINCE 24 hours ago TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'Export Worker Failures / DLQ Sends',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('message_failed', 'sum', 'message_failed')}, ` +
              `${buildNamedMetricFilterSelect('dlq_sent', 'sum', 'dlq_sent')} ` +
              `WHERE WorkerName LIKE 'export-%' ` +
              `AND ${runtimeEnvironmentFilter} FACET WorkerName SINCE 24 hours ago TIMESERIES 10 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetTable(
            'Exports Metric Inventory',
            `FROM Metric SELECT count(*) ` +
              `WHERE ${runtimeEnvironmentFilter} ` +
              `AND (${buildMetricNamesFilter(['export_jobs_completed', 'export_jobs_failed', 'message_failed', 'dlq_sent'])}) ` +
              `FACET metricName, WorkerName SINCE 24 hours ago LIMIT 30`,
            5,
            7,
          ),
        ],
      },
      {
        name: 'API Health',
        widgets: [
          widgetLine(
            'API Requests / 4xx / 5xx',
            `FROM Metric SELECT ` +
              `${buildAwsSummaryFilterSelect('aws.apigateway.Count', 'total', 'sum', 'requests')}, ` +
              `${buildAwsSummaryFilterSelect('aws.apigateway.4xx', 'total', 'sum', '4xx')}, ` +
              `${buildAwsSummaryFilterSelect('aws.apigateway.5xx', 'total', 'sum', '5xx')} ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${awsScope} SINCE 24 hours ago TIMESERIES 10 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'API Latency p95/p99 (ms)',
            `FROM Metric SELECT percentile(getField(\`aws.apigateway.Latency.byStage\`, max), 95, 99) ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' ` +
              `AND metricName = 'aws.apigateway.Latency.byStage' ` +
              `AND ${awsScope} SINCE 24 hours ago TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'API Gateway Samples (fallback)',
            `FROM ApiGatewaySample SELECT count(*) ` +
              `WHERE ((${awsScope}) OR providerAccountName LIKE 'remit-scout-${envName}-%') ` +
              `SINCE 24 hours ago TIMESERIES 10 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetMarkdown(
            'Cross-Plane Hop (Not Instrumented)',
            'Cross-plane hop custom metric is not currently emitted in this profile. Use API Gateway latency and Span throughput widgets.',
            5,
            7,
            6,
            2,
          ),
          widgetMarkdown(
            'Cross-Plane Error Amplification (Not Instrumented)',
            'Cross-plane amplification custom metric is not currently emitted in this profile. This is an explicit instrumentation gap widget.',
            9,
            1,
            6,
            2,
          ),
          widgetTable(
            'API Metric Breakdown',
            `FROM Metric SELECT count(*) ` +
              `WHERE aws.Namespace = 'AWS/ApiGateway' AND ${awsScope} ` +
              `FACET metricName SINCE 24 hours ago LIMIT 30`,
            9,
            7,
          ),
        ],
      },
      {
        name: 'Provider Health (Per Provider)',
        widgets: [
          widgetLine(
            'Probe Success/Failure by Provider',
            `FROM Metric SELECT ${buildNamedMetricSelect('probe_result')} ` +
              `WHERE ${buildMetricNameFilter('probe_result')} ` +
              `AND ${runtimeEnvironmentFilter} FACET ProviderId, Status SINCE 24 hours ago TIMESERIES 10 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'Probe Runs by Provider',
            `FROM Metric SELECT ${buildNamedMetricSelect('probe_run_total')} ` +
              `WHERE ${buildMetricNameFilter('probe_run_total')} ` +
              `AND ${runtimeEnvironmentFilter} FACET ProviderId SINCE 24 hours ago TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetTable(
            'Provider Probe Failures (24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('probe_result')} AS failures ` +
              `WHERE ${buildMetricNameFilter('probe_result')} ` +
              `AND Status = 'failure' AND ${runtimeEnvironmentFilter} ` +
              `FACET ProviderId SINCE 24 hours ago LIMIT 50`,
            5,
            1,
          ),
          widgetTable(
            'Provider Probe Coverage (24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('probe_run_total')} AS runs ` +
              `WHERE ${buildMetricNameFilter('probe_run_total')} ` +
              `AND ${runtimeEnvironmentFilter} FACET ProviderId SINCE 24 hours ago LIMIT 50`,
            5,
            7,
          ),
          widgetLine(
            'Collector Block Count by Provider',
            `FROM Metric SELECT ${buildNamedMetricSelect('collector_block_count')} ` +
              `WHERE ${buildMetricNameFilter('collector_block_count')} ` +
              `AND ${runtimeEnvironmentFilter} FACET ProviderId SINCE 24 hours ago TIMESERIES 10 minutes`,
            9,
            1,
            6,
            4,
          ),
          widgetLine(
            'Collector Avg Attempt (ms) by Provider',
            `FROM Metric SELECT ${buildNamedMetricSelect('collector_avg_attempt_ms', 'average')} ` +
              `WHERE ${buildMetricNameFilter('collector_avg_attempt_ms')} ` +
              `AND ${runtimeEnvironmentFilter} FACET ProviderId SINCE 24 hours ago TIMESERIES 10 minutes`,
            9,
            7,
            6,
            4,
          ),
        ],
      },
      {
        name: 'Business Growth + Revenue',
        widgets: [
          widgetBillboard(
            'Search Events (24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('telemetry_search_events_total')} ` +
              `WHERE ${buildMetricNameFilter('telemetry_search_events_total')} ` +
              `AND ${runtimeEnvironmentFilter} SINCE 24 hours ago`,
            1,
            1,
          ),
          widgetBillboard(
            'Provider Visits (24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('telemetry_provider_visits_total')} ` +
              `WHERE ${buildMetricNameFilter('telemetry_provider_visits_total')} ` +
              `AND ${runtimeEnvironmentFilter} SINCE 24 hours ago`,
            1,
            4,
          ),
          widgetBillboard(
            'Affiliate Clicks (24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('telemetry_affiliate_click_events_total')} ` +
              `WHERE ${buildMetricNameFilter('telemetry_affiliate_click_events_total')} ` +
              `AND ${runtimeEnvironmentFilter} SINCE 24 hours ago`,
            1,
            7,
          ),
          widgetBillboard(
            'Affiliate Conversions (24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('telemetry_affiliate_conversions_total')} ` +
              `WHERE ${buildMetricNameFilter('telemetry_affiliate_conversions_total')} ` +
              `AND ${runtimeEnvironmentFilter} SINCE 24 hours ago`,
            1,
            10,
          ),
          widgetLine(
            'Sessions / Searches / Clicks / Conversions',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('telemetry_sessions_started_total', 'sum', 'sessions')}, ` +
              `${buildNamedMetricFilterSelect('telemetry_search_events_total', 'sum', 'searches')}, ` +
              `${buildNamedMetricFilterSelect('telemetry_click_events_total', 'sum', 'clicks')}, ` +
              `${buildNamedMetricFilterSelect('telemetry_affiliate_conversions_total', 'sum', 'conversions')} ` +
              `WHERE ${runtimeEnvironmentFilter} SINCE 24 hours ago TIMESERIES 30 minutes`,
            4,
            1,
            6,
            4,
          ),
          widgetLine(
            'Affiliate Conversion Value (Money Made Proxy)',
            `FROM Metric SELECT ${buildNamedMetricSelect('telemetry_affiliate_conversion_value')} ` +
              `WHERE ${buildMetricNameFilter('telemetry_affiliate_conversion_value')} ` +
              `AND ${runtimeEnvironmentFilter} ` +
              `FACET conversion_currency SINCE 24 hours ago TIMESERIES 30 minutes`,
            4,
            7,
            6,
            4,
          ),
          widgetTable(
            'Top Providers by Clicks (24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('telemetry_click_events_total')} AS clicks ` +
              `WHERE ${buildMetricNameFilter('telemetry_click_events_total')} ` +
              `AND ${runtimeEnvironmentFilter} ` +
              `FACET provider_id SINCE 24 hours ago LIMIT 25`,
            8,
            1,
          ),
          widgetTable(
            'Top Providers by Conversion Value (24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('telemetry_affiliate_conversion_value')} AS conversion_value ` +
              `WHERE ${buildMetricNameFilter('telemetry_affiliate_conversion_value')} ` +
              `AND ${runtimeEnvironmentFilter} ` +
              `FACET provider_id, conversion_currency SINCE 24 hours ago LIMIT 25`,
            8,
            7,
          ),
          widgetTable(
            'Acquisition Sources (Sessions, 24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('telemetry_sessions_started_total')} AS sessions ` +
              `WHERE ${buildMetricNameFilter('telemetry_sessions_started_total')} ` +
              `AND ${runtimeEnvironmentFilter} ` +
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
            `FROM Metric SELECT ` +
              `${buildAwsSummaryFilterSelect('aws.rds.CPUUtilization', 'max', 'average', 'cpu_utilization')}, ` +
              `${buildAwsSummaryFilterSelect('aws.rds.DatabaseConnections', 'max', 'average', 'db_connections')} ` +
              `WHERE aws.Namespace = 'AWS/RDS' ` +
              `AND ${awsScope} SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'Aurora: Memory / Disk Queue / Replica Lag',
            `FROM Metric SELECT ` +
              `${buildAwsSummaryFilterSelect('aws.rds.FreeableMemory', 'max', 'average', 'freeable_memory')}, ` +
              `${buildAwsSummaryFilterSelect('aws.rds.DiskQueueDepth', 'max', 'average', 'disk_queue_depth')}, ` +
              `${buildAwsSummaryFilterSelect('aws.rds.AuroraReplicaLagMaximum', 'max', 'average', 'replica_lag_max')} ` +
              `WHERE aws.Namespace = 'AWS/RDS' ` +
              `AND ${awsScope} SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'Redis: Connections + Engine CPU',
            `FROM Metric SELECT ` +
              `${buildAwsSummaryFilterSelect('aws.elasticache.CurrConnections', 'max', 'max', 'connections')}, ` +
              `${buildAwsSummaryFilterSelect('aws.elasticache.EngineCPUUtilization', 'max', 'max', 'engine_cpu')} ` +
              `WHERE aws.Namespace = 'AWS/ElastiCache' ` +
              `AND ${awsScope} SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetLine(
            'ECS: CPU / Memory',
            `FROM Metric SELECT ` +
              `${buildAwsSummaryFilterSelect('aws.ecs.CPUUtilization.byService', 'max', 'average', 'cpu_utilization')}, ` +
              `${buildAwsSummaryFilterSelect('aws.ecs.MemoryUtilization.byService', 'max', 'average', 'memory_utilization')} ` +
              `WHERE aws.Namespace = 'AWS/ECS' ` +
              `AND ${awsScope} SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            7,
            6,
            4,
          ),
          widgetLine(
            'DB Pool Waiting',
            `FROM Metric SELECT ${buildNamedMetricSelect('db_connection_pool_waiting', 'max')} ` +
              `WHERE ${buildMetricNameFilter('db_connection_pool_waiting')} AND ${runtimeEnvironmentFilter} ` +
              `FACET pool_name SINCE 6 hours ago TIMESERIES 10 minutes`,
            9,
            1,
            6,
            4,
          ),
          widgetTable(
            'Top Infra Metric Names',
            `FROM Metric SELECT count(*) WHERE ${awsScope} FACET aws.Namespace, metricName SINCE 6 hours ago LIMIT 50`,
            9,
            7,
          ),
        ],
      },
      {
        name: 'Agent Self-Healing',
        widgets: [
          widgetMarkdown(
            'Agent Pipeline Overview',
            `## Agent Self-Healing Pipeline\n\n` +
              `**Detection** → **Failure Bundles** → **Patch Proposals** → **Validation** → **Deploy (PR)**\n\n` +
              `Monitors: Orchestrator cycles, failure detection, tool gateway, knowledge plane, stress response.\n` +
              `Namespace: \`RemitScout/Agents\` · Managed by \`ops/newrelic/bootstrap-dashboards.mjs\`.`,
            1,
            1,
            12,
            2,
          ),
          widgetBillboard(
            'Detection Cycles (1h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('detection_cycle_count')} ` +
              `WHERE ${buildMetricNameFilter('detection_cycle_count')} AND ${runtimeEnvironmentFilter} SINCE 1 hour ago`,
            3,
            1,
          ),
          widgetBillboard(
            'Failure Bundles (1h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('failure_bundle_created')} ` +
              `WHERE ${buildMetricNameFilter('failure_bundle_created')} AND ${runtimeEnvironmentFilter} SINCE 1 hour ago`,
            3,
            4,
          ),
          widgetBillboard(
            'Repair Proposals (1h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('repair_proposal_generated')} ` +
              `WHERE ${buildMetricNameFilter('repair_proposal_generated')} AND ${runtimeEnvironmentFilter} SINCE 1 hour ago`,
            3,
            7,
          ),
          widgetBillboard(
            'Stress Incidents (1h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('stress_escalation_incident')} ` +
              `WHERE ${buildMetricNameFilter('stress_escalation_incident')} AND ${runtimeEnvironmentFilter} SINCE 1 hour ago`,
            3,
            10,
          ),
          widgetLine(
            'Orchestrator Cycles + Bundles',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('detection_cycle_count', 'sum', 'cycles')}, ` +
              `${buildNamedMetricFilterSelect('failure_bundle_created', 'sum', 'bundles')} ` +
              `WHERE ${runtimeEnvironmentFilter} SINCE 6 hours ago TIMESERIES 10 minutes`,
            6,
            1,
            6,
            4,
          ),
          widgetLine(
            'Proposals + PRs Created + Deferred',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('repair_proposal_generated', 'sum', 'proposals')}, ` +
              `${buildNamedMetricFilterSelect('deploy_pr_created', 'sum', 'prs_created')}, ` +
              `${buildNamedMetricFilterSelect('deploy_pr_deferred', 'sum', 'prs_deferred')} ` +
              `WHERE ${runtimeEnvironmentFilter} SINCE 6 hours ago TIMESERIES 10 minutes`,
            6,
            7,
            6,
            4,
          ),
          widgetLine(
            'Tool Gateway: Requests + Blocked',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('tool_request_total', 'sum', 'requests')}, ` +
              `${buildNamedMetricFilterSelect('tool_request_blocked', 'sum', 'blocked')} ` +
              `WHERE ${runtimeEnvironmentFilter} SINCE 6 hours ago TIMESERIES 10 minutes`,
            10,
            1,
            6,
            4,
          ),
          widgetLine(
            'Knowledge Retrievals + Insufficient',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('knowledge_retrieval_total', 'sum', 'retrievals')}, ` +
              `${buildNamedMetricFilterSelect('knowledge_retrieval_insufficient', 'sum', 'insufficient')} ` +
              `WHERE ${runtimeEnvironmentFilter} SINCE 6 hours ago TIMESERIES 10 minutes`,
            10,
            7,
            6,
            4,
          ),
          widgetLine(
            'Failure Detector: Modules Scanned + Quarantined',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('detection_modules_scanned', 'sum', 'modules_scanned')}, ` +
              `${buildNamedMetricFilterSelect('module_quarantined', 'sum', 'quarantined')} ` +
              `WHERE ${runtimeEnvironmentFilter} SINCE 6 hours ago TIMESERIES 10 minutes`,
            14,
            1,
            6,
            4,
          ),
          widgetTable(
            'Agent Metric Inventory',
            `FROM Metric SELECT count(*) ` +
              `WHERE ${buildMetricNamesFilter([
                'detection_cycle_count', 'failure_bundle_created', 'repair_proposal_generated',
                'tool_request_total', 'tool_request_blocked',
                'knowledge_retrieval_total', 'knowledge_retrieval_insufficient',
                'stress_escalation_incident',
                'detection_run_total', 'detection_modules_scanned', 'detection_bundles_by_category',
                'module_quarantined',
                'deploy_pr_created', 'deploy_pr_deferred', 'deploy_pr_failed',
              ])} ` +
              `AND ${runtimeEnvironmentFilter} FACET metricName SINCE 6 hours ago LIMIT 30`,
            14,
            7,
          ),
        ],
      },
      {
        name: 'Normalization + Stress',
        widgets: [
          widgetLine(
            'Normalization Success / Failure',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('normalization_success_total', 'sum', 'success')}, ` +
              `${buildNamedMetricFilterSelect('normalization_quality_flag_total', 'sum', 'quality_flags')} ` +
              `WHERE ${runtimeEnvironmentFilter} SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            1,
            6,
            4,
          ),
          widgetLine(
            'Quality Flags by Type',
            `FROM Metric SELECT ${buildNamedMetricSelect('normalization_quality_flag_total')} ` +
              `WHERE ${buildMetricNameFilter('normalization_quality_flag_total')} ` +
              `AND ${runtimeEnvironmentFilter} FACET flag_type SINCE 6 hours ago TIMESERIES 10 minutes`,
            1,
            7,
            6,
            4,
          ),
          widgetLine(
            'Stress Signals by Level',
            `FROM Metric SELECT ${buildNamedMetricSelect('stress_signals_by_level')} ` +
              `WHERE ${buildMetricNameFilter('stress_signals_by_level')} ` +
              `AND ${runtimeEnvironmentFilter} FACET stress_level SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            1,
            6,
            4,
          ),
          widgetLine(
            'Stress Computation + Corridors Scanned',
            `FROM Metric SELECT ` +
              `${buildNamedMetricFilterSelect('stress_computation_total', 'sum', 'computations')}, ` +
              `${buildNamedMetricFilterSelect('stress_corridors_scanned', 'sum', 'corridors_scanned')} ` +
              `WHERE ${runtimeEnvironmentFilter} SINCE 6 hours ago TIMESERIES 10 minutes`,
            5,
            7,
            6,
            4,
          ),
          widgetLine(
            'Stress Escalation Incidents (24h)',
            `FROM Metric SELECT ${buildNamedMetricSelect('stress_escalation_incident')} ` +
              `WHERE ${buildMetricNameFilter('stress_escalation_incident')} ` +
              `AND ${runtimeEnvironmentFilter} SINCE 24 hours ago TIMESERIES 30 minutes`,
            9,
            1,
            6,
            4,
          ),
          widgetTable(
            'Normalization + Stress Signal Inventory',
            `FROM Metric SELECT count(*) ` +
              `WHERE ${buildMetricNamesFilter([
                'normalization_success_total', 'normalization_quality_flag_total',
                'stress_computation_total', 'stress_signals_by_level', 'stress_corridors_scanned',
                'stress_escalation_incident',
              ])} ` +
              `AND ${runtimeEnvironmentFilter} FACET metricName SINCE 6 hours ago LIMIT 20`,
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
    {
      environmentName: 'Staging',
      envName: 'staging',
      nameToken: 'remit-scout-staging',
      awsAccountId: NEW_RELIC_STAGING_AWS_ACCOUNT_ID,
    },
    {
      environmentName: 'Production',
      envName: 'prod',
      nameToken: 'remit-scout-prod',
      awsAccountId: NEW_RELIC_PROD_AWS_ACCOUNT_ID,
    },
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
