"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionRunRepository = void 0;
const db_1 = require("../../../../shared/db");
const repository_retry_1 = require("../../../../shared/repository-retry");
class IngestionRunRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async insertRun(input) {
        const result = await (0, db_1.query)(`INSERT INTO silver.ingestion_run
       (provider_id, collector_type, started_at, finished_at, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING run_id`, [input.providerId, input.collectorType, input.startedAt, input.finishedAt, input.status], this.pool);
        return result.rows[0]?.run_id ?? '';
    }
    async updateRunStatus(runId, status, errorCode) {
        await (0, db_1.query)(`UPDATE silver.ingestion_run
       SET status = $1,
           finished_at = NOW(),
           error_code = $2
       WHERE run_id = $3`, [status, errorCode, runId], this.pool);
    }
    async getLastSweepAgeSeconds(providerId, collectorType) {
        const result = await (0, repository_retry_1.withRetry)(() => (0, db_1.query)(`SELECT EXTRACT(EPOCH FROM (NOW() - COALESCE(finished_at, started_at))) AS age_seconds
         FROM silver.ingestion_run
        WHERE provider_id = $1
          AND collector_type = $2
        ORDER BY COALESCE(finished_at, started_at) DESC
        LIMIT 1`, [providerId, collectorType], this.pool));
        const age = result.rows[0]?.age_seconds;
        return Number.isFinite(age) ? Number(age) : null;
    }
    async loadLatestSweepDurations() {
        const result = await (0, db_1.query)(`SELECT DISTINCT ON (provider_id)
          provider_id,
          EXTRACT(EPOCH FROM (finished_at - started_at)) / 60.0 AS duration_minutes,
          finished_at,
          status
         FROM silver.ingestion_run
        WHERE collector_type IN (
          'b2b_tier_1',
          'b2b_tier_2',
          'b2b_tier_1_alpha',
          'b2b_tier_2_reference',
          'b2b_full_sweep',
          'b2b_full_sweep_monthly'
        )
          AND finished_at IS NOT NULL
        ORDER BY provider_id, finished_at DESC`, [], this.pool);
        return result.rows;
    }
}
exports.IngestionRunRepository = IngestionRunRepository;
