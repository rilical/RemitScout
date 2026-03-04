import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IDailyUsageCounterRepository,
  DailyUsageCounterRecord,
} from '../interfaces/daily-usage-counter-repository.interface'

export class DailyUsageCounterRepository implements IDailyUsageCounterRepository {
  constructor(private readonly pool: Pool) {}

  async incrementAndGet(clientId: string): Promise<number> {
    const result = await query<DailyUsageCounterRecord>(
      `
      INSERT INTO public.api_daily_usage_counter (client_id, usage_date, request_count)
      VALUES ($1, CURRENT_DATE, 1)
      ON CONFLICT (client_id, usage_date)
      DO UPDATE SET request_count = public.api_daily_usage_counter.request_count + 1
      RETURNING request_count
      `,
      [clientId],
      this.pool,
    )

    return result.rows[0]?.request_count ?? 0
  }

  async getCount(clientId: string): Promise<number> {
    const result = await query<DailyUsageCounterRecord>(
      `
      SELECT request_count
      FROM public.api_daily_usage_counter
      WHERE client_id = $1 AND usage_date = CURRENT_DATE
      `,
      [clientId],
      this.pool,
    )

    return result.rows[0]?.request_count ?? 0
  }
}
