import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn(async () => ({}))
const {
  enqueueNewRelicMetricMock,
  isNewRelicMetricExportEnabledMock,
} = vi.hoisted(() => ({
  enqueueNewRelicMetricMock: vi.fn(),
  isNewRelicMetricExportEnabledMock: vi.fn(() => false),
}))

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

vi.mock('../shared/newrelic-metric-exporter', () => ({
  enqueueNewRelicMetric: enqueueNewRelicMetricMock,
  isNewRelicMetricExportEnabled: isNewRelicMetricExportEnabledMock,
}))

import { flushCloudWatchMetrics, recordCloudWatchMetric } from '../shared/cloudwatch-metrics'

describe('cloudwatch metrics', () => {
  beforeEach(() => {
    sendMock.mockClear()
    enqueueNewRelicMetricMock.mockClear()
    isNewRelicMetricExportEnabledMock.mockReset()
    isNewRelicMetricExportEnabledMock.mockReturnValue(false)
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
    expect(enqueueNewRelicMetricMock).not.toHaveBeenCalled()
  })

  it('mirrors core alarm namespaces to New Relic while keeping CloudWatch publish', async () => {
    isNewRelicMetricExportEnabledMock.mockReturnValue(true)

    recordCloudWatchMetric({
      name: 'slo_actual_value',
      value: 1,
      unit: 'Count',
      namespace: 'RemitScout',
      dimensions: {
        environment: 'staging',
        service: 'plane-a',
      },
    })

    await flushCloudWatchMetrics()

    expect(enqueueNewRelicMetricMock).toHaveBeenCalledWith(expect.objectContaining({
      name: 'slo_actual_value',
      type: 'count',
      value: 1,
      attributes: expect.objectContaining({
        environment: 'staging',
        service: 'plane-a',
        namespace: 'RemitScout',
      }),
    }))
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('routes non-alarm namespaces to New Relic only when enabled', async () => {
    isNewRelicMetricExportEnabledMock.mockReturnValue(true)

    recordCloudWatchMetric({
      name: 'export_jobs_completed',
      value: 2,
      unit: 'Count',
      namespace: 'RemitScout/Business',
      dimensions: {
        environment: 'staging',
      },
    })

    await flushCloudWatchMetrics()

    expect(enqueueNewRelicMetricMock).toHaveBeenCalledWith(expect.objectContaining({
      name: 'export_jobs_completed',
      type: 'count',
      value: 2,
      attributes: expect.objectContaining({
        environment: 'staging',
        namespace: 'RemitScout/Business',
      }),
    }))
    expect(sendMock).not.toHaveBeenCalled()
  })
})
