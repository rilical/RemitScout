export type WebhookSubscriptionRecord = {
    subscription_id: string;
    client_id: string;
    webhook_url: string;
    webhook_secret: string | null;
    corridor_filter: string[] | null;
    provider_filter: string[] | null;
    z_score_threshold: number;
};
export interface IWebhookRepository {
    loadActiveSubscriptions(corridorId: string, providerId: string, zScore: number): Promise<WebhookSubscriptionRecord[]>;
}
