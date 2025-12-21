import type { ChartMetadata, ChartCategory } from '~/types/pulse'

export const CHART_CATEGORIES: Record<ChartCategory, { label: string; order: number }> = {
  'cost-markup': { label: 'Cost & Markup', order: 1 },
  'delivered-amount': { label: 'Delivered Amount', order: 2 },
  'volatility': { label: 'Volatility & Stability', order: 3 },
  'availability': { label: 'Availability & Reliability', order: 4 },
}

export const PROVIDER_COLORS: Record<string, string> = {
  wise: '#00b9ff',
  remitly: '#2ecc71',
  xe: '#9b59b6',
  xoom: '#3498db',
  worldremit: '#e74c3c',
  sendwave: '#f39c12',
  westernunion: '#ffd700',
  moneygram: '#e67e22',
  paypal: '#003087',
  revolut: '#0075eb',
  best: '#10b981',
}

export const pulseChartRegistry: ChartMetadata[] = [
  {
    id: 'all-in-cost',
    title: 'All-in Cost Index',
    category: 'cost-markup',
    categoryLabel: 'Cost & Markup',
    type: 'line',
    unit: 'percent',
    unitLabel: '%',
    description: 'Total cost including fees and FX markup as a percentage of send amount',
    insightTemplate: 'Costs {direction} {delta}% this week',
    lastUpdated: '',
    requiredFilters: ['corridor', 'amount', 'payoutMethod'],
    tooltipCopy: 'All-in cost = (fees + FX markup) / send amount. Lower is better.',
    sourceNotes: 'Calculated from live quotes captured every 15 minutes',
    defaultRange: '30d',
    plusRanges: ['90d', '365d'],
  },
  {
    id: 'fx-markup',
    title: 'FX Markup vs Mid-Market',
    category: 'cost-markup',
    categoryLabel: 'Cost & Markup',
    type: 'line',
    unit: 'bps',
    unitLabel: 'bps',
    description: 'Exchange rate markup compared to mid-market rate in basis points',
    insightTemplate: 'Median markup is {value} bps ({direction} {delta} bps vs 7d avg)',
    lastUpdated: '',
    requiredFilters: ['corridor', 'amount'],
    tooltipCopy: '1 basis point = 0.01%. A markup of 100 bps means you lose 1% on the exchange rate.',
    sourceNotes: 'Mid-market rate sourced from ECB/Fed reference rates',
    defaultRange: '30d',
    plusRanges: ['90d', '365d'],
  },
  {
    id: 'recipient-gets',
    title: 'Recipient Gets (Best Provider)',
    category: 'delivered-amount',
    categoryLabel: 'Delivered Amount',
    type: 'line',
    unit: 'currency',
    unitLabel: '',
    description: 'Amount received by recipient from the best provider over time',
    insightTemplate: 'Recipients get {direction} {delta} more than last week',
    lastUpdated: '',
    requiredFilters: ['corridor', 'amount', 'payoutMethod'],
    tooltipCopy: 'Shows the maximum amount your recipient would receive for the selected send amount.',
    sourceNotes: 'Best available quote at each time point',
    defaultRange: '30d',
    plusRanges: ['90d', '365d'],
  },
  {
    id: 'provider-winner',
    title: 'Provider Winner Timeline',
    category: 'delivered-amount',
    categoryLabel: 'Delivered Amount',
    type: 'stacked',
    unit: 'provider',
    unitLabel: '',
    description: 'Which provider offered the best rate each day',
    insightTemplate: '{provider} has been #1 for {days} of the last 30 days',
    lastUpdated: '',
    requiredFilters: ['corridor', 'amount', 'payoutMethod'],
    tooltipCopy: 'Shows which provider delivered the most value on each day.',
    sourceNotes: 'Based on "recipient gets" comparison at midday',
    defaultRange: '30d',
    plusRanges: ['90d', '365d'],
  },
  {
    id: 'volatility-pulse',
    title: 'Volatility Pulse',
    category: 'volatility',
    categoryLabel: 'Volatility & Stability',
    type: 'bar',
    unit: 'percent',
    unitLabel: '%',
    description: 'Day-to-day change in best delivered amount',
    insightTemplate: 'Volatility is {level} — {recommendation}',
    lastUpdated: '',
    requiredFilters: ['corridor', 'amount'],
    tooltipCopy: 'Higher volatility means rates change more day-to-day. Consider timing your transfer.',
    sourceNotes: 'Absolute percentage change between daily best quotes',
    defaultRange: '30d',
    plusRanges: ['90d', '365d'],
  },
  {
    id: 'quote-anomalies',
    title: 'Quote Stability',
    category: 'volatility',
    categoryLabel: 'Volatility & Stability',
    type: 'scatter',
    unit: 'deviation',
    unitLabel: 'σ',
    description: 'Identifies providers with unusual pricing deviations',
    insightTemplate: '{count} anomalies detected in the last 7 days',
    lastUpdated: '',
    requiredFilters: ['corridor', 'amount'],
    tooltipCopy: 'Points far from the center indicate unusual pricing that may be errors or temporary promos.',
    sourceNotes: 'Deviation from provider\'s 30-day rolling average',
    defaultRange: '7d',
    plusRanges: ['30d', '90d'],
  },
  {
    id: 'quote-success',
    title: 'Quote Success Rate',
    category: 'availability',
    categoryLabel: 'Availability & Reliability',
    type: 'line',
    unit: 'percent',
    unitLabel: '%',
    description: 'Percentage of successful quote fetches by provider',
    insightTemplate: 'Overall reliability is {value}% ({direction} {delta}% vs 7d avg)',
    lastUpdated: '',
    requiredFilters: ['corridor'],
    tooltipCopy: 'Higher success rate means the provider\'s quotes are more consistently available.',
    sourceNotes: 'Based on API response success rate',
    defaultRange: '30d',
    plusRanges: ['90d', '365d'],
  },
  {
    id: 'method-coverage',
    title: 'Method Coverage Matrix',
    category: 'availability',
    categoryLabel: 'Availability & Reliability',
    type: 'matrix',
    unit: 'boolean',
    unitLabel: '',
    description: 'Provider support for different payout methods',
    insightTemplate: '{count} providers support {method} for this corridor',
    lastUpdated: '',
    requiredFilters: ['corridor'],
    tooltipCopy: 'Shows which providers support each payout method for this corridor.',
    sourceNotes: 'Updated daily based on quote availability',
    defaultRange: '7d',
    plusRanges: [],
  },
]

export function getChartById(chartId: string): ChartMetadata | undefined {
  return pulseChartRegistry.find(chart => chart.id === chartId)
}

export function getChartsByCategory(category: ChartCategory): ChartMetadata[] {
  return pulseChartRegistry.filter(chart => chart.category === category)
}

export function getAllCategories(): { category: ChartCategory; label: string; charts: ChartMetadata[] }[] {
  return Object.entries(CHART_CATEGORIES)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([category, { label }]) => ({
      category: category as ChartCategory,
      label,
      charts: getChartsByCategory(category as ChartCategory),
    }))
}

export function getRelatedCharts(chartId: string, limit = 3): ChartMetadata[] {
  const chart = getChartById(chartId)
  if (!chart) return []
  
  const sameCategory = pulseChartRegistry
    .filter(c => c.category === chart.category && c.id !== chartId)
  
  const otherCharts = pulseChartRegistry
    .filter(c => c.category !== chart.category && c.id !== chartId)
  
  return [...sameCategory, ...otherCharts].slice(0, limit)
}

export function isRangeGated(chartId: string, range: string, isPlus: boolean): boolean {
  if (isPlus) return false
  const chart = getChartById(chartId)
  if (!chart) return false
  return chart.plusRanges.includes(range as '90d' | '365d')
}
