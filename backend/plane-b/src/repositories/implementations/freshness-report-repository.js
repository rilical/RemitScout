"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreshnessReportRepository = void 0;
const db_1 = require("../../../../shared/db");
class FreshnessReportRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async insertBatch(input) {
        await (0, db_1.query)(`INSERT INTO silver.freshness_slo_report
       (provider_id, corridor_id, amount_bucket, payin_method, payout_method, age_minutes, slo_minutes, is_stale, observed_at)
       SELECT * FROM UNNEST(
         $1::text[],
         $2::text[],
         $3::int[],
         $4::text[],
         $5::text[],
         $6::double precision[],
         $7::int[],
         $8::boolean[],
         $9::timestamptz[]
       )`, [
            input.providerIds,
            input.corridorIds,
            input.amountBuckets,
            input.payinMethods,
            input.payoutMethods,
            input.ageMinutes,
            input.sloMinutes,
            input.isStale,
            input.observedAts,
        ], this.pool);
    }
}
exports.FreshnessReportRepository = FreshnessReportRepository;
