"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCollectorResult = exports.isFetchResult = exports.isCollectorRequest = void 0;
/**
 * Type guard to check if a value is a CollectorRequest.
 *
 * @param value - Value to check
 * @returns True if value is a valid CollectorRequest
 */
const isCollectorRequest = (value) => {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const req = value;
    return (typeof req.provider_id === 'string' &&
        typeof req.corridor_id === 'string' &&
        typeof req.amount_bucket === 'number' &&
        typeof req.payin_method === 'string' &&
        typeof req.payout_method === 'string' &&
        typeof req.send_amount === 'number' &&
        typeof req.locale === 'string');
};
exports.isCollectorRequest = isCollectorRequest;
/**
 * Type guard to check if a value is a FetchResult.
 *
 * @param value - Value to check
 * @returns True if value is a valid FetchResult
 */
const isFetchResult = (value) => {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const result = value;
    return (typeof result.status === 'number' &&
        typeof result.bodyText === 'string' &&
        'payload' in result);
};
exports.isFetchResult = isFetchResult;
/**
 * Type guard to check if a value is a CollectorResult.
 *
 * @param value - Value to check
 * @returns True if value is a valid CollectorResult
 */
const isCollectorResult = (value) => {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const result = value;
    return (typeof result.status === 'string' &&
        ['success', 'blocked', 'error', 'skipped'].includes(result.status) &&
        typeof result.locale === 'string');
};
exports.isCollectorResult = isCollectorResult;
