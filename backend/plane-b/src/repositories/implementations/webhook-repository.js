"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookRepository = void 0;
const db_1 = require("../../../../shared/db");
class WebhookRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async loadActiveSubscriptions(corridorId, providerId, zScore) {
        const params = [corridorId, providerId, zScore];
        const whereClause = `FROM gold.webhook_subscriptions
      WHERE active = true
        AND (array_length(corridor_filter, 1) IS NULL OR $1 = ANY(corridor_filter))
        AND (array_length(provider_filter, 1) IS NULL OR $2 = ANY(provider_filter))
        AND z_score_threshold <= $3`;
        try {
            const result = await (0, db_1.query)(`SELECT subscription_id, client_id, webhook_url, webhook_secret, corridor_filter, provider_filter, z_score_threshold
           ${whereClause}`, params, this.pool);
            return result.rows;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (!message.includes('column "webhook_secret" does not exist')) {
                throw error;
            }
            const fallback = await (0, db_1.query)(`SELECT subscription_id, client_id, webhook_url, NULL::text AS webhook_secret, corridor_filter, provider_filter, z_score_threshold
           ${whereClause}`, params, this.pool);
            return fallback.rows;
        }
    }
}
exports.WebhookRepository = WebhookRepository;
