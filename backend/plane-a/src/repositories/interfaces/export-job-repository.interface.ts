export type ExportJobType =
  | 'history_csv'
  | 'history_pdf'
  | 'watchlist_csv'
  | 'watchlist_pdf'
  | 'alerts_csv'
  | 'alerts_pdf'
  | 'all_csv'
  | 'all_pdf'
  | 'gdpr_export'

export type ExportJobStatus = 'queued' | 'running' | 'done' | 'failed'

export type ExportJobInput = {
  user_id: string
  job_type: ExportJobType
  params?: Record<string, unknown> | null
  status?: ExportJobStatus
}

export type ExportJobRow = {
  id: string
  user_id: string
  job_type: ExportJobType
  params: Record<string, unknown> | null
  status: ExportJobStatus
  s3_key: string | null
  expires_at: Date | null
  created_at: Date
  started_at: Date | null
  finished_at: Date | null
  error: string | null
}

export interface IExportJobRepository {
  create(input: ExportJobInput): Promise<ExportJobRow>
  getById(id: string): Promise<ExportJobRow | null>
  listByUserId(userId: string, limit?: number, offset?: number): Promise<ExportJobRow[]>
  countByUserAndStatus(userId: string, statuses?: ExportJobStatus[]): Promise<number>
  updateStatus(
    id: string,
    status: ExportJobStatus,
    updates?: {
      started_at?: Date | null
      finished_at?: Date | null
      error?: string | null
    },
  ): Promise<void>
  updateS3Key(id: string, s3Key: string, expiresAt?: Date | null): Promise<void>
  getPendingJobs(limit?: number): Promise<ExportJobRow[]>
}
