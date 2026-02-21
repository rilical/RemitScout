"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RightsMatrixRepository = void 0;
const db_1 = require("../../../../shared/db");
const logger_1 = require("../../../../shared/logger");
const repository_retry_1 = require("../../../../shared/repository-retry");
const logger = (0, logger_1.createLogger)('plane-b.rights-matrix-repository');
const RIGHTS_MATRIX_LOAD_LIMIT = 10000;
class RightsMatrixRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async pauseProvider(providerId, notes) {
        await (0, db_1.query)(`INSERT INTO silver.rights_matrix
       (provider_id, stoplist_status, notes)
       VALUES ($1, 'paused', $2)
       ON CONFLICT (provider_id) DO UPDATE SET
         stoplist_status = 'paused',
         notes = EXCLUDED.notes,
         updated_at = NOW()`, [providerId, notes], this.pool);
    }
    async getProviderStatus(providerId) {
        const result = await (0, db_1.query)(`SELECT stoplist_status, notes
         FROM silver.rights_matrix
        WHERE provider_id = $1`, [providerId], this.pool);
        return result.rows[0] ?? null;
    }
    async setProviderActive(providerId) {
        await (0, db_1.query)(`UPDATE silver.rights_matrix
          SET stoplist_status = 'active',
              notes = NULL,
              updated_at = NOW()
        WHERE provider_id = $1`, [providerId], this.pool);
    }
    async loadProviderRights() {
        const result = await (0, repository_retry_1.withRetry)(() => (0, db_1.query)(`SELECT provider_id,
              allowed_collect,
              allowed_b2c,
              allowed_b2b,
              stoplist_status,
              source_countries,
              destination_countries,
              source_type,
              auth_required,
              terms_risk,
              allowed_internal_use,
              allowed_resell_b2b,
              allowed_derived_only,
              allowed_provider_attribution,
              allowed_in_rvi,
              allowed_in_rci,
              allowed_in_teer,
              expected_update_frequency::TEXT,
              observed_update_frequency::TEXT,
              uptime_last_30d,
              avg_quote_latency_ms,
              status,
              last_reviewed_at,
              reviewer
         FROM silver.rights_matrix
         LIMIT $1`, [RIGHTS_MATRIX_LOAD_LIMIT], this.pool));
        if (result.rows.length === RIGHTS_MATRIX_LOAD_LIMIT) {
            logger.warn('rights_matrix_load_limit_hit', {
                method: 'loadProviderRights',
                limit: RIGHTS_MATRIX_LOAD_LIMIT,
                row_count: result.rows.length,
            });
        }
        return result.rows;
    }
    async upsertProviderRights(input) {
        await (0, db_1.query)(`INSERT INTO silver.rights_matrix
        (provider_id, allowed_collect, allowed_b2c, allowed_b2b, notes,
         allowed_in_rvi, allowed_in_rci, allowed_in_teer, allowed_resell_b2b, status)
       VALUES ($1, $2, $3, $4, $5, true, true, true, true, 'production')
       ON CONFLICT (provider_id) DO UPDATE SET
         allowed_collect = EXCLUDED.allowed_collect,
         allowed_b2c = EXCLUDED.allowed_b2c,
         allowed_b2b = EXCLUDED.allowed_b2b,
         notes = EXCLUDED.notes,
         updated_at = NOW()`, [
            input.providerId,
            input.allowedCollect,
            input.allowedB2c,
            input.allowedB2b,
            input.notes,
        ], this.pool);
    }
    async upsertProviderCountrySupport(input) {
        await (0, db_1.query)(`INSERT INTO silver.rights_matrix (provider_id, source_countries, destination_countries)
       VALUES ($1, $2, $3)
       ON CONFLICT (provider_id) DO UPDATE SET
         source_countries = EXCLUDED.source_countries,
         destination_countries = EXCLUDED.destination_countries,
         updated_at = NOW()`, [input.providerId, input.sourceCountries, input.destinationCountries], this.pool);
    }
    async loadStoplistStatuses() {
        const result = await (0, db_1.query)('SELECT provider_id, stoplist_status FROM silver.rights_matrix LIMIT $1', [RIGHTS_MATRIX_LOAD_LIMIT], this.pool);
        if (result.rows.length === RIGHTS_MATRIX_LOAD_LIMIT) {
            logger.warn('rights_matrix_load_limit_hit', {
                method: 'loadStoplistStatuses',
                limit: RIGHTS_MATRIX_LOAD_LIMIT,
                row_count: result.rows.length,
            });
        }
        return result.rows;
    }
    async updateIndexPermissions(input) {
        await (0, db_1.query)(`UPDATE silver.rights_matrix
          SET allowed_in_rvi = $2,
              allowed_in_rci = $3,
              allowed_in_teer = $4,
              updated_at = NOW()
        WHERE provider_id = $1`, [input.providerId, input.allowedInRvi, input.allowedInRci, input.allowedInTeer], this.pool);
    }
    async updateGovernance(input) {
        await (0, db_1.query)(`UPDATE silver.rights_matrix
          SET status = $2,
              reviewer = $3,
              last_reviewed_at = NOW(),
              updated_at = NOW()
        WHERE provider_id = $1`, [input.providerId, input.status, input.reviewer], this.pool);
    }
    async updateQualityMetrics(input) {
        await (0, db_1.query)(`UPDATE silver.rights_matrix
          SET expected_update_frequency = $2::INTERVAL,
              observed_update_frequency = $3::INTERVAL,
              uptime_last_30d = $4,
              avg_quote_latency_ms = $5,
              updated_at = NOW()
        WHERE provider_id = $1`, [
            input.providerId,
            input.expectedUpdateFrequency,
            input.observedUpdateFrequency,
            input.uptimeLast30d,
            input.avgQuoteLatencyMs,
        ], this.pool);
    }
    async loadProvidersEligibleForIndex(indexType) {
        const columnMap = {
            rvi: 'allowed_in_rvi',
            rci: 'allowed_in_rci',
            teer: 'allowed_in_teer',
        };
        const column = columnMap[indexType];
        const result = await (0, db_1.query)(`SELECT provider_id,
              allowed_collect,
              allowed_b2c,
              allowed_b2b,
              stoplist_status,
              source_countries,
              destination_countries,
              source_type,
              auth_required,
              terms_risk,
              allowed_internal_use,
              allowed_resell_b2b,
              allowed_derived_only,
              allowed_provider_attribution,
              allowed_in_rvi,
              allowed_in_rci,
              allowed_in_teer,
              expected_update_frequency::TEXT,
              observed_update_frequency::TEXT,
              uptime_last_30d,
              avg_quote_latency_ms,
              status,
              last_reviewed_at,
              reviewer
         FROM silver.rights_matrix
        WHERE ${column} = true
          AND allowed_collect = true
          AND stoplist_status = 'active'`, [], this.pool);
        return result.rows;
    }
}
exports.RightsMatrixRepository = RightsMatrixRepository;
