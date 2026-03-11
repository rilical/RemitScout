import { beforeEach, describe, expect, it, vi } from 'vitest'

const recordCloudWatchMetricMock = vi.fn()

vi.mock('../shared/cloudwatch-metrics', () => ({
  recordCloudWatchMetric: recordCloudWatchMetricMock,
}))

describe('db metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ENVIRONMENT = 'staging'
  })

  it('keeps per-query database metrics out of New Relic mirroring', async () => {
    vi.resetModules()
    const { recordQueryFromSql } = await import('../shared/db-metrics')

    recordQueryFromSql('select * from users', 0.42, 'success')

    expect(recordCloudWatchMetricMock).toHaveBeenCalledTimes(3)
    expect(recordCloudWatchMetricMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      name: 'db_query_duration_seconds',
      mirrorToNewRelic: false,
    }))
    expect(recordCloudWatchMetricMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
      name: 'db_query_duration_seconds_env',
      mirrorToNewRelic: false,
    }))
    expect(recordCloudWatchMetricMock).toHaveBeenNthCalledWith(3, expect.objectContaining({
      name: 'db_queries_total',
      mirrorToNewRelic: false,
    }))
  })
})
