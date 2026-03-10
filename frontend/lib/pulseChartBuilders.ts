import type { EChartsOption } from 'echarts'
import type { ChartSeries } from '~/types/pulse'

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
  smooth?: boolean
  valueFormatter?: (value: number, seriesName?: string) => string
}

export type WinnerTimelinePoint = {
  timestamp: number
  provider: string
  color: string
  detail?: string
}

export type LeaderChangePoint = {
  timestamp: number
  from?: string
  to?: string
  changed: boolean
}

export type ProviderHeatmapCell = {
  timestamp: number
  provider: string
  value: number
  detail?: string
}

export const PULSE_CHART_COLORS = {
  brand: '#2563EB',
  navy: '#0B1F59',
  tint: '#8CB8FF',
  tintSoft: '#DCEAFE',
  slate: '#5A6F9E',
  grid: '#D9E5F6',
  axis: '#5D6B86',
  text: '#14213D',
  tooltipBg: '#0B1F59',
  tooltipBorder: '#1E4FBF',
  success: '#0F9D71',
  warning: '#D97706',
  danger: '#DC2626',
} as const

const formatShortDate = (timestamp: number): string => new Date(timestamp).toLocaleDateString(
  'en-US',
  { month: 'short', day: 'numeric' },
)

const formatShortDateTime = (timestamp: number): string => new Date(timestamp).toLocaleString(
  'en-US',
  {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
)

const safeValue = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatPercent = (value: number, digits = 2) => `${value.toFixed(digits)}%`
const formatBps = (value: number) => `${Math.round(value)} bps`
const formatMinutes = (value: number) => `${Math.round(value)} min`
const formatCount = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1)

const formatAxisValue = (value: number, label?: string): string => {
  if (!label) return value.toFixed(2)
  const normalized = label.toLowerCase()
  if (normalized.includes('bps')) return formatBps(value)
  if (normalized.includes('%')) return formatPercent(value)
  if (normalized.includes('min')) return formatMinutes(value)
  if (normalized.includes('count') || normalized.includes('provider') || normalized.includes('flips')) return formatCount(value)
  return value.toFixed(2)
}

const baseGrid = {
  left: 56,
  right: 28,
  top: 40,
  bottom: 28,
}

const baseLegend = {
  top: 0,
  icon: 'roundRect',
  itemWidth: 12,
  itemHeight: 8,
  textStyle: {
    color: PULSE_CHART_COLORS.axis,
    fontSize: 12,
  },
}

const baseTooltip = {
  trigger: 'axis' as const,
  confine: true,
  backgroundColor: PULSE_CHART_COLORS.tooltipBg,
  borderColor: PULSE_CHART_COLORS.tooltipBorder,
  borderWidth: 1,
  textStyle: {
    color: '#F8FBFF',
    fontSize: 12,
  },
  extraCssText: 'box-shadow: 0 12px 32px rgba(11,31,89,0.24); border-radius: 12px;',
  axisPointer: {
    type: 'line' as const,
    lineStyle: {
      color: '#9DBDFF',
      opacity: 0.45,
      width: 1,
    },
  },
}

const buildAxisTooltipFormatter = (
  formatter: (value: number, seriesName?: string) => string,
) => (rawParams: unknown) => {
  const params = Array.isArray(rawParams)
    ? rawParams as Array<Record<string, any>>
    : [rawParams as Record<string, any>]

  if (!params.length) return ''

  const first = params[0]
  const timestamp = safeValue(first?.axisValue ?? first?.value?.[0] ?? first?.data?.[0])
  const title = timestamp === null ? 'Selected period' : formatShortDateTime(timestamp)

  const rows = params
    .map((item) => {
      const value = safeValue(item?.data?.[1] ?? item?.value?.[1] ?? item?.value)
      if (value === null) return null
      return `${item?.marker ?? ''}${item?.seriesName ?? 'Series'}: ${formatter(value, item?.seriesName)}`
    })
    .filter(Boolean)

  return [title, ...rows].join('<br/>')
}

const buildCategoryTooltipFormatter = (
  formatter: (value: number, seriesName?: string) => string,
) => (rawParams: unknown) => {
  const params = Array.isArray(rawParams)
    ? rawParams as Array<Record<string, any>>
    : [rawParams as Record<string, any>]

  if (!params.length) return ''

  const title = String(params[0]?.axisValueLabel ?? params[0]?.name ?? 'Selected value')
  const rows = params
    .map((item) => {
      const value = safeValue(item?.data?.value?.[2] ?? item?.data?.[1] ?? item?.value?.[1] ?? item?.value)
      if (value === null) return null
      return `${item?.marker ?? ''}${item?.seriesName ?? 'Series'}: ${formatter(value, item?.seriesName)}`
    })
    .filter(Boolean)

  return [title, ...rows].join('<br/>')
}

export function buildLineOption(series: ChartSeriesExtended[], options?: LineOptions): EChartsOption {
  const formatter = options?.valueFormatter ?? ((value: number) => formatAxisValue(value, options?.yAxisLabel))

  return {
    animation: false,
    color: series.map((entry, index) => entry.color || [PULSE_CHART_COLORS.brand, PULSE_CHART_COLORS.navy, PULSE_CHART_COLORS.tint][index % 3]),
    tooltip: {
      ...baseTooltip,
      formatter: buildAxisTooltipFormatter(formatter),
    },
    legend: series.length > 1 ? baseLegend : undefined,
    grid: baseGrid,
    xAxis: {
      type: 'time',
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatShortDate(value),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: options?.yAxisLabel,
      min: options?.yAxisMin,
      max: options?.yAxisMax,
      nameTextStyle: {
        color: PULSE_CHART_COLORS.axis,
        fontSize: 11,
        padding: [0, 0, 6, 0],
      },
      axisLine: { show: false },
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatAxisValue(value, options?.yAxisLabel),
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: PULSE_CHART_COLORS.grid,
          type: 'dashed',
        },
      },
    },
    dataZoom: options?.dataZoom ? [{ type: 'inside' }] : undefined,
    series: series.map((entry) => ({
      name: entry.label,
      type: 'line' as const,
      smooth: options?.smooth ?? true,
      data: entry.points.map(point => [point.t, point.v]),
      showSymbol: false,
      connectNulls: false,
      color: entry.color,
      lineStyle: {
        width: 3,
        type: entry.points.some(point => point.lowConfidence) ? 'dashed' : 'solid',
        opacity: entry.points.some(point => point.lowConfidence) ? 0.75 : 1,
      },
      areaStyle: options?.showArea ? { opacity: 0.12 } : undefined,
      markLine: options?.showMarkLine
        ? {
            silent: true,
            symbol: 'none',
            label: {
              color: PULSE_CHART_COLORS.axis,
              formatter: options.markLineLabel,
            },
            lineStyle: {
              color: PULSE_CHART_COLORS.slate,
              type: 'dashed',
            },
            data: [{ yAxis: options.markLineValue }],
          }
        : undefined,
      emphasis: {
        focus: 'series',
      },
    })),
  }
}

export function buildCostMarkupDualAxisOption(
  costSeries: ChartSeriesExtended[],
  markupSeries: ChartSeriesExtended[],
): EChartsOption {
  const decoratedCost = costSeries.map((series) => ({
    ...series,
    label: costSeries.length === 1 ? 'All-in cost' : `All-in cost · ${series.label}`,
    color: PULSE_CHART_COLORS.navy,
  }))
  const decoratedMarkup = markupSeries.map((series) => ({
    ...series,
    label: markupSeries.length === 1 ? 'FX markup' : `FX markup · ${series.label}`,
    color: PULSE_CHART_COLORS.brand,
  }))
  const combined = [...decoratedCost, ...decoratedMarkup]

  return {
    animation: false,
    color: combined.map(item => item.color),
    tooltip: {
      ...baseTooltip,
      formatter: (rawParams: unknown) => {
        const params = Array.isArray(rawParams)
          ? rawParams as Array<Record<string, any>>
          : [rawParams as Record<string, any>]
        if (!params.length) return ''

        const timestamp = safeValue(params[0]?.axisValue ?? params[0]?.value?.[0] ?? params[0]?.data?.[0])
        const title = timestamp === null ? 'Selected period' : formatShortDateTime(timestamp)

        const rows = params.map((item) => {
          const value = safeValue(item?.data?.[1] ?? item?.value?.[1] ?? item?.value)
          if (value === null) return ''
          const isMarkup = Number(item?.seriesIndex ?? 0) >= decoratedCost.length
          return `${item?.marker ?? ''}${item?.seriesName}: ${isMarkup ? formatBps(value) : formatPercent(value)}`
        })

        return [title, ...rows].join('<br/>')
      },
    },
    legend: baseLegend,
    grid: {
      left: 64,
      right: 64,
      top: 52,
      bottom: 32,
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatShortDate(value),
      },
      splitLine: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Cost %',
        axisLine: { show: false },
        axisLabel: {
          color: PULSE_CHART_COLORS.axis,
          formatter: (value: number) => formatPercent(value),
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: PULSE_CHART_COLORS.grid,
            type: 'dashed',
          },
        },
      },
      {
        type: 'value',
        name: 'FX markup',
        axisLine: { show: false },
        axisLabel: {
          color: PULSE_CHART_COLORS.axis,
          formatter: (value: number) => formatBps(value),
        },
        splitLine: { show: false },
      },
    ],
    series: combined.map((series, index) => ({
      name: series.label,
      type: 'line' as const,
      smooth: true,
      yAxisIndex: index >= decoratedCost.length ? 1 : 0,
      data: series.points.map(point => [point.t, point.v]),
      showSymbol: false,
      color: series.color,
      lineStyle: {
        width: 3,
        type: index >= decoratedCost.length ? 'dashed' : 'solid',
      },
      areaStyle: index < decoratedCost.length
        ? {
            opacity: 0.12,
            color: PULSE_CHART_COLORS.tint,
          }
        : undefined,
      emphasis: { focus: 'series' },
    })),
  }
}

export function buildBarOption(
  series: ChartSeriesExtended[],
  options?: { stacked?: boolean; horizontal?: boolean; categories?: string[]; yAxisLabel?: string },
): EChartsOption {
  const isHorizontal = options?.horizontal
  const formatter = (value: number) => formatAxisValue(value, options?.yAxisLabel)

  return {
    animation: false,
    color: series.map((entry, index) => entry.color || [PULSE_CHART_COLORS.brand, PULSE_CHART_COLORS.navy, PULSE_CHART_COLORS.tint][index % 3]),
    tooltip: {
      ...baseTooltip,
      trigger: 'axis',
      formatter: buildCategoryTooltipFormatter(formatter),
    },
    legend: series.length > 1 ? baseLegend : undefined,
    grid: {
      ...baseGrid,
      bottom: 36,
    },
    [isHorizontal ? 'yAxis' : 'xAxis']: options?.categories
      ? {
          type: 'category',
          data: options.categories,
          axisLabel: { color: PULSE_CHART_COLORS.axis },
          splitLine: { show: false },
        }
      : {
          type: 'time',
          axisLabel: {
            color: PULSE_CHART_COLORS.axis,
            formatter: (value: number) => formatShortDate(value),
          },
          splitLine: { show: false },
        },
    [isHorizontal ? 'xAxis' : 'yAxis']: {
      type: 'value',
      name: options?.yAxisLabel,
      nameTextStyle: { color: PULSE_CHART_COLORS.axis },
      axisLine: { show: false },
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatter(value),
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: PULSE_CHART_COLORS.grid,
          type: 'dashed',
        },
      },
    },
    series: series.map((entry) => ({
      name: entry.label,
      type: 'bar' as const,
      stack: options?.stacked ? 'total' : undefined,
      barMaxWidth: 22,
      itemStyle: {
        color: entry.color,
        borderRadius: isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0],
      },
      data: options?.categories
        ? entry.points.map(point => point.v)
        : entry.points.map(point => [point.t, point.v]),
    })),
  }
}

export function buildScatterOption(series: ChartSeriesExtended[]): EChartsOption {
  return {
    animation: false,
    color: series.map(entry => entry.color),
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: PULSE_CHART_COLORS.tooltipBg,
      borderColor: PULSE_CHART_COLORS.tooltipBorder,
      formatter: (rawParams: unknown) => {
        const param = rawParams as Record<string, any>
        const x = safeValue(param?.value?.[0] ?? param?.data?.[0])
        const y = safeValue(param?.value?.[1] ?? param?.data?.[1])
        return [
          param?.seriesName ?? 'Point',
          x === null ? '' : `X: ${x.toFixed(2)}`,
          y === null ? '' : `Y: ${y.toFixed(2)}`,
        ].filter(Boolean).join('<br/>')
      },
    },
    grid: baseGrid,
    xAxis: {
      type: 'value',
      axisLabel: { color: PULSE_CHART_COLORS.axis },
      splitLine: { lineStyle: { color: PULSE_CHART_COLORS.grid, type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: PULSE_CHART_COLORS.axis },
      splitLine: { lineStyle: { color: PULSE_CHART_COLORS.grid, type: 'dashed' } },
    },
    series: series.map((entry) => ({
      name: entry.label,
      type: 'scatter' as const,
      data: entry.points.map(point => [point.t, point.v]),
      itemStyle: { color: entry.color },
      symbolSize: 10,
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
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: PULSE_CHART_COLORS.tooltipBg,
      borderColor: PULSE_CHART_COLORS.tooltipBorder,
      formatter: () => `Current score: ${value.toFixed(0)} / ${max}`,
    },
    series: [{
      type: 'gauge' as const,
      min,
      max,
      startAngle: 210,
      endAngle: -30,
      pointer: {
        show: true,
        width: 5,
        itemStyle: { color: PULSE_CHART_COLORS.navy },
      },
      progress: { show: true, roundCap: true, width: 14, itemStyle: { color: PULSE_CHART_COLORS.brand } },
      axisLine: {
        roundCap: true,
        lineStyle: {
          width: 14,
          color: [[1, PULSE_CHART_COLORS.tintSoft]],
        },
      },
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      anchor: { show: true, showAbove: true, size: 10, itemStyle: { color: PULSE_CHART_COLORS.navy } },
      detail: {
        valueAnimation: false,
        offsetCenter: [0, '22%'],
        fontSize: 28,
        fontWeight: 700,
        color: PULSE_CHART_COLORS.text,
        formatter: (next: number) => `${next.toFixed(0)}`,
      },
      title: { show: false },
      data: [{ value }],
    }],
  }
}

export function buildHeatmapOption(
  data: Array<[number, number, number]>,
  xLabels: string[],
  yLabels: string[],
  options?: {
    colorRange?: [string, string, string]
    tooltipFormatter?: (xLabel: string, yLabel: string, value: number) => string
  },
): EChartsOption {
  const colors = options?.colorRange ?? [PULSE_CHART_COLORS.tintSoft, PULSE_CHART_COLORS.brand, PULSE_CHART_COLORS.navy]
  return {
    animation: false,
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: PULSE_CHART_COLORS.tooltipBg,
      borderColor: PULSE_CHART_COLORS.tooltipBorder,
      formatter: (rawParams: unknown) => {
        const param = rawParams as Record<string, any>
        const [xIndex, yIndex, rawValue] = param?.value ?? []
        const xLabel = xLabels[xIndex] ?? '—'
        const yLabel = yLabels[yIndex] ?? '—'
        const value = safeValue(rawValue) ?? 0
        return options?.tooltipFormatter
          ? options.tooltipFormatter(xLabel, yLabel, value)
          : `${yLabel}<br/>${xLabel}: ${value}`
      },
    },
    grid: {
      left: 72,
      right: 18,
      top: 18,
      bottom: 46,
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      splitArea: { show: false },
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        interval: 0,
        rotate: xLabels.length > 10 ? 35 : 0,
      },
    },
    yAxis: {
      type: 'category',
      data: yLabels,
      splitArea: { show: false },
      axisLabel: { color: PULSE_CHART_COLORS.axis },
    },
    visualMap: {
      min: 0,
      max: Math.max(...data.map(item => item[2]), 1),
      show: false,
      calculable: false,
      inRange: { color: colors },
    },
    series: [{
      type: 'heatmap' as const,
      data,
      itemStyle: {
        borderColor: '#FFFFFF',
        borderWidth: 1,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(11, 31, 89, 0.22)',
        },
      },
    }],
  }
}

export function buildStackedAreaOption(series: ChartSeriesExtended[]): EChartsOption {
  return {
    animation: false,
    color: series.map((entry, index) => entry.color || [PULSE_CHART_COLORS.tint, PULSE_CHART_COLORS.brand, PULSE_CHART_COLORS.navy][index % 3]),
    tooltip: {
      ...baseTooltip,
      formatter: buildAxisTooltipFormatter((value) => formatBps(value)),
    },
    legend: series.length > 1 ? baseLegend : undefined,
    grid: baseGrid,
    xAxis: {
      type: 'time',
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatShortDate(value),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'bps',
      axisLine: { show: false },
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatBps(value),
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: PULSE_CHART_COLORS.grid,
          type: 'dashed',
        },
      },
    },
    series: series.map((entry, index) => ({
      name: entry.label,
      type: 'line' as const,
      smooth: true,
      stack: 'cost',
      data: entry.points.map(point => [point.t, point.v]),
      showSymbol: false,
      color: entry.color || [PULSE_CHART_COLORS.tint, PULSE_CHART_COLORS.brand, PULSE_CHART_COLORS.navy][index % 3],
      lineStyle: { width: 2.5 },
      areaStyle: { opacity: index === 0 ? 0.16 : 0.22 },
    })),
  }
}

export function buildSpreadBandOption(series: ChartSeriesExtended[]): EChartsOption {
  const ordered = [...series].sort((left, right) => left.label.localeCompare(right.label))

  return {
    animation: false,
    color: [
      PULSE_CHART_COLORS.tint,
      PULSE_CHART_COLORS.brand,
      PULSE_CHART_COLORS.navy,
    ],
    tooltip: {
      ...baseTooltip,
      formatter: buildAxisTooltipFormatter((value, seriesName) => `${seriesName ?? 'Spread'}: ${formatBps(value)}`),
    },
    legend: baseLegend,
    grid: baseGrid,
    xAxis: {
      type: 'time',
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatShortDate(value),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Spread',
      axisLine: { show: false },
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatBps(value),
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: PULSE_CHART_COLORS.grid,
          type: 'dashed',
        },
      },
    },
    series: ordered.map((entry, index) => ({
      name: entry.label,
      type: 'line' as const,
      smooth: true,
      data: entry.points.map(point => [point.t, point.v]),
      showSymbol: false,
      color: entry.color || [PULSE_CHART_COLORS.tint, PULSE_CHART_COLORS.brand, PULSE_CHART_COLORS.navy][index % 3],
      lineStyle: {
        width: entry.label.toLowerCase().includes('50') ? 3 : 2,
      },
      areaStyle: entry.label.toLowerCase().includes('75')
        ? {
            opacity: 0.08,
            color: PULSE_CHART_COLORS.tint,
          }
        : undefined,
    })),
  }
}

export function buildRibbonOption(
  series: ChartSeriesExtended[],
  options?: { yAxisLabel?: string },
): EChartsOption {
  return buildLineOption(series, {
    yAxisLabel: options?.yAxisLabel,
    showArea: true,
    smooth: true,
  })
}

export function buildTreemapOption(
  data: Array<{ name: string; value: number; itemStyle?: { color: string } }>,
): EChartsOption {
  return {
    series: [{
      type: 'treemap' as const,
      data,
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      label: {
        show: true,
        formatter: '{b}\n{c}',
        fontSize: 12,
        color: '#FFFFFF',
      },
      itemStyle: {
        borderColor: '#FFFFFF',
        borderWidth: 2,
        gapWidth: 2,
      },
      levels: [{
        itemStyle: {
          borderColor: '#FFFFFF',
          borderWidth: 3,
          gapWidth: 3,
        },
      }],
    }],
  }
}

export function buildTimelineOption(
  events: Array<{ timestamp: number; severity: string; count?: number }>,
  options?: { colorMap?: Record<string, string> },
): EChartsOption {
  const colorMap = options?.colorMap ?? {
    critical: PULSE_CHART_COLORS.danger,
    warning: PULSE_CHART_COLORS.warning,
    info: PULSE_CHART_COLORS.brand,
  }

  return {
    animation: false,
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: PULSE_CHART_COLORS.tooltipBg,
      borderColor: PULSE_CHART_COLORS.tooltipBorder,
      formatter: (rawParams: unknown) => {
        const param = rawParams as Record<string, any>
        const timestamp = safeValue(param?.value?.[0])
        return [
          timestamp === null ? 'Event' : formatShortDateTime(timestamp),
          param?.seriesName ?? 'Signal',
        ].join('<br/>')
      },
    },
    grid: baseGrid,
    xAxis: {
      type: 'time',
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatShortDate(value),
      },
    },
    yAxis: {
      show: false,
      max: 1,
    },
    series: [{
      type: 'scatter' as const,
      data: events.map(event => ({
        value: [event.timestamp, 0.5],
        itemStyle: { color: colorMap[event.severity] ?? PULSE_CHART_COLORS.brand },
        symbolSize: Math.min(8 + (event.count ?? 1) * 3, 24),
      })),
    }],
  }
}

export function buildWinnerTimelineOption(points: WinnerTimelinePoint[]): EChartsOption {
  const xLabels = points.map(point => formatShortDate(point.timestamp))

  return {
    animation: false,
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: PULSE_CHART_COLORS.tooltipBg,
      borderColor: PULSE_CHART_COLORS.tooltipBorder,
      formatter: (rawParams: unknown) => {
        const param = rawParams as Record<string, any>
        const dataIndex = safeValue(param?.dataIndex) ?? 0
        const point = points[dataIndex] ?? points[0]
        return [
          formatShortDateTime(point.timestamp),
          `Leader: ${point.provider}`,
          point.detail ?? '',
        ].filter(Boolean).join('<br/>')
      },
    },
    grid: {
      left: 18,
      right: 18,
      top: 18,
      bottom: 42,
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        interval: 0,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { show: false },
    },
    series: [{
      type: 'bar' as const,
      barGap: '0%',
      barCategoryGap: '4%',
      barMaxWidth: 36,
      data: points.map((point, index) => ({
        value: 1,
        itemStyle: {
          color: point.color,
          borderRadius: [8, 8, 8, 8],
        },
        label: {
          show: points.length <= 10,
          color: '#FFFFFF',
          fontSize: 11,
          formatter: point.provider,
        },
      })),
    }],
  }
}

export function buildLeaderChangeFrequencyOption(points: LeaderChangePoint[]): EChartsOption {
  const xLabels = points.map(point => formatShortDate(point.timestamp))
  const changeCount = points.filter(point => point.changed).length

  return {
    animation: false,
    tooltip: {
      ...baseTooltip,
      trigger: 'item',
      formatter: (rawParams: unknown) => {
        const param = rawParams as Record<string, any>
        const index = safeValue(param?.dataIndex) ?? 0
        const point = points[index] ?? points[0]
        return [
          formatShortDateTime(point.timestamp),
          point.changed
            ? `Leader flipped: ${point.from ?? '—'} → ${point.to ?? '—'}`
            : 'Leader held steady',
        ].join('<br/>')
      },
    },
    grid: {
      ...baseGrid,
      bottom: 42,
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        interval: 0,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Changes',
      min: 0,
      max: 1.4,
      axisLine: { show: false },
      axisLabel: { color: PULSE_CHART_COLORS.axis },
      splitLine: {
        show: true,
        lineStyle: {
          color: PULSE_CHART_COLORS.grid,
          type: 'dashed',
        },
      },
    },
    series: [{
      name: 'Leader change',
      type: 'bar' as const,
      barMaxWidth: 18,
      data: points.map(point => ({
        value: point.changed ? 1 : 0,
        itemStyle: {
          color: point.changed ? PULSE_CHART_COLORS.brand : PULSE_CHART_COLORS.tintSoft,
          borderRadius: [6, 6, 0, 0],
        },
      })),
      markLine: {
        silent: true,
        symbol: 'none',
        label: {
          color: PULSE_CHART_COLORS.axis,
          formatter: `Total changes: ${changeCount}`,
        },
        lineStyle: {
          color: PULSE_CHART_COLORS.slate,
          type: 'dashed',
        },
        data: [{ yAxis: 0.5 }],
      },
    }],
  }
}

export function buildProviderWinHeatmapOption(
  dates: number[],
  providers: string[],
  cells: ProviderHeatmapCell[],
): EChartsOption {
  const xLabels = dates.map(value => formatShortDate(value))
  const providerIndex = new Map(providers.map((provider, index) => [provider, index]))
  const dateIndex = new Map(dates.map((date, index) => [date, index]))

  return buildHeatmapOption(
    cells.map((cell) => [
      dateIndex.get(cell.timestamp) ?? 0,
      providerIndex.get(cell.provider) ?? 0,
      cell.value,
    ]),
    xLabels,
    providers,
    {
      colorRange: [PULSE_CHART_COLORS.tintSoft, '#7FAEFF', PULSE_CHART_COLORS.navy],
      tooltipFormatter: (xLabel, yLabel, value) => {
        const match = cells.find((cell) => formatShortDate(cell.timestamp) === xLabel && cell.provider === yLabel)
        if (!match) return `${yLabel}<br/>${xLabel}: ${value}`
        return [
          `${yLabel}`,
          `${xLabel}`,
          value > 0 ? 'Won this publication' : 'Did not lead',
          match.detail ?? '',
        ].filter(Boolean).join('<br/>')
      },
    },
  )
}

export function buildBankVsSpecialistTrendOption(
  bankSeries: ChartSeriesExtended[],
  specialistSeries: ChartSeriesExtended[],
): EChartsOption {
  const series = [
    ...bankSeries.map((entry) => ({ ...entry, color: PULSE_CHART_COLORS.navy, label: entry.label || 'Bank average cost' })),
    ...specialistSeries.map((entry) => ({ ...entry, color: PULSE_CHART_COLORS.brand, label: entry.label || 'Best specialist cost' })),
  ]

  return {
    animation: false,
    color: series.map(entry => entry.color),
    tooltip: {
      ...baseTooltip,
      formatter: buildAxisTooltipFormatter((value) => formatPercent(value)),
    },
    legend: baseLegend,
    grid: baseGrid,
    xAxis: {
      type: 'time',
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatShortDate(value),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Cost %',
      axisLine: { show: false },
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatPercent(value),
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: PULSE_CHART_COLORS.grid,
          type: 'dashed',
        },
      },
    },
    series: series.map((entry, index) => ({
      name: entry.label,
      type: 'line' as const,
      smooth: true,
      data: entry.points.map(point => [point.t, point.v]),
      showSymbol: false,
      color: entry.color,
      lineStyle: {
        width: 3,
      },
      areaStyle: index === 0
        ? { opacity: 0.08, color: PULSE_CHART_COLORS.tint }
        : undefined,
    })),
  }
}

export function buildIndicesMultiLineOption(
  teerSeries: ChartSeriesExtended | null,
  rciSeries: ChartSeriesExtended | null,
  rviSeries: ChartSeriesExtended | null,
  visibleIndices: { teer: boolean; rci: boolean; rvi: boolean },
): EChartsOption {
  const allSeries: EChartsOption['series'] = []

  if (visibleIndices.teer && teerSeries) {
    ;(allSeries as any[]).push({
      name: 'TEER',
      type: 'line',
      smooth: true,
      data: teerSeries.points.map(point => [point.t, point.v]),
      color: PULSE_CHART_COLORS.brand,
      yAxisIndex: 0,
      showSymbol: false,
      lineStyle: { width: 3 },
      areaStyle: { opacity: 0.08 },
    })
  }
  if (visibleIndices.rci && rciSeries) {
    ;(allSeries as any[]).push({
      name: 'RCI',
      type: 'line',
      smooth: true,
      data: rciSeries.points.map(point => [point.t, point.v]),
      color: PULSE_CHART_COLORS.navy,
      yAxisIndex: 0,
      showSymbol: false,
      lineStyle: { width: 3 },
    })
  }
  if (visibleIndices.rvi && rviSeries) {
    ;(allSeries as any[]).push({
      name: 'RVI',
      type: 'line',
      smooth: true,
      data: rviSeries.points.map(point => [point.t, point.v]),
      color: PULSE_CHART_COLORS.tint,
      yAxisIndex: 1,
      showSymbol: false,
      lineStyle: { width: 3, type: 'dashed' },
    })
  }

  return {
    animation: false,
    color: [PULSE_CHART_COLORS.brand, PULSE_CHART_COLORS.navy, PULSE_CHART_COLORS.tint],
    tooltip: {
      ...baseTooltip,
      formatter: (rawParams: unknown) => {
        const params = Array.isArray(rawParams)
          ? rawParams as Array<Record<string, any>>
          : [rawParams as Record<string, any>]
        if (!params.length) return ''

        const timestamp = safeValue(params[0]?.axisValue ?? params[0]?.value?.[0] ?? params[0]?.data?.[0])
        const title = timestamp === null ? 'Selected period' : formatShortDateTime(timestamp)

        const rows = params.map((item) => {
          const value = safeValue(item?.data?.[1] ?? item?.value?.[1] ?? item?.value)
          if (value === null) return ''
          return `${item?.marker ?? ''}${item?.seriesName}: ${item?.seriesName === 'RVI' ? formatBps(value) : value.toFixed(item?.seriesName === 'RCI' ? 1 : 2)}`
        })

        return [title, ...rows].join('<br/>')
      },
    },
    legend: baseLegend,
    grid: {
      left: 56,
      right: 56,
      top: 48,
      bottom: 28,
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        color: PULSE_CHART_COLORS.axis,
        formatter: (value: number) => formatShortDate(value),
      },
      splitLine: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Index',
        axisLine: { show: false },
        axisLabel: { color: PULSE_CHART_COLORS.axis },
        splitLine: {
          show: true,
          lineStyle: {
            color: PULSE_CHART_COLORS.grid,
            type: 'dashed',
          },
        },
      },
      {
        type: 'value',
        name: 'RVI',
        axisLine: { show: false },
        axisLabel: {
          color: PULSE_CHART_COLORS.axis,
          formatter: (value: number) => formatBps(value),
        },
        splitLine: { show: false },
      },
    ],
    series: allSeries,
  }
}

export const CHART_CONFIG: Record<string, {
  builder: 'line' | 'bar' | 'scatter' | 'stackedArea' | 'spreadBand'
  yAxisLabel?: string
  showArea?: boolean
  stacked?: boolean
}> = {
  'all-in-cost': { builder: 'line', yAxisLabel: '%', showArea: true },
  'fx-markup': { builder: 'line', yAxisLabel: 'bps' },
  'fee-vs-markup': { builder: 'stackedArea' },
  'spread-distribution': { builder: 'spreadBand', yAxisLabel: 'bps' },
  'provider-winner': { builder: 'bar', stacked: true },
  'leader-change-frequency': { builder: 'bar', yAxisLabel: 'changes' },
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
  'teer-series': { builder: 'line', yAxisLabel: 'index', showArea: true },
  'rci-series': { builder: 'line', yAxisLabel: 'index' },
  'rvi-series': { builder: 'line', yAxisLabel: 'bps' },
  'anomaly-timeline': { builder: 'scatter' },
}

export function buildChartOption(
  chartId: string,
  series: ChartSeriesExtended[],
  extraOptions?: Partial<LineOptions>,
): EChartsOption {
  const config = CHART_CONFIG[chartId]
  if (!config) return buildLineOption(series, extraOptions)

  const lineOptions: LineOptions = {
    yAxisLabel: config.yAxisLabel,
    showArea: config.showArea,
    ...extraOptions,
  }

  switch (config.builder) {
    case 'line':
      return buildLineOption(series, lineOptions)
    case 'bar':
      return buildBarOption(series, { stacked: config.stacked, yAxisLabel: config.yAxisLabel })
    case 'scatter':
      return buildScatterOption(series)
    case 'stackedArea':
      return buildStackedAreaOption(series)
    case 'spreadBand':
      return buildSpreadBandOption(series)
    default:
      return buildLineOption(series, lineOptions)
  }
}
