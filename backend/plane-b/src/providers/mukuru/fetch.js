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
exports.fetchMukuruQuote = void 0;
const promises_1 = require("timers/promises");
require("../../../../shared/node-polyfills");
const undici_1 = require("undici");
const corridor_1 = require("../../../../shared/corridor");
const logger_1 = require("../../../../shared/logger");
const retry_1 = require("../../../../shared/retry");
const user_agent_1 = require("../../collectors/user-agent");
const code_map_1 = require("./code-map");
const logger = (0, logger_1.createLogger)('plane-b.mukuru.fetch');
const MUKURU_BASE_URL = 'https://mobile.mukuru.com';
const isSessionExpiredMessage = (message) => {
    if (!message)
        return false;
    const normalized = message.toLowerCase();
    return normalized.includes('session expired') || normalized.includes('reload the page');
};
const isSessionExpiredQuote = (quote) => {
    if (!quote)
        return false;
    if (typeof quote === 'string') {
        return isSessionExpiredMessage(quote);
    }
    return isSessionExpiredMessage(quote.message ?? null);
};
class CookieJar {
    store = new Map();
    applyToHeaders(headers) {
        const cookieHeader = Array.from(this.store.entries())
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
        if (cookieHeader) {
            headers.cookie = cookieHeader;
        }
    }
    updateFromSetCookie(setCookie) {
        for (const entry of setCookie) {
            const [pair] = entry.split(';');
            const [name, value] = pair.split('=');
            if (!name || value === undefined)
                continue;
            const normalizedName = name.trim().toLowerCase();
            const normalizedValue = value.trim().toLowerCase();
            if (normalizedName === 'mukurusession' && normalizedValue === 'deleted') {
                continue;
            }
            this.store.set(name.trim(), value.trim());
        }
    }
}
const resolveProxyDispatcher = async (proxyTier) => {
    if (!proxyTier)
        return undefined;
    const { getProxyForTier, getProxyForTierSync } = await Promise.resolve().then(() => __importStar(require('../../lib/proxy-router')));
    let proxyUrl = getProxyForTierSync(proxyTier);
    if (!proxyUrl) {
        proxyUrl = await getProxyForTier(proxyTier);
    }
    return proxyUrl ? new undici_1.ProxyAgent(proxyUrl) : undefined;
};
const parseSetCookie = (headers) => {
    const withGet = headers;
    if (typeof withGet.getSetCookie === 'function') {
        return withGet.getSetCookie();
    }
    const raw = headers.get('set-cookie');
    if (!raw)
        return [];
    return raw.split(/,(?=[^;]+=[^;]+)/g);
};
const requestWithCookies = async (cookieJar, url, options) => {
    const { method = 'GET', headers = {}, body, timeoutMs = 20000, jitterMs = 0, proxyTier, } = options;
    if (jitterMs > 0) {
        const delay = Math.floor(Math.random() * jitterMs);
        if (delay > 0) {
            await (0, promises_1.setTimeout)(delay);
        }
    }
    const dispatcher = await resolveProxyDispatcher(proxyTier);
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const requestHeaders = { ...headers };
    cookieJar.applyToHeaders(requestHeaders);
    const response = await (0, undici_1.fetch)(url, {
        method,
        headers: requestHeaders,
        body,
        dispatcher,
        signal: timeoutSignal,
    });
    const bodyText = await response.text();
    const setCookies = parseSetCookie(response.headers);
    cookieJar.updateFromSetCookie(setCookies);
    let json;
    try {
        json = JSON.parse(bodyText);
    }
    catch (error) {
        logger.debug('mukuru_json_parse_failed', {
            url,
            status: response.status,
            error: error instanceof Error ? error.message : String(error),
        });
        json = undefined;
    }
    return {
        status: response.status,
        bodyText,
        json,
    };
};
const selectProduct = (products, destCurrency, payoutMethod) => {
    const normalizedCurrency = destCurrency.toUpperCase();
    const matchingCurrency = products.filter(product => product.iso?.toUpperCase() === normalizedCurrency);
    if (!matchingCurrency.length)
        return null;
    if (payoutMethod === 'other') {
        return matchingCurrency[0] ?? null;
    }
    const matchingMethod = matchingCurrency.filter(product => (0, code_map_1.mapMukuruPayoutMethod)(product.title) === payoutMethod);
    if (matchingMethod.length) {
        return matchingMethod[0] ?? null;
    }
    return matchingCurrency[0] ?? null;
};
const parsePageValue = (html, field) => {
    const regex = new RegExp(`${field}" value="([^"]+)"`);
    const match = html.match(regex);
    return match?.[1] ?? null;
};
const fetchMukuruQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const fromCountry = (0, code_map_1.mapMukuruSourceCountry)(sourceCountry);
    const toCountry = destCountry.toUpperCase();
    const locale = request.locale || 'en-US';
    const fetchWithSession = async (cookieJar) => {
        const pricecheckUrl = `${MUKURU_BASE_URL}/mobi/pricecheck`
            + `?country_shortcode=${fromCountry}`
            + `&destination_country_shortcode=${toCountry}`
            + `&iframe=1`;
        const pageResponse = await (0, retry_1.retry)(() => requestWithCookies(cookieJar, pricecheckUrl, {
            method: 'GET',
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'accept-language': locale,
                'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
            },
            timeoutMs: options.timeoutMs ?? 20000,
            jitterMs: options.jitterMs ?? 0,
            proxyTier: options.proxyTier,
        }), {
            maxRetries: 2,
            initialDelayMs: 750,
        });
        const csrfToken = parsePageValue(pageResponse.bodyText, 'csrf_pricing');
        const pageSourceCurrency = parsePageValue(pageResponse.bodyText, 'from_currency_iso');
        if (!csrfToken) {
            throw new Error('Mukuru csrf_pricing token missing');
        }
        if (pageSourceCurrency && pageSourceCurrency !== sourceCurrency) {
            logger.warn('mukuru_source_currency_mismatch', {
                corridor_id: request.corridor_id,
                expected: sourceCurrency,
                observed: pageSourceCurrency,
            });
        }
        const productsUrl = `${MUKURU_BASE_URL}/pricechecker/get_products`
            + `?from_country=${fromCountry}`
            + `&to_country=${toCountry}`;
        const productsResponse = await (0, retry_1.retry)(() => requestWithCookies(cookieJar, productsUrl, {
            method: 'GET',
            headers: {
                accept: 'application/json, text/javascript, */*; q=0.01',
                'accept-language': locale,
                referer: pricecheckUrl,
                'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
            },
            timeoutMs: options.timeoutMs ?? 20000,
            jitterMs: options.jitterMs ?? 0,
            proxyTier: options.proxyTier,
        }), {
            maxRetries: 2,
            initialDelayMs: 750,
        });
        const productsPayload = productsResponse.json;
        const products = Array.isArray(productsPayload?.data) ? productsPayload?.data : [];
        if (!products.length) {
            return {
                status: 422,
                bodyText: productsResponse.bodyText,
                payload: {
                    quote: productsResponse.json ?? productsResponse.bodyText,
                    products: [],
                    selectedProduct: null,
                    payoutMethod: 'other',
                    sourceCurrency: pageSourceCurrency,
                },
            };
        }
        const payoutMethod = (0, code_map_1.mapMukuruPayoutMethod)(request.payout_method);
        const selectedProduct = selectProduct(products, destCurrency, payoutMethod);
        if (!selectedProduct) {
            return {
                status: 422,
                bodyText: productsResponse.bodyText,
                payload: {
                    quote: productsResponse.json ?? productsResponse.bodyText,
                    products,
                    selectedProduct: null,
                    payoutMethod,
                    sourceCurrency: pageSourceCurrency,
                },
            };
        }
        const currencyIso = selectedProduct.iso?.toUpperCase() || destCurrency;
        const calculateUrl = `${MUKURU_BASE_URL}/pricechecker/calculate?${new URLSearchParams({
            csrf_pricing: csrfToken,
            from_currency_iso: pageSourceCurrency ?? sourceCurrency,
            payin_amount: String(request.send_amount),
            from_country: fromCountry,
            to_currency_iso: currencyIso,
            payout_amount: '',
            to_country: toCountry,
            currency_id: String(selectedProduct.id),
            active_input: 'payin_amount',
            _: String(Date.now()),
        }).toString()}`;
        const quoteResponse = await (0, retry_1.retry)(() => requestWithCookies(cookieJar, calculateUrl, {
            method: 'GET',
            headers: {
                accept: 'application/json, text/javascript, */*; q=0.01',
                'accept-language': locale,
                referer: pricecheckUrl,
                origin: MUKURU_BASE_URL,
                'x-requested-with': 'XMLHttpRequest',
                'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
            },
            timeoutMs: options.timeoutMs ?? 20000,
            jitterMs: options.jitterMs ?? 0,
            proxyTier: options.proxyTier,
        }), {
            maxRetries: 2,
            initialDelayMs: 750,
        });
        const quotePayload = (quoteResponse.json ?? quoteResponse.bodyText);
        const sessionExpired = isSessionExpiredQuote(quotePayload);
        const status = sessionExpired ? 401 : quoteResponse.status;
        return {
            status,
            bodyText: quoteResponse.bodyText,
            payload: {
                quote: quotePayload,
                products,
                selectedProduct,
                payoutMethod: (0, code_map_1.mapMukuruPayoutMethod)(selectedProduct.title),
                sourceCurrency: pageSourceCurrency,
            },
        };
    };
    const firstAttempt = await fetchWithSession(new CookieJar());
    const firstQuote = firstAttempt.payload?.quote;
    if (firstAttempt.status === 401 && isSessionExpiredQuote(firstQuote)) {
        logger.warn('mukuru_session_expired_retry', {
            corridor_id: request.corridor_id,
        });
        return fetchWithSession(new CookieJar());
    }
    return firstAttempt;
};
exports.fetchMukuruQuote = fetchMukuruQuote;
