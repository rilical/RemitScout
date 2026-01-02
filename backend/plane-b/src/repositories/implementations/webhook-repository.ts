import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IWebhookRepository,
  WebhookSubscriptionRecord,
} from '../interfaces/webhook-repository.interface'

export class WebhookRepository implements IWebhookRepository {
  constructor(private readonly pool: Pool) {}

  async loadActiveSubscriptions(
    corridorId: string,
    providerId: string,
    zScore: number,
  ): Promise<WebhookSubscriptionRecord[]> {
    const result = await query<WebhookSubscriptionRecord>(
      `SELECT subscription_id, client_id, webhook_url, webhook_secret, corridor_filter, provider_filter, z_score_threshold
         FROM gold.webhook_subscriptions
        WHERE active = true
          AND (array_length(corridor_filter, 1) IS NULL OR $1 = ANY(corridor_filter))
          AND (array_length(provider_filter, 1) IS NULL OR $2 = ANY(provider_filter))
          AND z_score_threshold <= $3`,
      [corridorId, providerId, zScore],
      this.pool,
    )
    return result.rows
  }
}
