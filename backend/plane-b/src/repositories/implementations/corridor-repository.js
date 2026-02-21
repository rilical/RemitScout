"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorridorRepository = void 0;
const db_1 = require("../../../../shared/db");
class CorridorRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async insertIfMissing(input) {
        await (0, db_1.query)(`INSERT INTO silver.corridor (corridor_id, source_country, dest_country, source_currency, dest_currency)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (corridor_id) DO NOTHING`, [
            input.corridorId,
            input.sourceCountry,
            input.destCountry,
            input.sourceCurrency,
            input.destCurrency,
        ], this.pool);
    }
    async upsertCorridor(input) {
        await (0, db_1.query)(`INSERT INTO silver.corridor (corridor_id, source_country, dest_country, source_currency, dest_currency)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (corridor_id) DO UPDATE SET
         source_country = EXCLUDED.source_country,
         dest_country = EXCLUDED.dest_country,
         source_currency = EXCLUDED.source_currency,
         dest_currency = EXCLUDED.dest_currency,
         updated_at = NOW()`, [
            input.corridorId,
            input.sourceCountry,
            input.destCountry,
            input.sourceCurrency,
            input.destCurrency,
        ], this.pool);
    }
}
exports.CorridorRepository = CorridorRepository;
