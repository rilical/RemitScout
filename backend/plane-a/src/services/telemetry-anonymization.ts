import type { Pool } from 'pg'
import { query } from '../../../shared/db'

export const anonymizeTelemetryData = async (pool: Pool, userId: string): Promise<void> => {
  const statements = [
    `UPDATE silver.telemetry_search_event SET user_id = NULL WHERE user_id = $1`,
    `UPDATE silver.telemetry_outbound_click SET user_id = NULL WHERE user_id = $1`,
    `UPDATE silver.telemetry_session SET user_id = NULL WHERE user_id = $1`,
    `UPDATE silver.telemetry_provider_visit SET user_id = NULL WHERE user_id = $1`,
  ]

  for (const statement of statements) {
    await query(statement, [userId], pool)
  }
}
