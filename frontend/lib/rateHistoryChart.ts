export type RateHistoryPoint = {
  rate: number
  date: string
}

export type ChartPoint = {
  x: number
  y: number
  rate: number
  date: string
}

type BuildRateHistoryChartPointsInput = {
  history: RateHistoryPoint[]
  isSameCurrency: boolean
  chartWidth: number
  chartHeight: number
  chartPadding: number
  chartLeftPadding: number
  chartTopPadding: number
  chartBottomPadding: number
  nowMs?: number
}

export function buildRateHistoryChartPoints(
  input: BuildRateHistoryChartPointsInput,
): ChartPoint[] {
  const {
    history,
    isSameCurrency,
    chartWidth,
    chartHeight,
    chartPadding,
    chartLeftPadding,
    chartTopPadding,
    chartBottomPadding,
    nowMs = Date.now(),
  } = input

  const usableWidth = chartWidth - chartLeftPadding - chartPadding
  const midY = chartTopPadding + 0.5 * (chartHeight - chartTopPadding - chartBottomPadding)

  if (isSameCurrency) {
    return Array.from({ length: 30 }, (_, idx) => {
      const x = chartLeftPadding + (idx / 29) * usableWidth
      return {
        x,
        y: midY,
        rate: 1.0,
        date: new Date(nowMs - (29 - idx) * 24 * 60 * 60 * 1000).toISOString(),
      }
    })
  }

  if (!history.length) return []

  const rates = history.map(point => point.rate)
  const minRate = Math.min(...rates)
  const maxRate = Math.max(...rates)
  const range = maxRate - minRate

  if (history.length === 1) {
    const point = history[0]
    return [
      {
        x: chartLeftPadding,
        y: midY,
        rate: point.rate,
        date: point.date,
      },
      {
        x: chartLeftPadding + usableWidth,
        y: midY,
        rate: point.rate,
        date: point.date,
      },
    ]
  }

  const span = history.length - 1

  return history.map((point, idx) => {
    const normalized = range > 0 ? (point.rate - minRate) / range : 0.5
    const x = chartLeftPadding + (idx / span) * usableWidth
    const y = chartTopPadding + (1 - normalized) * (chartHeight - chartTopPadding - chartBottomPadding)
    return {
      x,
      y,
      rate: point.rate,
      date: point.date,
    }
  })
}
