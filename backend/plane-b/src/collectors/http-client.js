"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpRequest = exports.isTerminalError = exports.TERMINAL_ERROR_CODES = void 0;
const node_crypto_1 = require("node:crypto");
const promises_1 = require("timers/promises");
require("../../../shared/node-polyfills");
const undici_1 = require("undici");
const logger_1 = require("../../../shared/logger");
const retry_1 = require("../../../shared/retry");
const error_handling_1 = require("../../../shared/utils/error-handling");
exports.TERMINAL_ERROR_CODES = [
    'CORRIDOR_NOT_SUPPORTED',
    'CURRENCY_NOT_SUPPORTED',
    'COUNTRY_NOT_SUPPORTED',
    'AMOUNT_OUT_OF_RANGE',
    'AMOUNT_TOO_LOW',
    'AMOUNT_TOO_HIGH',
    'INVALID_CORRIDOR',
    'SERVICE_UNAVAILABLE_CORRIDOR',
];
const isTerminalError = (error) => {
    if (error instanceof Error) {
        return exports.TERMINAL_ERROR_CODES.some(code => error.message.includes(code) || error.name.includes(code));
    }
    if (typeof error === 'string') {
        return exports.TERMINAL_ERROR_CODES.some(code => error.includes(code));
    }
    return false;
};
exports.isTerminalError = isTerminalError;
const logger = (0, logger_1.createLogger)('plane-b.http-client');
const MAX_LOGGED_PROXY_USAGE = 1000;
const loggedProxyUsage = new Set();
const hashProxyUrl = (proxyUrl) => (0, node_crypto_1.createHash)('sha256').update(proxyUrl).digest('hex').slice(0, 12);
const httpRequest = async (options) => {
    const { url, method = 'GET', headers = {}, body, timeoutMs = 20000, jitterMs = 0, proxyUrl, proxyTier, corridorId, } = options;
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
        throw new Error('Invalid URL: url must be a non-empty string');
    }
    try {
        new URL(url);
    }
    catch (error) {
        throw new Error(`Invalid URL format: ${url} (${error instanceof Error ? error.message : String(error)})`);
    }
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        throw new Error(`Invalid timeout: timeoutMs must be a positive number`);
    }
    if (!Number.isFinite(jitterMs) || jitterMs < 0) {
        throw new Error(`Invalid jitter: jitterMs must be a non-negative number`);
    }
    if (method && typeof method !== 'string') {
        throw new Error('Invalid method: method must be a string');
    }
    if (jitterMs > 0) {
        const delay = Math.floor(Math.random() * jitterMs);
        if (delay > 0) {
            await (0, promises_1.setTimeout)(delay);
        }
    }
    const finalHeaders = { ...headers };
    let payload;
    if (body !== undefined) {
        if (typeof body === 'string') {
            payload = body;
        }
        else {
            payload = JSON.stringify(body);
            if (!finalHeaders['content-type']) {
                finalHeaders['content-type'] = 'application/json';
            }
        }
    }
    // Resolve proxy URL (async for Secrets Manager/SSM support)
    let resolvedProxyUrl = proxyUrl ?? null;
    if (!resolvedProxyUrl && proxyTier) {
        const { getProxyForTier, getProxyForTierSync } = await Promise.resolve().then(() => __importStar(require('../lib/proxy-router')));
        // Try sync first (uses cache or env vars)
        resolvedProxyUrl = getProxyForTierSync(proxyTier);
        // If not resolved, try async (resolves from Secrets Manager/SSM)
        if (!resolvedProxyUrl) {
            resolvedProxyUrl = await getProxyForTier(proxyTier);
        }
    }
    if (proxyTier && corridorId) {
        const proxyUrlHash = resolvedProxyUrl ? hashProxyUrl(resolvedProxyUrl) : null;
        const logKey = `${corridorId}:${proxyTier}:${proxyUrlHash ?? 'none'}`;
        if (!loggedProxyUsage.has(logKey)) {
            if (loggedProxyUsage.size >= MAX_LOGGED_PROXY_USAGE) {
                const firstKey = loggedProxyUsage.values().next().value;
                if (firstKey) {
                    loggedProxyUsage.delete(firstKey);
                }
            }
            loggedProxyUsage.add(logKey);
            logger.info('proxy_usage', {
                corridor_id: corridorId,
                proxy_tier: proxyTier,
                proxy_url_hash: proxyUrlHash,
            });
        }
    }
    const dispatcher = resolvedProxyUrl ? new undici_1.ProxyAgent(resolvedProxyUrl) : undefined;
    const executeRequest = async () => {
        const timeoutSignal = AbortSignal.timeout(timeoutMs);
        try {
            const response = await (0, undici_1.fetch)(url, {
                method,
                headers: finalHeaders,
                body: payload,
                signal: timeoutSignal,
                dispatcher,
            });
            let bodyText;
            try {
                bodyText = await response.text();
            }
            catch (error) {
                const { message } = (0, error_handling_1.formatError)(error);
                logger.error('http_response_body_read_failed', {
                    url,
                    status: response.status,
                    error: message,
                    proxy_tier: proxyTier,
                    corridor_id: corridorId,
                });
                return {
                    status: response.status,
                    bodyText: '',
                    json: undefined,
                };
            }
            let json;
            let parseError = false;
            const contentType = response.headers.get('content-type') ?? '';
            const expectsJson = contentType.includes('application/json') || contentType.includes('+json');
            try {
                json = JSON.parse(bodyText);
            }
            catch (error) {
                json = undefined;
                if (expectsJson) {
                    parseError = true;
                    logger.debug('http_response_json_parse_failed', {
                        url,
                        status: response.status,
                        body_preview: bodyText.substring(0, 200),
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }
            if (response.status >= 500 || response.status === 429) {
                throw new Error(`HTTP ${response.status}: ${url}`);
            }
            const responseHeaders = response.headers;
            const setCookie = typeof responseHeaders.getSetCookie === 'function'
                ? responseHeaders.getSetCookie()
                : (response.headers.get('set-cookie')
                    ? [response.headers.get('set-cookie')]
                    : []);
            return {
                status: response.status,
                bodyText,
                json,
                setCookie,
                parseError,
            };
        }
        catch (error) {
            if ((0, error_handling_1.isError)(error) && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
                throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
            }
            throw error;
        }
    };
    try {
        return await (0, retry_1.retry)(executeRequest, {
            maxRetries: 3,
            initialDelayMs: 1000,
            retryable: (error) => {
                if ((0, exports.isTerminalError)(error)) {
                    return false;
                }
                if ((0, error_handling_1.isError)(error)) {
                    const errorMessage = error.message;
                    if (errorMessage.includes('network') ||
                        errorMessage.includes('timeout') ||
                        errorMessage.includes('ECONNREFUSED') ||
                        errorMessage.includes('ETIMEDOUT') ||
                        errorMessage.includes('ENOTFOUND') ||
                        errorMessage.includes('HTTP 5') ||
                        errorMessage.includes('HTTP 429')) {
                        return true;
                    }
                }
                return false;
            },
        });
    }
    catch (error) {
        if ((0, error_handling_1.isError)(error) && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
            logger.warn('http_request_timeout', {
                url,
                timeout_ms: timeoutMs,
                proxy_tier: proxyTier,
                corridor_id: corridorId,
            });
            throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
        }
        const { message, stack } = (0, error_handling_1.formatError)(error);
        const errorName = (0, error_handling_1.isError)(error) ? error.name : 'Unknown';
        logger.error('http_request_failed', {
            url,
            method,
            proxy_tier: proxyTier,
            corridor_id: corridorId,
            error: message,
            error_name: errorName,
            stack,
        });
        throw error;
    }
};
exports.httpRequest = httpRequest;
