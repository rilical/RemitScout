export type PlanUsageRecord = {
  scope: string
  count: number
}

export interface IPlanUsageRepository {
  getUsageForUser(userId: string): Promise<PlanUsageRecord[]>
  upsertUsageSnapshot(userId: string, scope: string, count: number, windowStart: Date): Promise<void>
}
