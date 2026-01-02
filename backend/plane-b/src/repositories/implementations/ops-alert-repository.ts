import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type { IOpsAlertRepository, OpsAlertInput, OpsAlertRecord } from '../interfaces/ops-alert-repository.interface'

export class OpsAlertRepository implements IOpsAlertRepository {
  constructor(private readonly pool: Pool) {}

  async insertAlert(input: OpsAlertInput): Promise<string | null> {
    const result = await query<{ alert_id: string }>(
      `INSERT INTO silver.ops_alert_event
       (provider_id, corridor_id, amount_bucket, http_status, block_reason, bronze_object_key, request_id, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING alert_id`,
      [
        input.providerId,
        input.corridorId,
        input.amountBucket,
        input.httpStatus,
        input.blockReason,
        input.bronzeObjectKey,
        input.requestId,
        input.payload,
      ],
      this.pool,
    )
    return result.rows[0]?.alert_id ?? null
  }

  async getAlert(alertId: string): Promise<OpsAlertRecord | null> {
    const result = await query<OpsAlertRecord>(
      `SELECT alert_id, provider_id, corridor_id, amount_bucket, http_status, block_reason,
              bronze_object_key, request_id, payload, created_at
         FROM silver.ops_alert_event
        WHERE alert_id = $1`,
      [alertId],
      this.pool,
    )
    return result.rows[0] ?? null
  }
}
