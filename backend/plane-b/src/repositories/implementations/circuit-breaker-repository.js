"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerRepository = void 0;
const db_1 = require("../../../../shared/db");
const logger_1 = require("../../../../shared/logger");
const logger = (0, logger_1.createLogger)('plane-b.circuit-breaker-repository');
const CIRCUIT_BREAKER_LOAD_LIMIT = 10000;
class CircuitBreakerRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async openCircuit(providerId, corridorId, reason, cooldownUntil) {
        await (0, db_1.query)(`INSERT INTO silver.circuit_breaker
       (provider_id, corridor_id, state, reason, cooldown_until)
       VALUES ($1, $2, 'open', $3, $4)
       ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
         state = EXCLUDED.state,
         reason = EXCLUDED.reason,
         cooldown_until = EXCLUDED.cooldown_until,
         updated_at = NOW()`, [providerId, corridorId, reason, cooldownUntil], this.pool);
    }
    async halfOpenCircuit(providerId, corridorId, cooldownUntil) {
        await (0, db_1.query)(`INSERT INTO silver.circuit_breaker
       (provider_id, corridor_id, state, reason, cooldown_until)
       VALUES ($1, $2, 'half_open', NULL, $3)
       ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
         state = EXCLUDED.state,
         reason = NULL,
         cooldown_until = EXCLUDED.cooldown_until,
         updated_at = NOW()`, [providerId, corridorId, cooldownUntil], this.pool);
    }
    async closeCircuit(providerId, corridorId) {
        await (0, db_1.query)(`INSERT INTO silver.circuit_breaker
       (provider_id, corridor_id, state, reason, cooldown_until)
       VALUES ($1, $2, 'closed', NULL, NULL)
       ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
         state = EXCLUDED.state,
         reason = NULL,
         cooldown_until = NULL,
         updated_at = NOW()`, [providerId, corridorId], this.pool);
    }
    async getCircuitState(providerId, corridorId) {
        const result = await (0, db_1.query)(`SELECT state, cooldown_until
         FROM silver.circuit_breaker
        WHERE provider_id = $1
          AND corridor_id ${corridorId ? '= $2' : 'IS NULL'}`, corridorId ? [providerId, corridorId] : [providerId], this.pool);
        return result.rows[0] ?? null;
    }
    async loadOpenCircuits(providerId) {
        const result = await (0, db_1.query)(`SELECT corridor_id, cooldown_until
         FROM silver.circuit_breaker
        WHERE provider_id = $1
          AND state = 'open'`, [providerId], this.pool);
        return result.rows;
    }
    async closeExpiredOpenCircuits(providerId) {
        await (0, db_1.query)(`UPDATE silver.circuit_breaker
          SET state = 'closed',
              updated_at = NOW()
        WHERE provider_id = $1
          AND state = 'open'
          AND cooldown_until IS NOT NULL
          AND cooldown_until <= NOW()`, [providerId], this.pool);
    }
    async loadAllCircuits() {
        const result = await (0, db_1.query)('SELECT provider_id, corridor_id, state, cooldown_until FROM silver.circuit_breaker LIMIT $1', [CIRCUIT_BREAKER_LOAD_LIMIT], this.pool);
        if (result.rows.length === CIRCUIT_BREAKER_LOAD_LIMIT) {
            logger.warn('circuit_breaker_load_limit_hit', {
                method: 'loadAllCircuits',
                limit: CIRCUIT_BREAKER_LOAD_LIMIT,
                row_count: result.rows.length,
            });
        }
        return result.rows;
    }
}
exports.CircuitBreakerRepository = CircuitBreakerRepository;
