export type PlanUsageRecord = {
  scope: string
  count: number
}

export interface IPlanUsageRepository {
  getUsageForUser(userId: string): Promise<PlanUsageRecord[]>
}
