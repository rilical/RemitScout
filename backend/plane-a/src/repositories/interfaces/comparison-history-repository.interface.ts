export type ComparisonHistoryInput = {
  user_id: string
  from_country: string
  to_country: string
  amount: number
  method: string
  path?: string | null
}

export type ComparisonHistoryRow = {
  id: string
  user_id: string
  from_country: string
  to_country: string
  amount: number
  method: string
  path: string | null
  created_at: Date
}

export interface IComparisonHistoryRepository {
  create(input: ComparisonHistoryInput): Promise<ComparisonHistoryRow>
  listByUserId(userId: string, limit?: number, offset?: number): Promise<ComparisonHistoryRow[]>
  listByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit?: number,
    offset?: number,
  ): Promise<ComparisonHistoryRow[]>
  delete(id: string, userId: string): Promise<boolean>
  countByUserId(userId: string): Promise<number>
}
