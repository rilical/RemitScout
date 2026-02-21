"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteRecordRepository = void 0;
const db_1 = require("../../../../shared/db");
class QuoteRecordRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async insertQuoteRecord(input) {
        await (0, db_1.query)(`INSERT INTO silver.quote_record
       (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, promotional_fee_amount, total_debit_amount, receive_amount, implied_fx_rate, promotional_rate, base_rate, promotional_cap_amount, delivery_time_min_minutes, delivery_time_max_minutes, status, error_code, error_message, collected_at, ingested_at, ingestion_run_id, bronze_object_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`, [
            input.providerId,
            input.corridorId,
            input.amountBucket,
            input.payin,
            input.payout,
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
            input.errorCode,
            input.errorMessage,
            input.collectedAt,
            input.ingestedAt,
            input.ingestionRunId,
            input.bronzeObjectKey,
        ], this.pool);
    }
    async insertQuoteAndUpsertLatest(input) {
        const { quote, latest } = input;
        await (0, db_1.query)(`WITH quote_insert AS (
         INSERT INTO silver.quote_record
         (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, promotional_fee_amount, fee_currency, total_debit_amount, receive_amount, implied_fx_rate, promotional_rate, base_rate, promotional_cap_amount, delivery_time_min_minutes, delivery_time_max_minutes, status, error_code, error_message, collected_at, ingested_at, ingestion_run_id, bronze_object_key, parser_version, quality_flags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
         RETURNING 1
       )
       INSERT INTO silver.latest_quote_by_provider
       (corridor_id, amount_bucket, payin, payout, provider_id, collected_at, send_amount, fee_amount, promotional_fee_amount, total_debit_amount, receive_amount, implied_fx_rate, promotional_rate, base_rate, promotional_cap_amount, delivery_time_min_minutes, delivery_time_max_minutes, status, quality_flags)
       VALUES ($27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45)
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
            quote.providerId,
            quote.corridorId,
            quote.amountBucket,
            quote.payin,
            quote.payout,
            quote.sendAmount,
            quote.feeAmount,
            quote.promotionalFeeAmount,
            quote.feeCurrency,
            quote.totalDebitAmount,
            quote.receiveAmount,
            quote.impliedFxRate,
            quote.promotionalRate,
            quote.baseRate,
            quote.promotionalCapAmount,
            quote.deliveryTimeMinMinutes,
            quote.deliveryTimeMaxMinutes,
            quote.status,
            quote.errorCode,
            quote.errorMessage,
            quote.collectedAt,
            quote.ingestedAt,
            quote.ingestionRunId,
            quote.bronzeObjectKey,
            quote.parserVersion,
            quote.qualityFlags,
            latest.corridorId,
            latest.amountBucket,
            latest.payin,
            latest.payout,
            latest.providerId,
            latest.collectedAt,
            latest.sendAmount,
            latest.feeAmount,
            latest.promotionalFeeAmount,
            latest.totalDebitAmount,
            latest.receiveAmount,
            latest.impliedFxRate,
            latest.promotionalRate,
            latest.baseRate,
            latest.promotionalCapAmount,
            latest.deliveryTimeMinMinutes,
            latest.deliveryTimeMaxMinutes,
            latest.status,
            latest.qualityFlags,
        ], this.pool);
    }
    async getBaselineStats(corridorId, providerId) {
        const result = await (0, db_1.query)(`SELECT
         AVG(implied_fx_rate) AS avg_rate,
         STDDEV(implied_fx_rate) AS stddev_rate,
         COUNT(*) AS sample_count
       FROM silver.quote_record
       WHERE corridor_id = $1
         AND provider_id = $2
         AND collected_at >= NOW() - INTERVAL '24 hours'
         AND status = 'ok'
         AND implied_fx_rate > 0`, [corridorId, providerId], this.pool);
        return result.rows[0] ?? null;
    }
}
exports.QuoteRecordRepository = QuoteRecordRepository;
