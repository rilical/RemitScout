import { beforeEach, describe, expect, it, vi } from 'vitest'

const queryMock = vi.fn()

vi.mock('../shared/db', () => ({
  query: queryMock,
}))

const buildInput = () => ({
  quote: {
    providerId: 'wise',
    corridorId: 'US-PH-USD-PHP',
    amountBucket: 500,
    payin: 'bank_transfer',
    payout: 'bank_deposit',
    sendAmount: 500,
    feeAmount: 4.99,
    promotionalFeeAmount: null,
    feeCurrency: 'USD',
    totalDebitAmount: 504.99,
    receiveAmount: 28000,
    impliedFxRate: 56,
    promotionalRate: null,
    baseRate: 56,
    promotionalCapAmount: null,
    deliveryTimeMinMinutes: 5,
    deliveryTimeMaxMinutes: 30,
    status: 'ok' as const,
    errorCode: null,
    errorMessage: null,
    collectedAt: '2026-03-05T12:00:00.000Z',
    ingestedAt: '2026-03-05T12:00:05.000Z',
    ingestionRunId: 'run-1',
    bronzeObjectKey: 'bronze/wise/quote.json',
    parserVersion: 'wise@1.2.3',
    qualityFlags: '[]',
  },
  latest: {
    corridorId: 'US-PH-USD-PHP',
    amountBucket: 500,
    payin: 'bank_transfer',
    payout: 'bank_deposit',
    providerId: 'wise',
    collectedAt: '2026-03-05T12:00:00.000Z',
    sendAmount: 500,
    feeAmount: 4.99,
    promotionalFeeAmount: null,
    totalDebitAmount: 504.99,
    receiveAmount: 28000,
    impliedFxRate: 56,
    promotionalRate: null,
    baseRate: 56,
    promotionalCapAmount: null,
    deliveryTimeMinMinutes: 5,
    deliveryTimeMaxMinutes: 30,
    status: 'ok' as const,
    qualityFlags: '[]',
  },
})

describe('quote record repository dual-write', () => {
  beforeEach(() => {
    queryMock.mockReset()
    queryMock.mockResolvedValue({ rows: [] })
  })

  it('writes quote observations with the canonical snake_case payload contract', async () => {
    const { QuoteRecordRepository } = await import('../plane-b/src/repositories/implementations/quote-record-repository.ts')
    const repository = new QuoteRecordRepository({} as any)

    await repository.insertQuoteAndUpsertLatest({
      ...buildInput(),
      observation: {
        moduleId: 'wise:http',
        providerId: 'wise',
        ownerKind: 'provider',
        ownerId: 'wise',
        signalLayer: 'quote',
        captureMethod: 'http',
        parserVersion: 'wise@1.2.3',
        sourceRef: 'bronze/wise/quote.json',
        corridorId: 'US-PH-USD-PHP',
        amountBucket: 500,
        confidence: 'high',
        observedAt: '2026-03-05T12:00:00.000Z',
        ingestionRunId: 'run-1',
        payload: JSON.stringify({
          provider_id: 'wise',
          exchange_rate: 56,
          send_amount: 500,
          receive_amount: 28000,
        }),
        lineage: JSON.stringify({
          bronze_object_key: 'bronze/wise/quote.json',
          parser_version: 'wise@1.2.3',
        }),
        traceId: 'trace-1',
        parentSpanId: 'span-1',
      },
    })

    expect(queryMock).toHaveBeenCalledTimes(1)
    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]]

    expect(sql).toContain('observation_insert AS')
    expect(sql).toContain('(module_id, provider_id, owner_kind, owner_id, type, signal_layer, capture_method,')
    expect(sql).toContain('parser_version, source_ref, corridor_id, amount_bucket, confidence, observed_at,')
    expect(sql).toContain('payload, lineage, trace_id, parent_span_id, schema_version)')
    expect(params[26]).toBe(true)
    expect(params[27]).toBe('wise:http')
    expect(params[29]).toBe('provider')
    expect(params[31]).toBe('quote')
    expect(params[33]).toBe('wise@1.2.3')
    expect(params[34]).toBe('bronze/wise/quote.json')
    expect(params[40]).toBe('{"provider_id":"wise","exchange_rate":56,"send_amount":500,"receive_amount":28000}')
  })

  it('skips the observation insert when dual-write input is omitted', async () => {
    const { QuoteRecordRepository } = await import('../plane-b/src/repositories/implementations/quote-record-repository.ts')
    const repository = new QuoteRecordRepository({} as any)

    await repository.insertQuoteAndUpsertLatest(buildInput())

    expect(queryMock).toHaveBeenCalledTimes(1)
    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]]

    expect(sql).toContain('WHERE $27::boolean = true')
    expect(params[26]).toBe(false)
    expect(params[27]).toBeNull()
    expect(params[40]).toBeNull()
  })
})
