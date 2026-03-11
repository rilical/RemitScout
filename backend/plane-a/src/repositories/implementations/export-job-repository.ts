import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  ExportJobInput,
  ExportJobRow,
  ExportJobStatus,
  IExportJobRepository,
} from '../interfaces/export-job-repository.interface'

export class ExportJobRepository implements IExportJobRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: ExportJobInput): Promise<ExportJobRow> {
    const result = await query<ExportJobRow>(
      `INSERT INTO silver.export_job (user_id, job_type, params, status)
       VALUES (
         $1,
         $2,
         $3::jsonb,
         COALESCE($4::export_job_status, 'queued'::export_job_status)
       )
       RETURNING id, user_id, job_type, params, status, s3_key, expires_at, created_at, started_at, finished_at, error`,
      [input.user_id, input.job_type, JSON.stringify(input.params ?? null), input.status ?? null],
      this.pool,
    )
    const row = result.rows[0]
    if (!row) {
      throw new Error('INSERT into export_job returned no rows')
    }
    return row
  }

  async getById(id: string): Promise<ExportJobRow | null> {
    const result = await query<ExportJobRow>(
      `SELECT id, user_id, job_type, params, status, s3_key, expires_at, created_at, started_at, finished_at, error
       FROM silver.export_job
       WHERE id = $1`,
      [id],
      this.pool,
    )
    return result.rows[0] || null
  }

  async listByUserId(userId: string, limit = 50, offset = 0): Promise<ExportJobRow[]> {
    const result = await query<ExportJobRow>(
      `SELECT id, user_id, job_type, params, status, s3_key, expires_at, created_at, started_at, finished_at, error
       FROM silver.export_job
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
      this.pool,
    )
    return result.rows
  }

  async countByUserAndStatus(userId: string, statuses?: ExportJobStatus[]): Promise<number> {
    const statusList = statuses && statuses.length > 0 ? statuses : ['queued', 'running']
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM silver.export_job
       WHERE user_id = $1
         AND status = ANY($2::export_job_status[])`,
      [userId, statusList],
      this.pool,
    )
    return Number(result.rows[0]?.count ?? 0)
  }

  async updateStatus(
    id: string,
    status: ExportJobStatus,
    updates?: {
      started_at?: Date | null
      finished_at?: Date | null
      error?: string | null
    },
  ): Promise<void> {
    await query(
      `UPDATE silver.export_job
       SET status = $2::export_job_status,
           started_at = COALESCE($3, started_at),
           finished_at = COALESCE($4, finished_at),
           error = $5
       WHERE id = $1`,
      [id, status, updates?.started_at ?? null, updates?.finished_at ?? null, updates?.error ?? null],
      this.pool,
    )
  }

  async updateS3Key(id: string, s3Key: string, expiresAt?: Date | null): Promise<void> {
    await query(
      `UPDATE silver.export_job
       SET s3_key = $2,
           expires_at = $3
       WHERE id = $1`,
      [id, s3Key, expiresAt ?? null],
      this.pool,
    )
  }

  async getPendingJobs(limit = 10): Promise<ExportJobRow[]> {
    const result = await query<ExportJobRow>(
      `SELECT id, user_id, job_type, params, status, s3_key, expires_at, created_at, started_at, finished_at, error
       FROM silver.export_job
       WHERE status = 'queued'
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit],
      this.pool,
    )
    return result.rows
  }
}
