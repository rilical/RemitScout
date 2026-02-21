import type { Pool } from 'pg';
import type { IWebhookRepository, WebhookSubscriptionRecord } from '../interfaces/webhook-repository.interface';
export declare class WebhookRepository implements IWebhookRepository {
    private readonly pool;
    constructor(pool: Pool);
    loadActiveSubscriptions(corridorId: string, providerId: string, zScore: number): Promise<WebhookSubscriptionRecord[]>;
}
