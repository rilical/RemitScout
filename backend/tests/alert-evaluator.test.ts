import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { AlertRepository, FxRateRepository, LatestQuoteRepository } from '../plane-a/src/repositories'
import { sendAlertEmail, sendAlertPush, sendAlertSms } from '../plane-a/src/services/alert-notifications'
import { getUserPlan } from '../plane-a/src/services/user-plan'
import { query } from '../shared/db'
import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import { evaluateAlert, evaluateAlertsForFrequency } from '../plane-a/src/services/alert-evaluator'

vi.mock('../plane-a/src/repositories', () => ({
  AlertRepository: vi.fn(),
  FxRateRepository: vi.fn(),
  LatestQuoteRepository: vi.fn(),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  getUserPlan: vi.fn(),
}))

vi.mock('../plane-a/src/services/alert-notifications', () => ({
  sendAlertEmail: vi.fn(),
  sendAlertSms: vi.fn(),
  sendAlertPush: vi.fn(),
}))

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

vi.mock('../shared/cloudwatch-metrics', () => ({
  recordCloudWatchMetric: vi.fn(),
}))

describe('alert-evaluator', () => {
  let mockPool: Pool
  let mockAlertRepository: {
    getAlertWithWatchlist: ReturnType<typeof vi.fn>
    updateAlertState: ReturnType<typeof vi.fn>
    createAlertEvent: ReturnType<typeof vi.fn>
    updateAlertEventStatus: ReturnType<typeof vi.fn>
  }
  let mockFxRateRepository: {
    getRate: ReturnType<typeof vi.fn>
  }
  let mockLatestQuoteRepository: {
    listLatestByCorridor: ReturnType<typeof vi.fn>
  }

  const baseAlert = {
    id: 'alert-1',
    watchlist_item_id: 'watch-1',
    metric: 'recipientGets',
    comparator: 'gt',
    threshold: 100,
    currency: null,
    frequency: 'weekly',
    enabled: true,
    cooldown_minutes: 60,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool = {} as Pool

    mockAlertRepository = {
      getAlertWithWatchlist: vi.fn(),
      updateAlertState: vi.fn().mockResolvedValue(undefined),
      createAlertEvent: vi.fn().mockResolvedValue({ id: 'event-1' }),
      updateAlertEventStatus: vi.fn().mockResolvedValue(undefined),
    }

    mockFxRateRepository = {
      getRate: vi.fn(),
    }

    mockLatestQuoteRepository = {
      listLatestByCorridor: vi.fn(),
    }

    vi.mocked(AlertRepository).mockImplementation(() => mockAlertRepository as any)
    vi.mocked(FxRateRepository).mockImplementation(() => mockFxRateRepository as any)
    vi.mocked(LatestQuoteRepository).mockImplementation(() => mockLatestQuoteRepository as any)

    vi.mocked(sendAlertEmail).mockResolvedValue(false)
    vi.mocked(sendAlertSms).mockResolvedValue(false)
    vi.mocked(sendAlertPush).mockResolvedValue(false)
    vi.mocked(getUserPlan).mockResolvedValue(null)
    vi.mocked(query).mockResolvedValue({ rows: [] })
  })

  it('returns false when alert is missing', async () => {
    mockAlertRepository.getAlertWithWatchlist.mockResolvedValue(null)

    const result = await evaluateAlert(mockPool, 'missing-alert')

    expect(result).toBe(false)
    expect(mockAlertRepository.updateAlertState).not.toHaveBeenCalled()
  })

  it('blocks sendScore when user is not entitled', async () => {
    mockAlertRepository.getAlertWithWatchlist.mockResolvedValue({
      alert: { ...baseAlert, metric: 'sendScore' },
      watchlist_item: {
        user_id: 'user-1',
        target_type: 'corridor',
        target_payload: {
          from: 'US',
          to: 'MX',
          fromCurrency: 'USD',
          toCurrency: 'MXN',
        },
      },
      state: null,
    })
    vi.mocked(getUserPlan).mockResolvedValue({
      plan_code: 'basic',
      status: 'active',
    } as any)

    const result = await evaluateAlert(mockPool, 'alert-1')

    expect(result).toBe(false)
    expect(query).not.toHaveBeenCalled()
    expect(mockAlertRepository.updateAlertState).not.toHaveBeenCalled()
  })

  it('triggers recipientGets alerts and sends notifications', async () => {
    mockAlertRepository.getAlertWithWatchlist.mockResolvedValue({
      alert: { ...baseAlert, metric: 'recipientGets', comparator: 'gt', threshold: 110 },
      watchlist_item: {
        user_id: 'user-1',
        target_type: 'corridor',
        target_payload: {
          from: 'US',
          to: 'MX',
          fromCurrency: 'USD',
          toCurrency: 'MXN',
          amountBucket: 500,
          method: 'bank',
        },
      },
      state: null,
    })

    mockLatestQuoteRepository.listLatestByCorridor.mockResolvedValue([
      { recipient_gets: '120' } as any,
      { recipient_gets: '115' } as any,
    ])

    vi.mocked(sendAlertEmail).mockResolvedValue(true)

    const result = await evaluateAlert(mockPool, 'alert-1')

    expect(result).toBe(true)
    expect(mockLatestQuoteRepository.listLatestByCorridor).toHaveBeenCalledWith(
      'US-MX-USD-MXN',
      500,
      'bank',
      'bank',
    )
    expect(mockAlertRepository.updateAlertState).toHaveBeenCalledWith(
      'alert-1',
      expect.objectContaining({
        in_alarm: true,
        last_value: 120,
        last_notified_at: expect.any(Date),
      }),
    )
    expect(mockAlertRepository.createAlertEvent).toHaveBeenCalled()
    expect(mockAlertRepository.updateAlertEventStatus).toHaveBeenCalledWith('event-1', 'sent')
  })

  it('honors smart alert eligibility from corridor signals', async () => {
    mockAlertRepository.getAlertWithWatchlist.mockResolvedValue({
      alert: { ...baseAlert, metric: 'sendScore', comparator: 'gte', threshold: 80 },
      watchlist_item: {
        user_id: 'user-1',
        target_type: 'corridor',
        target_payload: {
          corridorId: 'US-MX-USD-MXN',
        },
      },
      state: null,
    })

    vi.mocked(getUserPlan).mockResolvedValue({
      plan_code: 'plus',
      status: 'active',
    } as any)

    vi.mocked(query).mockResolvedValue({
      rows: [{
        send_score: 90,
        alert_eligible: false,
        best_window_start: new Date('2024-01-01T00:00:00Z'),
        best_window_end: new Date('2024-01-02T00:00:00Z'),
        confidence: 80,
        sample_days: 30,
      }],
    })

    const result = await evaluateAlert(mockPool, 'alert-1')

    expect(result).toBe(false)
    expect(mockAlertRepository.updateAlertState).toHaveBeenCalledWith(
      'alert-1',
      expect.objectContaining({
        in_alarm: false,
        last_value: 90,
      }),
    )
    expect(mockAlertRepository.createAlertEvent).not.toHaveBeenCalled()
  })

  it('suppresses notifications during cooldown', async () => {
    const lastNotified = new Date()
    mockAlertRepository.getAlertWithWatchlist.mockResolvedValue({
      alert: { ...baseAlert, metric: 'rate', comparator: 'gt', threshold: 1.2, cooldown_minutes: 60 },
      watchlist_item: {
        user_id: 'user-1',
        target_type: 'corridor',
        target_payload: {
          from: 'US',
          to: 'MX',
        },
      },
      state: {
        alert_id: 'alert-1',
        last_evaluated_at: null,
        last_value: 1.1,
        in_alarm: true,
        last_triggered_at: lastNotified,
        last_notified_at: lastNotified,
        snoozed_until: null,
        version: 2,
      },
    })

    mockFxRateRepository.getRate.mockResolvedValue(1.5)

    const result = await evaluateAlert(mockPool, 'alert-1')

    expect(result).toBe(false)
    expect(mockAlertRepository.createAlertEvent).not.toHaveBeenCalled()
    expect(mockAlertRepository.updateAlertState).toHaveBeenCalledWith(
      'alert-1',
      expect.objectContaining({
        in_alarm: false,
        last_notified_at: lastNotified,
      }),
    )
  })

  it('evaluates alerts by frequency and records metrics', async () => {
    mockAlertRepository.getAlertWithWatchlist.mockResolvedValue(null)
    vi.mocked(query).mockResolvedValue({ rows: [{ id: 'alert-a' }, { id: 'alert-b' }] })

    const result = await evaluateAlertsForFrequency(mockPool, 'daily', 12)

    expect(result).toEqual({ total: 2, triggered: 0 })
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('FROM silver.alert_rule'),
      ['daily', 12, 5000],
      mockPool,
    )
    // 3 explicit CloudWatch metrics + 2 business metrics (which also go through CloudWatch).
    expect(recordCloudWatchMetric).toHaveBeenCalledTimes(5)
  })
})
