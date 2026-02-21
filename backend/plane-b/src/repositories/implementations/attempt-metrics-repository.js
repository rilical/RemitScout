"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttemptMetricsRepository = void 0;
const db_1 = require("../../../../shared/db");
class AttemptMetricsRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getMetrics(providerId, locale) {
        const result = await (0, db_1.query)(`SELECT avg_attempt_seconds, sample_count
         FROM silver.collector_attempt_metrics
        WHERE provider_id = $1
          AND locale = $2`, [providerId, locale], this.pool);
        return result.rows[0] ?? null;
    }
    async upsertMetrics(input) {
        await (0, db_1.query)(`INSERT INTO silver.collector_attempt_metrics
       (provider_id, locale, avg_attempt_seconds, sample_count, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (provider_id, locale) DO UPDATE SET
         avg_attempt_seconds = EXCLUDED.avg_attempt_seconds,
         sample_count = EXCLUDED.sample_count,
         updated_at = NOW()`, [input.providerId, input.locale, input.avgAttemptSeconds, input.sampleCount], this.pool);
    }
}
exports.AttemptMetricsRepository = AttemptMetricsRepository;
