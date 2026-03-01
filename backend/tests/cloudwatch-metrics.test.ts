import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn(async () => ({}))

vi.mock('@aws-sdk/client-cloudwatch', () => {
  class PutMetricDataCommand {
    input: unknown
    constructor(input: unknown) {
      this.input = input
    }
  }

  class CloudWatchClient {
    send = sendMock
  }

  return {
    CloudWatchClient,
    PutMetricDataCommand,
  }
})

vi.mock('../shared/config', () => ({
  config: {
    observability: {
      cloudwatch: {
        enabled: true,
        namespace: 'RemitScout',
        flushIntervalMs: 5,
        highCardinalityEnabled: true,
      },
    },
  },
}))

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}))

vi.mock('../shared/connection-manager', () => ({
  registerCloudWatchClient: () => undefined,
}))

import { flushCloudWatchMetrics, recordCloudWatchMetric } from '../shared/cloudwatch-metrics'

describe('cloudwatch metrics', () => {
  beforeEach(() => {
    sendMock.mockClear()
  })

  it('publishes valid metrics with namespace and dimensions', async () => {
    recordCloudWatchMetric({
      name: 'api_requests_total',
      value: 7,
      unit: 'Count',
      dimensions: {
        environment: 'test',
        service: 'plane-a',
      },
    })

    await flushCloudWatchMetrics()

    expect(sendMock).toHaveBeenCalledTimes(1)
    const command = sendMock.mock.calls[0][0] as { input: Record<string, unknown> }
    const input = command.input

    expect(input.Namespace).toBe('RemitScout')
    expect(input.MetricData).toHaveLength(1)
    expect((input.MetricData as Array<Record<string, unknown>>)[0]?.MetricName).toBe('api_requests_total')
  })

  it('rejects invalid metric names before publish', async () => {
    recordCloudWatchMetric({
      name: 'bad-metric-name', // hyphen is forbidden by validator
      value: 1,
      unit: 'Count',
    })

    await flushCloudWatchMetrics()

    expect(sendMock).not.toHaveBeenCalled()
  })
})
