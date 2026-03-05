import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IUsageLogRepository,
  UsageLogInsertEntry,
} from '../interfaces/usage-log-repository.interface'

export class UsageLogRepository implements IUsageLogRepository {
  constructor(private readonly pool: Pool) {}

  async bulkInsertUsageLogs(entries: UsageLogInsertEntry[]): Promise<void> {
    if (entries.length === 0) return

    const valueClauses: string[] = []
    const params: unknown[] = []

    for (let i = 0; i < entries.length; i++) {
      const offset = i * 5
      valueClauses.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`,
      )
      params.push(
        entries[i].clientId,
        entries[i].endpoint,
        entries[i].corridorId,
        entries[i].responseTimeMs,
        entries[i].statusCode,
      )
    }

    const sql = `
      INSERT INTO public.api_usage_log (
        client_id,
        endpoint,
        corridor_id,
        response_time_ms,
        status_code
      ) VALUES ${valueClauses.join(', ')}
    `

    await query(sql, params, this.pool)
  }
}
