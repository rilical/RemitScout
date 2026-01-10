export interface ICorridorPriorityRepository {
  getPriorityTier(corridorId: string): Promise<string | null>
  getFreshnessSloMinutes(corridorId: string): Promise<number | null>
}
