import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  CorrectionLedgerRow,
  ICorrectionLedgerRepository,
} from '../interfaces/correction-ledger-repository.interface'

export class CorrectionLedgerRepository implements ICorrectionLedgerRepository {
  constructor(private readonly pool: Pool) {}

  async list(input: {
    limit: number
    offset: number
    corridor_id?: string
    field_name?: string
  }): Promise<{ rows: CorrectionLedgerRow[]; total: number }> {
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (input.corridor_id) {
      conditions.push(`corridor_id = $${idx++}`)
      params.push(input.corridor_id)
    }
    if (input.field_name) {
      conditions.push(`field_name = $${idx++}`)
      params.push(input.field_name)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM gold_export.index_correction ${where}`,
      params,
      this.pool,
    )

    const dataParams = [...params, input.limit, input.offset]
    const result = await query<CorrectionLedgerRow>(
      `SELECT correction_id, corridor_id, field_name, date,
              old_value::double precision, new_value::double precision,
              reason, corrected_by, methodology_version,
              approved_by, approved_at, created_at
         FROM gold_export.index_correction
         ${where}
        ORDER BY created_at DESC
        LIMIT $${idx++} OFFSET $${idx}`,
      dataParams,
      this.pool,
    )

    return {
      rows: result.rows,
      total: countResult.rows[0]?.total ?? 0,
    }
  }
}
