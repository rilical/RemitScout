// Pulse infrastructure layer: all API calls/adapters for the Pulse domain.
// Transitional wrapper over `~/lib/pulseApi` so UI does not import app-level libs directly.

export {
  getChartData,
  getChartsBatch,
  getCoverageByCurrency,
  getCorridors,
  getCorridorById,
  getCorridorBySlug,
  getPulseCoverageSummary,
  getPulseOverview,
  getPulseNarrative,
  getPulsePersonalHistory,
  getPulsePinnedCorridors,
  getPulseScreener,
  getPulseSnapshotSummary,
  pinPulseCorridor,
  unpinPulseCorridor,
} from '~/lib/pulseApi'

export type {
  PulseNarrativeData,
  PulsePersonalHistoryData,
  PulsePinnedCorridor,
} from '~/lib/pulseApi'
