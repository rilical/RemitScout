export interface ICorridorPriorityRepository {
  getPriorityInfo(
    corridorId: string,
  ): Promise<{ priorityTier: string | null; freshnessSloMinutes: number | null }>
  getPriorityTier(corridorId: string): Promise<string | null>
  getFreshnessSloMinutes(corridorId: string): Promise<number | null>
}
