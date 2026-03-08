import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IQuoteRecordRepository,
  QuoteBaselineRecord,
  QuoteObservationPersistInput,
  QuoteRecordInsertInput,
  QuoteRecordPersistInput,
} from '../interfaces/quote-record-repository.interface'
import type { LatestQuoteUpsertInput } from '../interfaces/latest-quote-repository.interface'

export class QuoteRecordRepository implements IQuoteRecordRepository {
  constructor(private readonly pool: Pool) {}

  async insertQuoteRecord(input: QuoteRecordInsertInput): Promise<void> {
    await query(
      `INSERT INTO silver.quote_record
       (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, promotional_fee_amount, total_debit_amount, receive_amount, implied_fx_rate, promotional_rate, base_rate, promotional_cap_amount, delivery_time_min_minutes, delivery_time_max_minutes, status, error_code, error_message, collected_at, ingested_at, ingestion_run_id, bronze_object_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
      [
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
      ],
      this.pool,
    )
  }

  async insertQuoteAndUpsertLatest(input: {
    quote: QuoteRecordPersistInput
    latest: LatestQuoteUpsertInput
    observation?: QuoteObservationPersistInput
  }): Promise<void> {
    const { quote, latest, observation } = input
    await query(
      `WITH quote_insert AS (
         INSERT INTO silver.quote_record
         (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, promotional_fee_amount, fee_currency, total_debit_amount, receive_amount, implied_fx_rate, promotional_rate, base_rate, promotional_cap_amount, delivery_time_min_minutes, delivery_time_max_minutes, status, error_code, error_message, collected_at, ingested_at, ingestion_run_id, bronze_object_key, parser_version, quality_flags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
         RETURNING 1
       ),
       observation_insert AS (
         INSERT INTO silver.observation
         (module_id, provider_id, owner_kind, owner_id, type, signal_layer, capture_method,
          parser_version, source_ref, corridor_id, amount_bucket, confidence, observed_at,
          ingestion_run_id, payload, lineage, trace_id, parent_span_id, schema_version)
         SELECT
           $28, $29, $30, $31, 'quote', $32, $33,
           $34, $35, $36, $37, $38, $39,
           $40, $41::jsonb, $42::jsonb, $43, $44, 1
         FROM quote_insert
         WHERE $27::boolean = true
       )
       INSERT INTO silver.latest_quote_by_provider
       (corridor_id, amount_bucket, payin, payout, provider_id, collected_at, send_amount, fee_amount, promotional_fee_amount, total_debit_amount, receive_amount, implied_fx_rate, promotional_rate, base_rate, promotional_cap_amount, delivery_time_min_minutes, delivery_time_max_minutes, status, quality_flags)
       VALUES ($45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63)
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
         updated_at = NOW()`,
      [
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
        Boolean(observation),
        observation?.moduleId ?? null,
        observation?.providerId ?? null,
        observation?.ownerKind ?? null,
        observation?.ownerId ?? null,
        observation?.signalLayer ?? null,
        observation?.captureMethod ?? null,
        observation?.parserVersion ?? null,
        observation?.sourceRef ?? null,
        observation?.corridorId ?? null,
        observation?.amountBucket ?? null,
        observation?.confidence ?? null,
        observation?.observedAt ?? null,
        observation?.ingestionRunId ?? null,
        observation?.payload ?? null,
        observation?.lineage ?? null,
        observation?.traceId ?? null,
        observation?.parentSpanId ?? null,
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
      ],
      this.pool,
    )
  }

  async getBaselineStats(
    corridorId: string,
    providerId: string,
  ): Promise<QuoteBaselineRecord | null> {
    const result = await query<QuoteBaselineRecord>(
      `SELECT
         AVG(implied_fx_rate) AS avg_rate,
         STDDEV(implied_fx_rate) AS stddev_rate,
         COUNT(*) AS sample_count
       FROM silver.quote_record
       WHERE corridor_id = $1
         AND provider_id = $2
         AND collected_at >= NOW() - INTERVAL '24 hours'
         AND status = 'ok'
         AND implied_fx_rate > 0`,
      [corridorId, providerId],
      this.pool,
    )
    return result.rows[0] ?? null
  }
}
