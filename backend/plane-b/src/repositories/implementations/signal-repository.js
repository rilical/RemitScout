"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalRepository = void 0;
const db_1 = require("../../../../shared/db");
class SignalRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async insertSignal(input) {
        await (0, db_1.query)(`INSERT INTO gold.signal_history
       (signal_type, provider_id, corridor_id, current_rate, avg_24h, stddev_24h, z_score, detected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`, [
            input.signalType,
            input.providerId,
            input.corridorId,
            input.currentRate,
            input.avg24h,
            input.stdDev24h,
            input.zScore,
        ], this.pool);
    }
}
exports.SignalRepository = SignalRepository;
