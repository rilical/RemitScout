"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBlock = void 0;
const logger_1 = require("../../../shared/logger");
const logger = (0, logger_1.createLogger)('plane-b.block-detection');
const DEBUG_BLOCK_DETECTION = process.env.DEBUG_BLOCK_DETECTION === 'true';
const blockKeywords = [
    'captcha',
    'access denied',
    'bot',
    'challenge',
    'forbidden',
    'too many requests',
    'rate limit',
    'quota exceeded',
    'suspended',
    'banned',
    'blocked',
    'unauthorized',
    'service unavailable',
];
const MAX_BODY_TEXT_LENGTH = 10240; // 10KB limit for performance
const detectBlock = (status, bodyText) => {
    // Validate status is a number
    if (typeof status === 'number' && Number.isFinite(status)) {
        if (status === 403) {
            if (DEBUG_BLOCK_DETECTION) {
                logger.debug('block_detected_status', { status: 403 });
            }
            return { blocked: true, reason: 'http_403' };
        }
        if (status === 429) {
            if (DEBUG_BLOCK_DETECTION) {
                logger.debug('block_detected_status', { status: 429 });
            }
            return { blocked: true, reason: 'http_429' };
        }
    }
    if (bodyText && typeof bodyText === 'string') {
        // Limit bodyText size for performance (first 10KB should be enough for error messages)
        const textToScan = bodyText.length > MAX_BODY_TEXT_LENGTH
            ? bodyText.substring(0, MAX_BODY_TEXT_LENGTH)
            : bodyText;
        const lowered = textToScan.toLowerCase();
        for (const keyword of blockKeywords) {
            // Use word boundary regex to avoid false positives
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
            if (pattern.test(lowered)) {
                const reason = `keyword_${keyword.replace(/\s+/g, '_')}`;
                if (DEBUG_BLOCK_DETECTION) {
                    logger.debug('block_detected_keyword', {
                        keyword,
                        reason,
                        body_text_preview: bodyText.substring(0, 200),
                    });
                }
                return { blocked: true, reason };
            }
        }
    }
    return { blocked: false, reason: null };
};
exports.detectBlock = detectBlock;
