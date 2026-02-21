"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteAttemptRepository = void 0;
const db_1 = require("../../../../shared/db");
class QuoteAttemptRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async insertAttempt(input) {
        await (0, db_1.query)(`INSERT INTO silver.quote_attempt
       (provider_id, corridor_id, amount_bucket, payin_method, payout_method, success, error_type, http_status, error_message, bronze_object_key, request_fingerprint)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
            input.providerId,
            input.corridorId,
            input.amountBucket,
            input.payinMethod,
            input.payoutMethod,
            input.success,
            input.errorType,
            input.httpStatus,
            input.errorMessage,
            input.bronzeObjectKey,
            input.requestFingerprint,
        ], this.pool);
    }
}
exports.QuoteAttemptRepository = QuoteAttemptRepository;
