import type { CorridorOption } from '~/types/pulse'

export type PulseEmptyReason
  = | 'no-data'
    | 'no-corridor'
    | 'suppressed'
    | 'warming-up'
    | 'unauthorized'
    | 'error'

export function usePulseDataSafety() {
  function isCorridorSafe(corridor: CorridorOption | null): boolean {
    if (!corridor) return false
    if (!corridor.sufficient) return false
    if (corridor.daysAvailable !== undefined && corridor.daysAvailable < 1) return false
    return true
  }

  function getEmptyReason(corridor: CorridorOption | null): PulseEmptyReason {
    if (!corridor) return 'no-corridor'
    if (!corridor.sufficient) return 'suppressed'
    if (corridor.daysAvailable !== undefined && corridor.daysAvailable < 7) return 'warming-up'
    return 'no-data'
  }

  function isChartAvailable(
    chartData: { dataAvailable?: boolean, updatedAt?: string | null, source?: string } | null,
  ): boolean {
    if (!chartData) return false
    if (!chartData.dataAvailable) return false
    if (chartData.updatedAt === '' || chartData.updatedAt === null) return false
    if (chartData.source === 'none') return false
    return true
  }

  function getChartEmptyReason(
    chartData: { dataAvailable?: boolean, previewLocked?: boolean } | null,
    corridor: CorridorOption | null,
  ): PulseEmptyReason {
    if (!corridor) return 'no-corridor'
    if (chartData?.previewLocked) return 'unauthorized'
    if (!corridor.sufficient) return 'suppressed'
    return 'no-data'
  }

  function isLowConfidence(point: { lowConfidence?: boolean, confidence?: number }): boolean {
    return point.lowConfidence === true || (point.confidence !== undefined && point.confidence < 0.5)
  }

  return { isCorridorSafe, getEmptyReason, isChartAvailable, getChartEmptyReason, isLowConfidence }
}
