"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountriesRepository = void 0;
const db_1 = require("../../../../shared/db");
class CountriesRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async upsertCountry(input) {
        await (0, db_1.query)(`INSERT INTO silver.countries (code, name, currency)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, currency = EXCLUDED.currency`, [input.code, input.name, input.currency], this.pool);
    }
}
exports.CountriesRepository = CountriesRepository;
