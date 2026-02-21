"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorridorPriorityRepository = void 0;
const db_1 = require("../../../../shared/db");
class CorridorPriorityRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getProxyTier(corridorId) {
        const result = await (0, db_1.query)(`SELECT proxy_tier
         FROM silver.corridor_priority
        WHERE corridor_id = $1`, [corridorId], this.pool);
        return result.rows[0] ?? null;
    }
}
exports.CorridorPriorityRepository = CorridorPriorityRepository;
