export type AmountBucket = 100 | 200 | 500 | 1000;

export type FundingMethod = 'bank' | 'card' | 'cash';

export type PayoutMethod = 'bank' | 'cash' | 'wallet' | 'airtime' | 'home' | 'card';

export type TimeRange = '7d' | '30d' | '90d' | '365d';

export type ChartCategory = 'cost-markup' | 'delivered-amount' | 'volatility' | 'availability';

export type ChartType = 'line' | 'bar' | 'stacked' | 'scatter' | 'matrix';

export type ProvenanceTag = 'verified' | 'observed' | 'estimated';

export interface PulseFilters {
  corridor: string | 'global';
  corridorId?: string;
  amount: AmountBucket;
  fundingMethod: FundingMethod;
  payoutMethod: PayoutMethod;
}

export interface ChartPoint {
  t: number;
  v: number;
  label?: string;
  confidence?: number;
}

export interface ChartSeries {
  id: string;
  label: string;
  color: string;
  points: ChartPoint[];
}

export interface ChartMetadata {
  id: string;
  title: string;
  category: ChartCategory;
  categoryLabel: string;
  type: ChartType;
  unit: string;
  unitLabel: string;
  description: string;
  insightTemplate: string;
  lastUpdated: string;
  requiredFilters: (keyof PulseFilters)[];
  tooltipCopy: string;
  sourceNotes: string;
  defaultRange: TimeRange;
  plusRanges: TimeRange[];
}

export interface ChartData {
  metadata: ChartMetadata;
  series: ChartSeries[];
  annotations?: ChartAnnotation[];
  insight: string;
  dataAvailable?: boolean;
  updatedAt?: string | null;
  source?: 'gold_export' | 'gold_cache' | 'none';
}

export interface ChartAnnotation {
  t: number;
  label: string;
  type: 'event' | 'promo' | 'alert';
}

export interface HeadlineTile {
  id: string;
  label: string;
  value: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  deltaLabel?: string;
  tooltip: string;
  chartId?: string;
  icon: string;
}

export interface TableRow {
  timestamp: number;
  provider: string;
  deliveredAmount: number;
  deliveredCurrency: string;
  fee: number;
  feeCurrency: string;
  rate: number;
  markupBps: number;
  provenance: ProvenanceTag;
}

export interface TableData {
  columns: TableColumn[];
  rows: TableRow[];
  totalRows: number;
  page: number;
  pageSize: number;
}

export interface TableColumn {
  key: keyof TableRow;
  label: string;
  sortable: boolean;
  align: 'left' | 'center' | 'right';
  format?: 'number' | 'currency' | 'date' | 'percent' | 'bps';
}

export interface PulseOverview {
  tiles: HeadlineTile[];
  charts: string[];
  lastUpdated: string;
  corridorName?: string;
}

export interface MethodCoverageRow {
  provider: string;
  bank: boolean;
  cash: boolean;
  wallet: boolean;
  card: boolean;
  speed: string;
}

export interface ProviderWinner {
  date: string;
  provider: string;
  edge: number;
}

export interface CorridorOption {
  // Backwards-compatible with legacy Pulse corridor payloads.
  value: string;
  label: string;
  fromFlag: string;
  toFlag: string;
  fromCode: string;
  toCode: string;

  // Gold-truth fields (preferred).
  corridorId?: string;
  slug?: string;
  sourceCountry?: string;
  destCountry?: string;
  sourceCurrency?: string;
  destCurrency?: string;
  minDate?: string | null;
  maxDate?: string | null;
  lastUpdated?: string | null;
  dataPoints?: number;
  dataTier?: string;
  collectionTier?: string;
  collectionCadenceMinutes?: number;
  exportCadenceMinutes?: number;
  isUsdOrigin?: boolean;
  daysAvailable?: number;
  sufficient?: boolean;
  dataAvailability?: {
    minDate?: string | null;
    maxDate?: string | null;
    daysAvailable: number;
    sufficient: boolean;
  };
  unsuppressedPoints?: number;
  suppressedPoints?: number;

  // Triangulation / stress fields.
  stressScore?: number | null;
  stressLevel?: string | null;
}

export type PulseDeltaType = 'positive' | 'negative' | 'neutral';

export interface PulseSnapshotKpi {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaType: PulseDeltaType;
  tooltip: string;
}

export interface PulseSnapshotSummary {
  kpis: PulseSnapshotKpi[];
  quotesInRange: number;
  providersIncluded: number;
  methodsIncluded: string[];
  leader: string;
  lastUpdated: string;
}

export interface PulseCoverageSummary {
  quotesInRange: number;
  providersIncluded: number;
  methodsIncluded: string[];
  lastUpdated: string;
}

export interface PulseProviderBenchmarkRow {
  provider: string;
  deliveredAmount: number;
  totalCost: number;
  totalCostBps: number;
  fee: number;
  markupBps: number;
  speed: string;
  winRate: number;
  reliability: number;
}

export interface PulseEventItem {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  chartId?: string;
}

export type PulseScreenerRow = {
  corridorId: string;
  slug: string;
  label: string;
  fromFlag: string;
  toFlag: string;
  sourceCountry?: string;
  destCountry?: string;
  sourceCurrency?: string;
  destCurrency?: string;

  dataAvailable: boolean;
  updatedAt: string | null;

  smartSendLevel: 'great' | 'good' | 'fair' | 'wait' | null;
  bestProvider: string | null;
  bestRecipientGets: number | null;
  spreadRangeBps: number | null;
  providerCount: number | null;
  bankSavings: number | null;
  bankSavingsPercent: number | null;

  moverDeltaPct24h: number | null;
  moverTimestampBucket: string | null;

  // Agent-native platform fields.
  stressScore?: number | null;
  stressLevel?: 'normal' | 'elevated' | 'high' | 'critical' | null;
  moduleHealth?: 'healthy' | 'degraded' | 'quarantined' | null;
  confidence?: number | null;
};

export type PulseScreenerResponse = {
  success: true;
  updatedAt: string | null;
  rows: PulseScreenerRow[];
};
