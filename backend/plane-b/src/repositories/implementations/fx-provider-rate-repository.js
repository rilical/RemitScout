"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FxProviderRateRepository = void 0;
const db_1 = require("../../../../shared/db");
class FxProviderRateRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async upsertRate(input) {
        await (0, db_1.query)(`INSERT INTO gold.fx_provider_rates (provider_name, base_currency, quote_currency, rate, markup_bps, speed)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (provider_name, base_currency, quote_currency) DO UPDATE SET
         rate = EXCLUDED.rate,
         markup_bps = EXCLUDED.markup_bps,
         speed = EXCLUDED.speed,
         updated_at = NOW()`, [
            input.providerName,
            input.baseCurrency,
            input.quoteCurrency,
            input.rate,
            input.markupBps,
            input.speed,
        ], this.pool);
    }
}
exports.FxProviderRateRepository = FxProviderRateRepository;
