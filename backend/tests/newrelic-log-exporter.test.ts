import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  enqueueNewRelicLog,
  flushNewRelicLogs,
  isNewRelicLogExportEnabled,
  resetNewRelicLogExporterForTests,
  shutdownNewRelicLogExport,
} from '../shared/newrelic-log-exporter'

describe('newrelic-log-exporter', () => {
  const originalEnv = process.env
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.NEW_RELIC_LOGS_ENABLED
    delete process.env.NEW_RELIC_INGEST_KEY
    delete process.env.NEW_RELIC_LOGS_BATCH_SIZE
    delete process.env.NEW_RELIC_LOGS_MAX_QUEUE
    delete process.env.NEW_RELIC_LOGS_FLUSH_MS
    resetNewRelicLogExporterForTests()
  })

  afterEach(async () => {
    await shutdownNewRelicLogExport()
    resetNewRelicLogExporterForTests()
    process.env = originalEnv
    globalThis.fetch = originalFetch
  })

  it('stays disabled without ingest key', () => {
    process.env.NEW_RELIC_LOGS_ENABLED = '1'
    expect(isNewRelicLogExportEnabled()).toBe(false)
  })

  it('flushes logs to New Relic endpoint', async () => {
    process.env.NEW_RELIC_LOGS_ENABLED = '1'
    process.env.NEW_RELIC_INGEST_KEY = 'nr-test-key'
    process.env.NEW_RELIC_LOGS_BATCH_SIZE = '1'
    process.env.NEW_RELIC_REGION = 'US'

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
    })
    globalThis.fetch = fetchMock as typeof fetch

    enqueueNewRelicLog({
      message: 'worker_started',
      level: 'info',
      environment: 'staging',
      service: 'queue-worker',
    })
    await flushNewRelicLogs(true)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://log-api.newrelic.com/log/v1')
    expect(options.method).toBe('POST')
    expect(options.headers).toMatchObject({ 'Api-Key': 'nr-test-key' })
  })

  it('drops oldest records when queue is full', async () => {
    process.env.NEW_RELIC_LOGS_ENABLED = '1'
    process.env.NEW_RELIC_INGEST_KEY = 'nr-test-key'
    process.env.NEW_RELIC_LOGS_BATCH_SIZE = '10'
    process.env.NEW_RELIC_LOGS_MAX_QUEUE = '2'

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
    })
    globalThis.fetch = fetchMock as typeof fetch

    enqueueNewRelicLog({ message: 'one', seq: 1 })
    enqueueNewRelicLog({ message: 'two', seq: 2 })
    enqueueNewRelicLog({ message: 'three', seq: 3 })

    await flushNewRelicLogs(true)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const payload = JSON.parse(String(options.body)) as Array<Record<string, unknown>>
    expect(payload).toHaveLength(2)
    expect(payload[0]?.seq).toBe(2)
    expect(payload[1]?.seq).toBe(3)
  })
})
