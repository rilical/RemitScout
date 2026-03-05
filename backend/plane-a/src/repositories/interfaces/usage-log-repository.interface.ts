export type UsageLogInsertEntry = {
  clientId: string
  endpoint: string
  corridorId: string | null
  responseTimeMs: number | null
  statusCode: number
}

export interface IUsageLogRepository {
  bulkInsertUsageLogs(entries: UsageLogInsertEntry[]): Promise<void>
}
