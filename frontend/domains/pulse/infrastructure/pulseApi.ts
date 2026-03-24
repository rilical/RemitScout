// Pulse infrastructure layer: all API calls/adapters for the Pulse domain.
// Transitional wrapper over `~/lib/pulseApi` so UI does not import app-level libs directly.

export {
  getBankComparisonData,
  getChartData,
  getChartsBatch,
  getCostTrendData,
  getCoverageByCurrency,
  getCorridors,
  getCorridorById,
  getCorridorBySlug,
  getIndicesHeadline,
  getIndicesMethodology,
  getIndicesSeries,
  getMarketSnapshot,
  getMethodCoverage,
  getPulseCoverageSummary,
  getProviderBenchmarkingData,
  getPulseOverview,
  getPulseNarrative,
  getPulsePersonalHistory,
  getPulsePinnedCorridors,
  getPulseScreener,
  getPulseSnapshotSummary,
  getSmartSendData,
  getTableData,
  getTrueCostBreakdown,
  pinPulseCorridor,
  unpinPulseCorridor,
} from '~/lib/pulseApi'

export type {
  IndicesHeadlineData,
  IndicesMethodologyData,
  IndicesSeriesResponse,
  MarketSnapshotData,
  PulseChartsBatchItem,
  PulseCoverageByCurrencyRow,
  PulseNarrativeData,
  PulsePersonalHistoryData,
  PulsePinnedCorridor,
  SmartSendData,
} from '~/lib/pulseApi'
