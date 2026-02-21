import type { CorridorOption } from '~/types/pulse'

export const mergePinnedCorridorIds = (
  pulsePinnedCorridorIds: string[],
  watchlistCorridors: CorridorOption[],
): string[] => {
  const watchlistCorridorIds = watchlistCorridors
    .map((corridor) => corridor.corridorId)
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)

  return Array.from(new Set([...pulsePinnedCorridorIds, ...watchlistCorridorIds]))
}
