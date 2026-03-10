import { describe, expect, it } from 'vitest'
import type { ChartSeries } from '~/types/pulse'
import {
  PULSE_CHART_COLORS,
  buildCostMarkupDualAxisOption,
  buildIndicesMultiLineOption,
  buildLeaderChangeFrequencyOption,
  buildProviderWinHeatmapOption,
  buildWinnerTimelineOption,
} from '~/lib/pulseChartBuilders'

const timestamp = Date.UTC(2026, 2, 4)

const makeSeries = (
  id: string,
  label: string,
  color: string,
  values: number[],
): ChartSeries => ({
  id,
  label,
  color,
  points: values.map((value, index) => ({
    t: timestamp + index * 86_400_000,
    v: value,
  })),
})

describe('pulseChartBuilders', () => {
  it('uses the Remit-Scout palette and unit-aware hover copy for cost vs markup', () => {
    const option = buildCostMarkupDualAxisOption(
      [makeSeries('all-in-cost', 'All-in cost', '#000000', [0.62, 0.59])],
      [makeSeries('fx-markup', 'FX markup', '#111111', [41, 38])],
    ) as any

    expect(option.color).toEqual([PULSE_CHART_COLORS.navy, PULSE_CHART_COLORS.brand])

    const tooltipHtml = option.tooltip.formatter([
      {
        seriesIndex: 0,
        seriesName: 'All-in cost',
        data: [timestamp, 0.62],
        marker: '•',
      },
      {
        seriesIndex: 1,
        seriesName: 'FX markup',
        data: [timestamp, 41],
        marker: '•',
      },
    ])

    expect(tooltipHtml).toContain('All-in cost: 0.62%')
    expect(tooltipHtml).toContain('FX markup: 41 bps')
  })

  it('keeps the indices chart on the brand palette and formats RVI as bps without a slider', () => {
    const option = buildIndicesMultiLineOption(
      makeSeries('teer', 'TEER', '#2563EB', [83.2, 83.6]),
      makeSeries('rci', 'RCI', '#0B1F59', [89.4, 90.1]),
      makeSeries('rvi', 'RVI', '#8CB8FF', [24.2, 26.4]),
      { teer: true, rci: true, rvi: true },
    ) as any

    expect(option.color).toEqual([
      PULSE_CHART_COLORS.brand,
      PULSE_CHART_COLORS.navy,
      PULSE_CHART_COLORS.tint,
    ])
    expect(option.dataZoom).toBeUndefined()

    const tooltipHtml = option.tooltip.formatter([
      {
        seriesName: 'TEER',
        data: [timestamp, 83.6],
        marker: '•',
      },
      {
        seriesName: 'RCI',
        data: [timestamp, 90.1],
        marker: '•',
      },
      {
        seriesName: 'RVI',
        data: [timestamp, 26.4],
        marker: '•',
      },
    ])

    expect(tooltipHtml).toContain('TEER: 83.60')
    expect(tooltipHtml).toContain('RCI: 90.1')
    expect(tooltipHtml).toContain('RVI: 26 bps')
  })

  it('builds the provider leader visuals from valid chart types with hover details', () => {
    const timelineOption = buildWinnerTimelineOption([
      {
        timestamp,
        provider: 'Wise',
        color: PULSE_CHART_COLORS.brand,
        detail: '₹41,023 recipient gets · 12 bps ahead of Remitly',
      },
      {
        timestamp: timestamp + 86_400_000,
        provider: 'Remitly',
        color: PULSE_CHART_COLORS.navy,
        detail: '₹40,912 recipient gets · 8 bps ahead of Wise',
      },
    ]) as any

    expect(timelineOption.series[0].type).toBe('bar')

    const leaderChangeOption = buildLeaderChangeFrequencyOption([
      { timestamp, from: 'Wise', to: 'Wise', changed: false },
      { timestamp: timestamp + 86_400_000, from: 'Wise', to: 'Remitly', changed: true },
    ]) as any

    const leaderTooltip = leaderChangeOption.tooltip.formatter({
      dataIndex: 1,
    })

    expect(leaderTooltip).toContain('Leader flipped: Wise → Remitly')

    const heatmapOption = buildProviderWinHeatmapOption(
      [timestamp, timestamp + 86_400_000],
      ['Wise', 'Remitly'],
      [
        { timestamp, provider: 'Wise', value: 1, detail: '12 bps ahead of Remitly' },
        { timestamp, provider: 'Remitly', value: 0 },
        { timestamp: timestamp + 86_400_000, provider: 'Wise', value: 0 },
        { timestamp: timestamp + 86_400_000, provider: 'Remitly', value: 1, detail: '8 bps ahead of Wise' },
      ],
    ) as any

    expect(heatmapOption.series[0].type).toBe('heatmap')
    expect(heatmapOption.visualMap).toBeTruthy()
  })
})
