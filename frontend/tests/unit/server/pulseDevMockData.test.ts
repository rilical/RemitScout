import { describe, expect, it } from 'vitest'
import {
  getIndicesDevMockResponse,
  getPulseDevMockResponse,
  shouldUsePulseDevMock,
} from '~/server/utils/pulseDevMockData'

const query = {
  corridor: 'us-in-usd-inr',
  corridor_id: 'us-in-usd-inr',
  amount: '500',
}

describe('pulseDevMockData', () => {
  it('only enables Pulse mocks when explicitly requested', () => {
    expect(shouldUsePulseDevMock({})).toBe(false)
    expect(shouldUsePulseDevMock({ mock: 'pulse' })).toBe(true)
  })

  it('keeps winner history, leader changes, and provider heatmap aligned to the same publication sequence', () => {
    const charts = getPulseDevMockResponse('charts', {
      ...query,
      chart_ids: 'provider-winner,leader-change-frequency',
      range: '30d',
    }) as any

    const providerWinnerChart = charts.charts.find((entry: any) => entry.id === 'provider-winner').chart
    const leaderChangeChart = charts.charts.find((entry: any) => entry.id === 'leader-change-frequency').chart
    const heatmap = getPulseDevMockResponse('providers/heatmap', query) as any

    const winnerTimeline = providerWinnerChart.series
      .flatMap((series: any) =>
        series.points
          .filter((point: any) => point.v > 0)
          .map((point: any) => ({
            timestamp: point.t,
            provider: series.label,
          })),
      )
      .sort((left: any, right: any) => left.timestamp - right.timestamp)

    expect(heatmap.days).toHaveLength(winnerTimeline.length)
    expect(
      heatmap.days.map((day: any) => ({ timestamp: day.timestamp, provider: day.winner })),
    ).toEqual(winnerTimeline)

    const expectedLeaderChanges = winnerTimeline.slice(1).map((point: any, index: number) => ({
      timestamp: point.timestamp,
      changed: winnerTimeline[index].provider === point.provider ? 0 : 1,
    }))

    expect(
      leaderChangeChart.series[0].points.map((point: any) => ({
        timestamp: point.t,
        changed: point.v,
      })),
    ).toEqual(expectedLeaderChanges)
  })

  it('keeps methodology counts and weights internally consistent', () => {
    const methodology = getIndicesDevMockResponse('methodology', query) as any

    const activeProviders = methodology.providers.filter((provider: any) => !provider.suppressed)
    const suppressedProviders = methodology.providers.filter((provider: any) => provider.suppressed)
    const weightSum = methodology.providers.reduce((total: number, provider: any) => total + provider.weight, 0)

    expect(activeProviders).toHaveLength(methodology.contributingProviders)
    expect(suppressedProviders).toHaveLength(methodology.suppressedProviders)
    expect(weightSum).toBeCloseTo(1, 4)
  })

  it('keeps bank cost history above the best specialist line throughout the trend window', () => {
    const bankComparison = getPulseDevMockResponse('bank-comparison', query) as any
    const trend = getPulseDevMockResponse('cost-trend', query) as any[]

    expect(trend.length).toBeGreaterThan(0)

    for (const point of trend) {
      expect(point.averageHiddenFee).toBeGreaterThan(point.bestProviderCost)
    }

    const bankCostPct = (bankComparison.bankTotalCost / Number(query.amount)) * 100
    const specialistCostPct = (bankComparison.bestSpecialistTotalCost / Number(query.amount)) * 100

    expect(Math.abs(trend[0].averageHiddenFee - bankCostPct)).toBeLessThan(0.1)
    expect(Math.abs(trend[0].bestProviderCost - specialistCostPct)).toBeLessThan(0.1)
  })
})
