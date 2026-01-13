import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IBillingWebhookEventRepository,
  BillingWebhookEventInput,
  BillingWebhookEventRecord,
} from '../interfaces/billing-webhook-event-repository.interface'

export class BillingWebhookEventRepository implements IBillingWebhookEventRepository {
  constructor(private readonly pool: Pool) {}

  async insertEvent(input: BillingWebhookEventInput): Promise<boolean> {
    const result = await query(
      `
      INSERT INTO silver.billing_webhook_event (event_id, type, payload_hash, payload_json)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (event_id) DO NOTHING
      `,
      [input.eventId, input.type, input.payloadHash, input.payloadJson],
      this.pool,
    )
    return (result.rowCount ?? 0) > 0
  }

  async markAsProcessed(eventId: string): Promise<void> {
    await query(
      `UPDATE silver.billing_webhook_event SET processed_at = NOW() WHERE event_id = $1`,
      [eventId],
      this.pool,
    )
  }

  async getEvent(eventId: string): Promise<BillingWebhookEventRecord | null> {
    const result = await query<BillingWebhookEventRecord>(
      `SELECT event_id, type, payload_hash, payload_json, received_at, processed_at
       FROM silver.billing_webhook_event
       WHERE event_id = $1`,
      [eventId],
      this.pool,
    )
    return result.rows[0] ?? null
  }
}




