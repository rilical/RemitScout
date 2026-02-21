"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRateRepository = void 0;
const db_1 = require("../../../../shared/db");
const MAX_PERSISTED_RPM = 100000;
const clampPersistedRpm = (value, field) => {
    if (!Number.isFinite(value)) {
        throw new Error(`Invalid ${field}: must be finite (value=${value})`);
    }
    if (value <= 0) {
        throw new Error(`Invalid ${field}: must be > 0 (value=${value})`);
    }
    return Math.min(MAX_PERSISTED_RPM, Math.max(1, Math.round(value)));
};
class ProviderRateRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getRates(providerId) {
        const result = await (0, db_1.query)(`SELECT provider_id, rpm, per_corridor_rpm
         FROM silver.provider_rate_config
        WHERE provider_id = $1`, [providerId], this.pool);
        return result.rows[0] ?? null;
    }
    async upsertRates(input) {
        const rpm = clampPersistedRpm(input.rpm, 'rpm');
        const perCorridorRpm = clampPersistedRpm(input.perCorridorRpm, 'perCorridorRpm');
        await (0, db_1.query)(`INSERT INTO silver.provider_rate_config
       (provider_id, rpm, per_corridor_rpm, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (provider_id) DO UPDATE SET
         rpm = EXCLUDED.rpm,
         per_corridor_rpm = EXCLUDED.per_corridor_rpm,
         updated_at = NOW()`, [input.providerId, rpm, perCorridorRpm], this.pool);
    }
}
exports.ProviderRateRepository = ProviderRateRepository;
