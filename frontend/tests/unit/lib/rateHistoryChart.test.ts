// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { buildRateHistoryChartPoints } from '~/lib/rateHistoryChart'

const chartConfig = {
  chartWidth: 400,
  chartHeight: 120,
  chartPadding: 10,
  chartLeftPadding: 60,
  chartTopPadding: 15,
  chartBottomPadding: 25,
}

describe('buildRateHistoryChartPoints', () => {
  it('renders a single history datapoint as a full-width horizontal line', () => {
    const points = buildRateHistoryChartPoints({
      history: [{ rate: 1.2762, date: '2026-03-03T00:00:00.000Z' }],
      isSameCurrency: false,
      ...chartConfig,
    })

    expect(points).toHaveLength(2)
    expect(points[0]).toMatchObject({
      x: 60,
      rate: 1.2762,
    })
    expect(points[1]).toMatchObject({
      x: 390,
      rate: 1.2762,
    })
    expect(points[0]?.y).toBe(points[1]?.y)
  })

  it('renders stable multi-point history on the same horizontal level', () => {
    const points = buildRateHistoryChartPoints({
      history: [
        { rate: 1.2762, date: '2026-03-01T00:00:00.000Z' },
        { rate: 1.2762, date: '2026-03-02T00:00:00.000Z' },
        { rate: 1.2762, date: '2026-03-03T00:00:00.000Z' },
      ],
      isSameCurrency: false,
      ...chartConfig,
    })

    expect(points).toHaveLength(3)
    expect(new Set(points.map(point => point.y))).toHaveLength(1)
    expect(points[0]?.x).toBe(60)
    expect(points[2]?.x).toBe(390)
  })
})
