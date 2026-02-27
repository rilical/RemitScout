import { describe, expect, it } from 'vitest'

const helpersModule = await import('../../ops/newrelic/nrql-helpers.mjs')

const {
  buildEnvScopeClause,
  buildMetricNameFilter,
  buildMetricNamesFilter,
  buildAwsMetricLikeFilter,
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
})
