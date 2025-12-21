export type AmountBucket = 100 | 200 | 500 | 1000

export type FundingMethod = 'bank' | 'card' | 'cash'

export type PayoutMethod = 'bank' | 'cash' | 'wallet'

export type TimeRange = '7d' | '30d' | '90d' | '365d'

export type ChartCategory = 'cost-markup' | 'delivered-amount' | 'volatility' | 'availability'

export type ChartType = 'line' | 'bar' | 'stacked' | 'scatter' | 'matrix'

export type ProvenanceTag = 'verified' | 'observed' | 'estimated'

export interface PulseFilters {
  corridor: string | 'global'
  amount: AmountBucket
  fundingMethod: FundingMethod
  payoutMethod: PayoutMethod
}

export interface ChartPoint {
  t: number
  v: number
  label?: string
}

export interface ChartSeries {
  id: string
  label: string
  color: string
  points: ChartPoint[]
}

export interface ChartMetadata {
  id: string
  title: string
  category: ChartCategory
  categoryLabel: string
  type: ChartType
  unit: string
  unitLabel: string
  description: string
  insightTemplate: string
  lastUpdated: string
  requiredFilters: (keyof PulseFilters)[]
  tooltipCopy: string
  sourceNotes: string
  defaultRange: TimeRange
  plusRanges: TimeRange[]
}

export interface ChartData {
  metadata: ChartMetadata
  series: ChartSeries[]
  annotations?: ChartAnnotation[]
  insight: string
}

export interface ChartAnnotation {
  t: number
  label: string
  type: 'event' | 'promo' | 'alert'
}

export interface HeadlineTile {
  id: string
  label: string
  value: string
  delta?: string
  deltaType?: 'positive' | 'negative' | 'neutral'
  deltaLabel?: string
  tooltip: string
  chartId?: string
  icon: string
}

export interface TableRow {
  timestamp: number
  provider: string
  deliveredAmount: number
  deliveredCurrency: string
  fee: number
  feeCurrency: string
  rate: number
  markupBps: number
  provenance: ProvenanceTag
}

export interface TableData {
  columns: TableColumn[]
  rows: TableRow[]
  totalRows: number
  page: number
  pageSize: number
}

export interface TableColumn {
  key: keyof TableRow
  label: string
  sortable: boolean
  align: 'left' | 'center' | 'right'
  format?: 'number' | 'currency' | 'date' | 'percent' | 'bps'
}

export interface PulseOverview {
  tiles: HeadlineTile[]
  charts: string[]
  lastUpdated: string
  corridorName?: string
}

export interface MethodCoverageRow {
  provider: string
  bank: boolean
  cash: boolean
  wallet: boolean
  card: boolean
  speed: string
}

export interface ProviderWinner {
  date: string
  provider: string
  edge: number
}

export interface CorridorOption {
  value: string
  label: string
  fromFlag: string
  toFlag: string
  fromCode: string
  toCode: string
}
