import type { ChartCategory } from '~/types/pulse'

export const CATEGORY_ACCENT: Record<ChartCategory, string> = {
  'cost-markup': '#2563EB',
  'delivered-amount': '#6366F1',
  'volatility': '#818CF8',
  'availability': '#3B82F6',
}

export function getCategoryAccent(category: ChartCategory): string {
  return CATEGORY_ACCENT[category] ?? CATEGORY_ACCENT['cost-markup']
}

export const CHART_STYLE = {
  width: 800,
  height: 320,

  gradient: {
    topOpacity: 0.25,
    bottomOpacity: 0,
  },

  line: {
    strokeWidth: 2,
  },

  bar: {
    rx: 2,
    normalColor: '#2563EB',
    highlightColor: '#1D4ED8',
    thresholdColor: '#f59e0b',
  },

  grid: {
    dashArray: '4',
    opacity: 0.1,
  },

  axis: {
    fontSize: 11,
  },

  sparkline: {
    viewBox: '0 0 200 60',
    heightClass: 'h-14',
  },

  tooltip: 'rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 shadow-lg',
  card: 'rounded-xl border border-neutral-700 bg-neutral-800',
} as const
