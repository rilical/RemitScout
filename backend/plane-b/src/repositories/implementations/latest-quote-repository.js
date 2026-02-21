"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LatestQuoteRepository = void 0;
const db_1 = require("../../../../shared/db");
class LatestQuoteRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getLatestCollectedAt(corridorId, amountBucket, payinMethod, payoutMethod, providerId) {
        const result = await (0, db_1.query)(`SELECT collected_at
       FROM silver.latest_quote_by_provider
       WHERE corridor_id = $1
         AND amount_bucket = $2
         AND payin = $3
         AND payout = $4
         AND provider_id = $5
         AND status = 'ok'
       ORDER BY collected_at DESC
       LIMIT 1`, [corridorId, amountBucket, payinMethod, payoutMethod, providerId], this.pool);
        return result.rows[0]?.collected_at ?? null;
    }
    async getLatestQuoteAgeMinutes(providerId, corridorId, amountBucket, payinMethod, payoutMethod) {
        const result = await (0, db_1.query)(`SELECT EXTRACT(EPOCH FROM (now() - collected_at)) / 60.0 AS age_minutes
         FROM silver.latest_quote_by_provider
        WHERE provider_id = $1
          AND corridor_id = $2
          AND amount_bucket = $3
          AND payin = $4
          AND payout = $5`, [providerId, corridorId, amountBucket, payinMethod, payoutMethod], this.pool);
        const age = result.rows[0]?.age_minutes;
        return Number.isFinite(age) ? Number(age) : null;
    }
    async loadFreshnessLagByCorridor(providerId, corridors, amountBucket, payinMethod, payoutMethod) {
        const result = await (0, db_1.query)(`SELECT corridor_id,
              EXTRACT(EPOCH FROM (now() - collected_at)) / 60.0 AS age_minutes
         FROM silver.latest_quote_by_provider
        WHERE provider_id = $1
          AND corridor_id = ANY($2)
          AND amount_bucket = $3
          AND payin = $4
          AND payout = $5`, [providerId, corridors, amountBucket, payinMethod, payoutMethod], this.pool);
        return result.rows;
    }
    async upsertLatestQuote(input) {
        await (0, db_1.query)(`INSERT INTO silver.latest_quote_by_provider
       (corridor_id, amount_bucket, payin, payout, provider_id, collected_at, send_amount, fee_amount, promotional_fee_amount, total_debit_amount, receive_amount, implied_fx_rate, promotional_rate, base_rate, promotional_cap_amount, delivery_time_min_minutes, delivery_time_max_minutes, status, quality_flags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       ON CONFLICT (corridor_id, amount_bucket, payin, payout, provider_id) DO UPDATE SET
         collected_at = EXCLUDED.collected_at,
         send_amount = EXCLUDED.send_amount,
         fee_amount = EXCLUDED.fee_amount,
         promotional_fee_amount = EXCLUDED.promotional_fee_amount,
         total_debit_amount = EXCLUDED.total_debit_amount,
         receive_amount = EXCLUDED.receive_amount,
         implied_fx_rate = EXCLUDED.implied_fx_rate,
         promotional_rate = EXCLUDED.promotional_rate,
         base_rate = EXCLUDED.base_rate,
         promotional_cap_amount = EXCLUDED.promotional_cap_amount,
         delivery_time_min_minutes = EXCLUDED.delivery_time_min_minutes,
         delivery_time_max_minutes = EXCLUDED.delivery_time_max_minutes,
         status = EXCLUDED.status,
         quality_flags = EXCLUDED.quality_flags,
         updated_at = NOW()`, [
            input.corridorId,
            input.amountBucket,
            input.payin,
            input.payout,
            input.providerId,
            input.collectedAt,
            input.sendAmount,
            input.feeAmount,
            input.promotionalFeeAmount,
            input.totalDebitAmount,
            input.receiveAmount,
            input.impliedFxRate,
            input.promotionalRate,
            input.baseRate,
            input.promotionalCapAmount,
            input.deliveryTimeMinMinutes,
            input.deliveryTimeMaxMinutes,
            input.status,
            input.qualityFlags,
        ], this.pool);
    }
}
exports.LatestQuoteRepository = LatestQuoteRepository;
