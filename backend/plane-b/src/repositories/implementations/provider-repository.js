"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRepository = void 0;
const db_1 = require("../../../../shared/db");
class ProviderRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async upsertProvider(input) {
        await (0, db_1.query)(`INSERT INTO silver.provider (provider_id, display_name)
       VALUES ($1, $2)
       ON CONFLICT (provider_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         updated_at = NOW()`, [input.providerId, input.displayName], this.pool);
    }
}
exports.ProviderRepository = ProviderRepository;
