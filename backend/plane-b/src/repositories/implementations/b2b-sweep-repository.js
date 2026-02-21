"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2bSweepRepository = void 0;
const db_1 = require("../../../../shared/db");
const config_1 = require("../../../../shared/config");
const repository_retry_1 = require("../../../../shared/repository-retry");
class B2bSweepRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async createSweepRun(input) {
        const result = await (0, db_1.query)(`INSERT INTO silver.b2b_sweep_run (
         priority_tier,
         cadence_minutes,
         target_minutes,
         observation_mode,
         status,
         corridors_total,
         providers_total,
         enqueued_at,
         started_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING run_id`, [
            input.priorityTier,
            input.cadenceMinutes,
            input.targetMinutes,
            input.observationMode,
            input.status ?? 'planned',
            input.corridorsTotal,
            input.providersTotal,
        ], this.pool);
        return result.rows[0]?.run_id ?? '';
    }
    async updateSweepRunStatus(runId, status, finishedAt) {
        await (0, db_1.query)(`UPDATE silver.b2b_sweep_run
          SET status = $2,
              finished_at = COALESCE($3, finished_at),
              updated_at = NOW()
        WHERE run_id = $1`, [runId, status, finishedAt ?? null], this.pool);
    }
    async updateSweepRunTotals(runId, corridorsTotal, providersTotal) {
        await (0, db_1.query)(`UPDATE silver.b2b_sweep_run
          SET corridors_total = $2,
              providers_total = $3,
              updated_at = NOW()
        WHERE run_id = $1`, [runId, corridorsTotal, providersTotal], this.pool);
    }
    async getLatestRunByTier(priorityTier) {
        const result = await (0, db_1.query)(`SELECT run_id AS "runId",
              priority_tier AS "priorityTier",
              status,
              created_at AS "createdAt",
              started_at AS "startedAt",
              finished_at AS "finishedAt"
         FROM silver.b2b_sweep_run
        WHERE priority_tier = $1
        ORDER BY created_at DESC
        LIMIT 1`, [priorityTier], this.pool);
        return result.rows[0] ?? null;
    }
    async getActiveRunByTier(priorityTier) {
        const result = await (0, db_1.query)(`SELECT run_id AS "runId",
              priority_tier AS "priorityTier",
              status,
              created_at AS "createdAt",
              started_at AS "startedAt",
              finished_at AS "finishedAt"
         FROM silver.b2b_sweep_run
        WHERE priority_tier = $1
          AND status IN ('planned', 'running')
        ORDER BY created_at DESC
        LIMIT 1`, [priorityTier], this.pool);
        return result.rows[0] ?? null;
    }
    async insertSweepTasks(runId, tasks, options) {
        if (tasks.length === 0)
            return;
        const rawChunkSize = Number(config_1.config.planeB.b2bSweepTaskInsertChunkSize);
        const chunkSize = Number.isFinite(rawChunkSize) && rawChunkSize > 0 ? rawChunkSize : 250;
        const rawMaxRetries = Number(config_1.config.planeB.b2bSweepTaskInsertMaxRetries);
        const maxRetries = Number.isFinite(rawMaxRetries) && rawMaxRetries >= 0 ? rawMaxRetries : 2;
        const enqueuedAt = options?.enqueuedAt === undefined ? new Date() : options.enqueuedAt;
        for (let i = 0; i < tasks.length; i += chunkSize) {
            const chunk = tasks.slice(i, i + chunkSize);
            const corridorIds = chunk.map(task => task.corridorId);
            const providerIds = chunk.map(task => task.providerId);
            const collectorTypes = chunk.map(task => task.collectorType);
            const priorityTiers = chunk.map(task => task.priorityTier);
            const amountBuckets = chunk.map(task => task.amountBucket);
            const payinMethods = chunk.map(task => task.payinMethod);
            const payoutMethods = chunk.map(task => task.payoutMethod);
            await (0, repository_retry_1.withRetry)(() => (0, db_1.query)(`INSERT INTO silver.b2b_sweep_task (
             run_id,
             corridor_id,
             provider_id,
             collector_type,
             priority_tier,
             amount_bucket,
             payin_method,
             payout_method,
             status,
             enqueued_at
           )
           SELECT
             $1::uuid,
             corridor_id,
             provider_id,
             collector_type,
             priority_tier,
             amount_bucket,
             payin_method,
             payout_method,
             'pending'::sweep_task_status,
             $9::timestamptz
           FROM UNNEST(
             $2::text[],
             $3::text[],
             $4::text[],
             $5::text[],
             $6::int[],
             $7::text[],
             $8::text[]
           ) AS t(
             corridor_id,
             provider_id,
             collector_type,
             priority_tier,
             amount_bucket,
             payin_method,
             payout_method
           )
           ON CONFLICT (run_id, provider_id, corridor_id, amount_bucket, payin_method, payout_method)
           DO NOTHING`, [
                runId,
                corridorIds,
                providerIds,
                collectorTypes,
                priorityTiers,
                amountBuckets,
                payinMethods,
                payoutMethods,
                enqueuedAt,
            ], this.pool), { maxRetries });
        }
    }
    async loadPendingTasks(runId, limit) {
        const capped = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 100;
        const result = await (0, db_1.query)(`SELECT corridor_id AS "corridorId",
              provider_id AS "providerId",
              collector_type AS "collectorType",
              priority_tier AS "priorityTier",
              amount_bucket AS "amountBucket",
              payin_method AS "payinMethod",
              payout_method AS "payoutMethod",
              status,
              enqueued_at AS "enqueuedAt"
         FROM silver.b2b_sweep_task
        WHERE run_id = $1
          AND status = 'pending'
          AND enqueued_at IS NULL
        ORDER BY created_at ASC
        LIMIT $2`, [runId, capped], this.pool);
        return result.rows;
    }
    async markTasksEnqueued(runId, keys) {
        if (keys.length === 0)
            return;
        const corridorIds = keys.map(key => key.corridorId);
        const providerIds = keys.map(key => key.providerId);
        const amountBuckets = keys.map(key => key.amountBucket);
        const payinMethods = keys.map(key => key.payinMethod);
        const payoutMethods = keys.map(key => key.payoutMethod);
        await (0, db_1.query)(`UPDATE silver.b2b_sweep_task AS task
          SET enqueued_at = NOW(),
              updated_at = NOW()
         FROM UNNEST(
           $2::text[],
           $3::text[],
           $4::int[],
           $5::text[],
           $6::text[]
         ) AS k(
           provider_id,
           corridor_id,
           amount_bucket,
           payin_method,
           payout_method
         )
        WHERE task.run_id = $1
          AND task.provider_id = k.provider_id
          AND task.corridor_id = k.corridor_id
          AND task.amount_bucket = k.amount_bucket
          AND task.payin_method = k.payin_method
          AND task.payout_method = k.payout_method`, [runId, providerIds, corridorIds, amountBuckets, payinMethods, payoutMethods], this.pool);
    }
    async markTaskProcessing(runId, key) {
        await (0, db_1.query)(`UPDATE silver.b2b_sweep_task
          SET status = 'processing',
              attempt_count = attempt_count + 1,
              started_at = NOW(),
              updated_at = NOW()
        WHERE run_id = $1
          AND provider_id = $2
          AND corridor_id = $3
          AND amount_bucket = $4
          AND payin_method = $5
          AND payout_method = $6`, [
            runId,
            key.providerId,
            key.corridorId,
            key.amountBucket,
            key.payinMethod,
            key.payoutMethod,
        ], this.pool);
    }
    async markTasksProcessingBatch(runId, keys) {
        if (keys.length === 0)
            return;
        const corridorIds = keys.map(key => key.corridorId);
        const providerIds = keys.map(key => key.providerId);
        const amountBuckets = keys.map(key => key.amountBucket);
        const payinMethods = keys.map(key => key.payinMethod);
        const payoutMethods = keys.map(key => key.payoutMethod);
        await (0, db_1.query)(`UPDATE silver.b2b_sweep_task AS task
          SET status = 'processing',
              attempt_count = attempt_count + 1,
              started_at = COALESCE(started_at, NOW()),
              updated_at = NOW()
         FROM UNNEST(
           $2::text[],
           $3::text[],
           $4::int[],
           $5::text[],
           $6::text[]
         ) AS k(
           provider_id,
           corridor_id,
           amount_bucket,
           payin_method,
           payout_method
         )
        WHERE task.run_id = $1
          AND task.provider_id = k.provider_id
          AND task.corridor_id = k.corridor_id
          AND task.amount_bucket = k.amount_bucket
          AND task.payin_method = k.payin_method
          AND task.payout_method = k.payout_method`, [runId, providerIds, corridorIds, amountBuckets, payinMethods, payoutMethods], this.pool);
    }
    async markTaskFinished(runId, key, status, errorReason) {
        await (0, db_1.query)(`UPDATE silver.b2b_sweep_task
          SET status = $7,
              finished_at = NOW(),
              error_reason = $8,
              updated_at = NOW()
        WHERE run_id = $1
          AND provider_id = $2
          AND corridor_id = $3
          AND amount_bucket = $4
          AND payin_method = $5
          AND payout_method = $6`, [
            runId,
            key.providerId,
            key.corridorId,
            key.amountBucket,
            key.payinMethod,
            key.payoutMethod,
            status,
            errorReason ?? null,
        ], this.pool);
    }
    async markTasksFinishedBatch(runId, keys, status, errorReason) {
        if (keys.length === 0)
            return;
        const corridorIds = keys.map(key => key.corridorId);
        const providerIds = keys.map(key => key.providerId);
        const amountBuckets = keys.map(key => key.amountBucket);
        const payinMethods = keys.map(key => key.payinMethod);
        const payoutMethods = keys.map(key => key.payoutMethod);
        await (0, db_1.query)(`UPDATE silver.b2b_sweep_task AS task
          SET status = $7,
              finished_at = NOW(),
              error_reason = $8,
              updated_at = NOW()
         FROM UNNEST(
           $2::text[],
           $3::text[],
           $4::int[],
           $5::text[],
           $6::text[]
         ) AS k(
           provider_id,
           corridor_id,
           amount_bucket,
           payin_method,
           payout_method
         )
        WHERE task.run_id = $1
          AND task.provider_id = k.provider_id
          AND task.corridor_id = k.corridor_id
          AND task.amount_bucket = k.amount_bucket
          AND task.payin_method = k.payin_method
          AND task.payout_method = k.payout_method`, [runId, providerIds, corridorIds, amountBuckets, payinMethods, payoutMethods, status, errorReason ?? null], this.pool);
    }
    async getRunSummary(runId) {
        const result = await (0, db_1.query)(`SELECT
          COUNT(*) FILTER (WHERE status IN ('pending', 'processing')) AS remaining,
          COUNT(*) FILTER (WHERE status = 'failed') AS failed
         FROM silver.b2b_sweep_task
        WHERE run_id = $1`, [runId], this.pool);
        const row = result.rows[0];
        return {
            remaining: Number(row?.remaining ?? 0),
            failed: Number(row?.failed ?? 0),
        };
    }
}
exports.B2bSweepRepository = B2bSweepRepository;
