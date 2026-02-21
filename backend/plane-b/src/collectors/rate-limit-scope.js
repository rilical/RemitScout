"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRateLimitScope = void 0;
const resolveRateLimitScope = (collectorType) => {
    if (!collectorType)
        return null;
    return collectorType.startsWith('b2c') ? 'b2c' : null;
};
exports.resolveRateLimitScope = resolveRateLimitScope;
