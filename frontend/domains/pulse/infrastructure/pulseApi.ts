// Pulse infrastructure layer: all API calls/adapters for the Pulse domain.
// Transitional wrapper over `~/lib/pulseApi` so UI does not import app-level libs directly.

export {
  getChartData,
  getCorridors,
  getCorridorById,
  getCorridorBySlug,
  getPulseCoverageSummary,
  getPulseScreener,
  getPulseSnapshotSummary,
} from '~/lib/pulseApi'
