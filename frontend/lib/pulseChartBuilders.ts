import type { EChartsOption } from 'echarts'
import type { ChartSeries } from '~/types/pulse'

// ChartPoint and ChartSeries are defined in ~/types/pulse.ts:
//   ChartPoint: { t: number; v: number; label?: string; confidence?: number }
//   ChartSeries: { id: string; label: string; color: string; points: ChartPoint[] }

// lowConfidence is a backend-only field not in the shared type; accept it via extension.
type ChartPointExtended = ChartSeries['points'][number] & { lowConfidence?: boolean }
type ChartSeriesExtended = Omit<ChartSeries, 'points'> & { points: ChartPointExtended[] }

export interface LineOptions {
  showArea?: boolean
  showMarkLine?: boolean
  markLineValue?: number
  markLineLabel?: string
  yAxisLabel?: string
  yAxisMin?: number
  yAxisMax?: number
  dataZoom?: boolean
}

export function buildLineOption(series: ChartSeriesExtended[], options?: LineOptions): EChartsOption {
  return {
    xAxis: { type: 'time' },
    yAxis: {
      type: 'value',
      name: options?.yAxisLabel,
      min: options?.yAxisMin,
      max: options?.yAxisMax,
      nameTextStyle: { fontSize: 11, padding: [0, 0, 0, -40] },
    },
    series: series.map((s) => ({
      name: s.label,
      type: 'line' as const,
      data: s.points.map(p => [p.t, p.v]),
      lineStyle: s.points.some(p => p.lowConfidence) ? { type: 'dashed' as const, opacity: 0.6 } : undefined,
      areaStyle: options?.showArea ? { opacity: 0.08 } : undefined,
      color: s.color,
      markLine: options?.showMarkLine ? {
        data: [{ yAxis: options.markLineValue, name: options.markLineLabel }],
        silent: true,
      } : undefined,
    })),
    dataZoom: options?.dataZoom ? [
      { type: 'inside' },
      { type: 'slider', bottom: 10, height: 20 },
    ] : undefined,
  }
}

export function buildBarOption(
  series: ChartSeriesExtended[],
  options?: { stacked?: boolean; horizontal?: boolean; categories?: string[] },
): EChartsOption {
  const isHoriz = options?.horizontal
  return {
    [isHoriz ? 'yAxis' : 'xAxis']: options?.categories
      ? { type: 'category', data: options.categories }
      : { type: 'time' },
    [isHoriz ? 'xAxis' : 'yAxis']: { type: 'value' },
    series: series.map((s) => ({
      name: s.label,
      type: 'bar' as const,
      data: options?.categories
        ? s.points.map(p => p.v)
        : s.points.map(p => [p.t, p.v]),
      stack: options?.stacked ? 'total' : undefined,
      color: s.color,
    })),
  }
}

export function buildScatterOption(series: ChartSeriesExtended[]): EChartsOption {
  return {
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    series: series.map((s) => ({
      name: s.label,
      type: 'scatter' as const,
      data: s.points.map(p => [p.t, p.v]),
      color: s.color,
    })),
  }
}

export function buildGaugeOption(
  value: number,
  options?: {
    min?: number
    max?: number
    thresholds?: Array<{ value: number; color: string; label: string }>
  },
): EChartsOption {
  const min = options?.min ?? 0
  const max = options?.max ?? 100
  return {
    series: [{
      type: 'gauge' as const,
      min, max,
      startAngle: 180,
      endAngle: 0,
      pointer: { show: true, length: '60%', width: 6 },
      axisLine: {
        lineStyle: {
          width: 20,
          color: options?.thresholds
            ? options.thresholds.map(t => [t.value / max, t.color] as [number, string])
            : [[0.33, '#EF4444'], [0.66, '#F59E0B'], [1, '#10B981']],
        },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        fontSize: 24,
        fontWeight: 700,
        offsetCenter: [0, '30%'],
        formatter: (val: number) => `${val.toFixed(1)}`,
      },
      data: [{ value }],
    }],
  }
}

export function buildHeatmapOption(
  data: Array<[number, number, number]>,
  xLabels: string[],
  yLabels: string[],
  options?: { colorRange?: [string, string, string] },
): EChartsOption {
  const colors = options?.colorRange ?? ['#1E293B', '#2563EB', '#6366F1']
  return {
    xAxis: { type: 'category', data: xLabels, splitArea: { show: true } },
    yAxis: { type: 'category', data: yLabels, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: Math.max(...data.map(d => d[2]), 1),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: colors },
    },
    series: [{
      type: 'heatmap' as const,
      data,
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    }],
  }
}

export function buildStackedAreaOption(series: ChartSeriesExtended[]): EChartsOption {
  return {
    xAxis: { type: 'time' },
    yAxis: { type: 'value' },
    series: series.map((s) => ({
      name: s.label,
      type: 'line' as const,
      stack: 'total',
      areaStyle: { opacity: 0.4 },
      data: s.points.map(p => [p.t, p.v]),
      color: s.color,
    })),
  }
}

export const CHART_CONFIG: Record<string, {
  builder: string
  yAxisLabel?: string
  showArea?: boolean
  stacked?: boolean
}> = {
  'all-in-cost': { builder: 'line', yAxisLabel: '%', showArea: true },
  'fx-markup': { builder: 'line', yAxisLabel: 'bps' },
  'fee-vs-markup': { builder: 'stackedArea' },
  'spread-distribution': { builder: 'bar', yAxisLabel: 'bps' },
  'provider-winner': { builder: 'bar', stacked: true },
  'leader-change-frequency': { builder: 'line', yAxisLabel: 'flips/day' },
  'leader-edge': { builder: 'line', yAxisLabel: 'bps' },
  'pass-through-latency': { builder: 'line', yAxisLabel: 'min' },
  'volatility-pulse': { builder: 'bar', yAxisLabel: 'bps' },
  'quote-anomalies': { builder: 'scatter' },
  'spread-volatility': { builder: 'line', yAxisLabel: 'bps' },
  'quote-success': { builder: 'line', yAxisLabel: '%' },
  'provider-availability': { builder: 'line', yAxisLabel: 'count' },
  'data-freshness': { builder: 'line', yAxisLabel: 'min' },
  'corridor-liquidity': { builder: 'line', yAxisLabel: 'index' },
  'indices-confidence': { builder: 'line', yAxisLabel: '%' },
  'indices-provider-count': { builder: 'line', yAxisLabel: 'count' },
  'indices-suppression': { builder: 'bar' },
}

export function buildChartOption(
  chartId: string,
  series: ChartSeriesExtended[],
  extraOptions?: Partial<LineOptions>,
): EChartsOption {
  const config = CHART_CONFIG[chartId]
  if (!config) return buildLineOption(series)

  const opts: LineOptions = { yAxisLabel: config.yAxisLabel, showArea: config.showArea, ...extraOptions }

  switch (config.builder) {
    case 'line': return buildLineOption(series, opts)
    case 'bar': return buildBarOption(series, { stacked: config.stacked })
    case 'scatter': return buildScatterOption(series)
    case 'stackedArea': return buildStackedAreaOption(series)
    default: return buildLineOption(series, opts)
  }
}
