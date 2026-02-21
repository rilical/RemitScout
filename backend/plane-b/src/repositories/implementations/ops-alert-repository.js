"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpsAlertRepository = void 0;
const db_1 = require("../../../../shared/db");
class OpsAlertRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async insertAlert(input) {
        const result = await (0, db_1.query)(`INSERT INTO silver.ops_alert_event
       (provider_id, corridor_id, amount_bucket, http_status, block_reason, bronze_object_key, request_id, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING alert_id`, [
            input.providerId,
            input.corridorId,
            input.amountBucket,
            input.httpStatus,
            input.blockReason,
            input.bronzeObjectKey,
            input.requestId,
            input.payload,
        ], this.pool);
        return result.rows[0]?.alert_id ?? null;
    }
    async getAlert(alertId) {
        const result = await (0, db_1.query)(`SELECT alert_id, provider_id, corridor_id, amount_bucket, http_status, block_reason,
              bronze_object_key, request_id, payload, created_at
         FROM silver.ops_alert_event
        WHERE alert_id = $1`, [alertId], this.pool);
        return result.rows[0] ?? null;
    }
}
exports.OpsAlertRepository = OpsAlertRepository;
