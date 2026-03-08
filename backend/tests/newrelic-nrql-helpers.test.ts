import { describe, expect, it } from 'vitest'

const helpersModule = await import('../../ops/newrelic/nrql-helpers.mjs')

const {
  buildAwsIntegrationScopeClause,
  buildEnvScopeClause,
  buildMetricNameFilter,
  buildMetricNamesFilter,
  buildAwsMetricLikeFilter,
  buildNamedMetricSelect,
  buildNamedMetricFilterSelect,
  buildNamedMetricFilterExpression,
  buildAwsSummarySelect,
  buildAwsSummaryFilterSelect,
  buildAwsSummaryFilterExpression,
} = helpersModule

describe('newrelic nrql helpers', () => {
  it('builds env scope with dashed and compact tokens', () => {
    const clause = buildEnvScopeClause({
      envName: 'staging',
      nameToken: 'remit-scout-staging',
      awsAccountId: '010630709504',
      allowMissingAwsAccount: false,
    })

    expect(clause).toContain("environment = 'staging'")
    expect(clause).toContain("LIKE '%remit-scout-staging%'")
    expect(clause).toContain("LIKE '%remitscoutstaging%'")
    expect(clause).toContain("aws.accountId = '010630709504'")
  })

  it('builds aws integration scope pinned to account id', () => {
    const clause = buildAwsIntegrationScopeClause({
      envName: 'staging',
      nameToken: 'remit-scout-staging',
      awsAccountId: '010630709504',
    })

    expect(clause).toContain("aws.accountId = '010630709504'")
    expect(clause).toContain("newrelic.cloudIntegrations.providerAccountId = '010630709504'")
  })

  it('builds namespace-aware metric filter for mapped custom metrics', () => {
    const filter = buildMetricNameFilter('slo_breach_total')
    expect(filter).toContain("metricName = 'slo_breach_total'")
    expect(filter).toContain("metricName = 'aws.remitscout.slo_breach_total'")
    expect(filter).toContain("aws.Namespace = 'RemitScout'")
  })

  it('builds grouped metric-name filter', () => {
    const filter = buildMetricNamesFilter(['message_failed', 'dlq_sent'])
    expect(filter).toContain('message_failed')
    expect(filter).toContain('dlq_sent')
  })

  it('builds tolerant aws metric fragment filter', () => {
    const filter = buildAwsMetricLikeFilter('apigateway.Latency')
    expect(filter).toContain("%apigateway.Latency%")
    expect(filter).toContain("metricName LIKE 'aws.%apigateway.Latency%'")
  })

  it('builds named metric selectors for direct New Relic metrics', () => {
    expect(buildNamedMetricSelect('telemetry_search_events_total')).toBe('sum(`telemetry_search_events_total`)')
    expect(buildNamedMetricFilterExpression('telemetry_search_events_total')).toContain(
      "filter(sum(`telemetry_search_events_total`), WHERE",
    )
    expect(buildNamedMetricFilterSelect('telemetry_search_events_total', 'sum', 'searches')).toContain(
      "filter(sum(`telemetry_search_events_total`), WHERE",
    )
  })

  it('builds summary metric selectors for AWS metric stream metrics', () => {
    expect(buildAwsSummarySelect('aws.apigateway.Count', 'total', 'sum')).toBe(
      'sum(getField(`aws.apigateway.Count`, total))',
    )
    expect(buildAwsSummaryFilterExpression('aws.apigateway.Count', 'total', 'sum')).toContain(
      "filter(sum(getField(`aws.apigateway.Count`, total)), WHERE metricName = 'aws.apigateway.Count')",
    )
    expect(buildAwsSummaryFilterSelect('aws.apigateway.Count', 'total', 'sum', 'requests')).toContain(
      "filter(sum(getField(`aws.apigateway.Count`, total)), WHERE metricName = 'aws.apigateway.Count') AS 'requests'",
    )
  })
})
