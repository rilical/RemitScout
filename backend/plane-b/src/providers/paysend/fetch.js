"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPaysendQuote = void 0;
const node_crypto_1 = require("node:crypto");
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const logger_1 = require("../../../../shared/logger");
const user_agent_1 = require("../../collectors/user-agent");
const logger = (0, logger_1.createLogger)('plane-b.paysend.fetch');
const PAYSEND_BASE_URL = 'https://paysend.com/api';
const BOOTSTRAP_CORRIDOR_ID = 'US-MX-USD-MXN';
const BOOTSTRAP_FROM_CURRENCY_ID = '840';
const BOOTSTRAP_TO_CURRENCY_ID = '484';
const BOOTSTRAP_FROM_SLUG = 'the-united-states-of-america';
const BOOTSTRAP_TO_SLUG = 'mexico';
const COUNTRY_SLUGS = {
    US: 'the-united-states-of-america',
    MX: 'mexico',
    GB: 'united-kingdom',
    UK: 'united-kingdom',
    CA: 'canada',
    DE: 'germany',
    FR: 'france',
    ES: 'spain',
    IT: 'italy',
    AD: 'andorra',
    JM: 'jamaica',
    AU: 'australia',
    AT: 'austria',
    BE: 'belgium',
    BR: 'brazil',
    BG: 'bulgaria',
    CL: 'chile',
    CO: 'colombia',
    HR: 'croatia',
    CY: 'cyprus',
    CZ: 'czech-republic',
    DK: 'denmark',
    EE: 'estonia',
    FI: 'finland',
    GR: 'greece',
    HU: 'hungary',
    IS: 'iceland',
    IE: 'ireland',
    IL: 'israel',
    KZ: 'kazakhstan',
    KW: 'kuwait',
    LV: 'latvia',
    LI: 'liechtenstein',
    LT: 'lithuania',
    LU: 'luxembourg',
    MT: 'malta',
    MD: 'moldova',
    ME: 'montenegro',
    NL: 'netherlands',
    MK: 'north-macedonia',
    NO: 'norway',
    PE: 'peru',
    PL: 'poland',
    PT: 'portugal',
    RO: 'romania',
    SM: 'san-marino',
    RS: 'serbia',
    SK: 'slovakia',
    SI: 'slovenia',
    SE: 'sweden',
    CH: 'switzerland',
    UZ: 'uzbekistan',
    DZ: 'algeria',
    AR: 'argentina',
    AM: 'armenia',
    AZ: 'azerbaijan',
    BD: 'bangladesh',
    BZ: 'belize',
    BJ: 'benin',
    BT: 'bhutan',
    BO: 'bolivia',
    BW: 'botswana',
    BI: 'burundi',
    CM: 'cameroon',
    CV: 'cape-verde',
    CN: 'china',
    CR: 'costa-rica',
    DJ: 'djibouti',
    DM: 'dominica',
    DO: 'dominican-republic',
    EC: 'ecuador',
    EG: 'egypt',
    SV: 'el-salvador',
    FJ: 'fiji',
    GM: 'gambia',
    GE: 'georgia',
    GH: 'ghana',
    GT: 'guatemala',
    GN: 'guinea',
    GY: 'guyana',
    HN: 'honduras',
    HK: 'hong-kong',
    IN: 'india',
    ID: 'indonesia',
    JP: 'japan',
    JO: 'jordan',
    KE: 'kenya',
    KG: 'kyrgyzstan',
    MG: 'madagascar',
    MY: 'malaysia',
    MR: 'mauritania',
    MU: 'mauritius',
    MN: 'mongolia',
    MA: 'morocco',
    MZ: 'mozambique',
    NA: 'namibia',
    NP: 'nepal',
    NZ: 'new-zealand',
    NG: 'nigeria',
    PK: 'pakistan',
    PY: 'paraguay',
    PH: 'philippines',
    QA: 'qatar',
    RW: 'rwanda',
    SA: 'saudi-arabia',
    SN: 'senegal',
    SL: 'sierra-leone',
    SG: 'singapore',
    ZA: 'south-africa',
    KR: 'south-korea',
    LK: 'sri-lanka',
    TJ: 'tajikistan',
    TZ: 'tanzania',
    TH: 'thailand',
    TG: 'togo',
    TR: 'turkey',
    AE: 'united-arab-emirates',
    UG: 'uganda',
    UA: 'ukraine',
    UY: 'uruguay',
    VN: 'vietnam',
    ZM: 'zambia',
};
const CURRENCY_ID_MAP = {
    USD: BOOTSTRAP_FROM_CURRENCY_ID,
    MXN: BOOTSTRAP_TO_CURRENCY_ID,
};
let currencyMapPromise = null;
const resolveCountrySlug = (code) => {
    const normalized = code.trim().toUpperCase();
    return COUNTRY_SLUGS[normalized] ?? normalized.toLowerCase();
};
const updateMapsFromPayload = (payload) => {
    const visit = (value) => {
        if (Array.isArray(value)) {
            for (const entry of value) {
                visit(entry);
            }
            return;
        }
        if (!value || typeof value !== 'object')
            return;
        const obj = value;
        const codeValue = typeof obj.code === 'string' ? obj.code : null;
        const seoNameFrom = typeof obj.seoNameFrom === 'string' ? obj.seoNameFrom : null;
        const seoNameTo = typeof obj.seoNameTo === 'string' ? obj.seoNameTo : null;
        if (codeValue) {
            const normalized = codeValue.trim().toUpperCase();
            if (seoNameFrom && !COUNTRY_SLUGS[normalized]) {
                COUNTRY_SLUGS[normalized] = seoNameFrom;
            }
            if (seoNameTo && !COUNTRY_SLUGS[normalized]) {
                COUNTRY_SLUGS[normalized] = seoNameTo;
            }
        }
        if (Array.isArray(obj.currencies)) {
            for (const currency of obj.currencies) {
                if (!currency || typeof currency !== 'object')
                    continue;
                const currencyObj = currency;
                const code = typeof currencyObj.code === 'string' ? currencyObj.code : null;
                const id = currencyObj.id;
                if (code && (typeof id === 'number' || typeof id === 'string')) {
                    CURRENCY_ID_MAP[code.trim().toUpperCase()] = String(id);
                }
            }
        }
        for (const entry of Object.values(obj)) {
            visit(entry);
        }
    };
    visit(payload);
};
const loadCurrencyMap = async () => {
    if (currencyMapPromise)
        return currencyMapPromise;
    currencyMapPromise = (async () => {
        const params = new URLSearchParams({
            fromCurrId: BOOTSTRAP_FROM_CURRENCY_ID,
            toCurrId: BOOTSTRAP_TO_CURRENCY_ID,
            isFrom: 'true',
        });
        const url = `${PAYSEND_BASE_URL}/en-us/send-money/from-${BOOTSTRAP_FROM_SLUG}-to-${BOOTSTRAP_TO_SLUG}?${params.toString()}`;
        const response = await (0, http_client_1.httpRequest)({
            url,
            method: 'POST',
            headers: {
                accept: 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'no-cache',
                pragma: 'no-cache',
                origin: 'https://paysend.com',
                referer: 'https://paysend.com/en-us/send-money/',
                'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'user-agent': (0, user_agent_1.getUserAgentForCorridor)(BOOTSTRAP_CORRIDOR_ID),
                'x-session-token': `ps_session_${(0, node_crypto_1.randomUUID)()}`,
            },
            body: '',
            corridorId: BOOTSTRAP_CORRIDOR_ID,
        });
        if (!response.json || typeof response.json !== 'object') {
            throw new Error('paysend_bootstrap_invalid_payload');
        }
        updateMapsFromPayload(response.json);
    })().catch((error) => {
        currencyMapPromise = null;
        throw error;
    });
    return currencyMapPromise;
};
const resolveCurrencyId = async (code) => {
    const normalized = code.trim().toUpperCase();
    if (CURRENCY_ID_MAP[normalized])
        return CURRENCY_ID_MAP[normalized];
    try {
        await loadCurrencyMap();
    }
    catch (error) {
        logger.warn('paysend_currency_bootstrap_failed', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
    return CURRENCY_ID_MAP[normalized] ?? normalized;
};
const fetchPaysendQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const fromCountryCode = sourceCountry.toLowerCase();
    const fromSlug = resolveCountrySlug(sourceCountry);
    const toSlug = resolveCountrySlug(destCountry);
    const [fromCurrencyId, toCurrencyId] = await Promise.all([
        resolveCurrencyId(sourceCurrency),
        resolveCurrencyId(destCurrency),
    ]);
    const params = new URLSearchParams({
        fromCurrId: fromCurrencyId,
        toCurrId: toCurrencyId,
        isFrom: 'true',
    });
    const url = `${PAYSEND_BASE_URL}/en-${fromCountryCode}/send-money/from-${fromSlug}-to-${toSlug}?${params.toString()}`;
    const response = await (0, http_client_1.httpRequest)({
        url,
        method: 'POST',
        headers: {
            accept: 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            pragma: 'no-cache',
            origin: 'https://paysend.com',
            referer: `https://paysend.com/en-${fromCountryCode}/send-money/`,
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
            'x-session-token': `ps_session_${(0, node_crypto_1.randomUUID)()}`,
        },
        body: '',
        jitterMs: options.jitterMs,
        proxyTier: options.proxyTier,
        corridorId: request.corridor_id,
    });
    return {
        status: response.status,
        bodyText: response.bodyText,
        payload: response.json ?? response.bodyText,
    };
};
exports.fetchPaysendQuote = fetchPaysendQuote;
