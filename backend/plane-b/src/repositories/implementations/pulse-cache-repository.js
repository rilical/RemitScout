"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PulseCacheRepository = void 0;
const db_1 = require("../../../../shared/db");
const config_1 = require("../../../../shared/config");
const logger_1 = require("../../../../shared/logger");
const pulse_defaults_1 = require("../../../../shared/pulse-defaults");
const pulse_cache_keys_1 = require("../../../../shared/pulse-cache-keys");
const repository_cache_1 = require("../../../../shared/repository-cache");
const repository_metrics_1 = require("../../../../shared/repository-metrics");
const repository_retry_1 = require("../../../../shared/repository-retry");
const error_handling_1 = require("../../../../shared/utils/error-handling");
const fx_rate_history_repository_1 = require("./fx-rate-history-repository");
const logger = (0, logger_1.createLogger)('repo.pulse-cache');
const PROVIDER_COLORS = {
    wise: '#00b9ff',
    remitly: '#2ecc71',
    xe: '#9b59b6',
    transfergo: '#14b8a6',
    paysend: '#2563eb',
    pangea: '#0ea5e9',
    orbitremit: '#3b82f6',
    bossmoney: '#2a2825',
    ria: '#f43f5e',
    dahabshiil: '#ea580c',
    xoom: '#3498db',
    worldremit: '#e74c3c',
    sendwave: '#f39c12',
    westernunion: '#ffd700',
    paypal: '#003087',
    revolut: '#0075eb',
    placid: '#16a34a',
    best: '#10b981',
};
const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const toIsoString = (value) => {
    if (!value)
        return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const formatSpeed = (min, max) => {
    if (!min && !max)
        return 'n/a';
    if (min && max && min !== max)
        return `${Math.round(min)}-${Math.round(max)} min`;
    if (min)
        return `${Math.round(min)} min`;
    if (max)
        return `${Math.round(max)} min`;
    return 'n/a';
};
const getProviderColor = (provider) => {
    const normalized = provider.toLowerCase().replace(/\s+/g, '');
    return PROVIDER_COLORS[normalized] || '#64748b';
};
const RIGHTS_ACTIVE_CONDITION = `
  rm.allowed_collect = true
  AND rm.allowed_b2c = true
  AND rm.stoplist_status = 'active'
  AND (
    rm.source_countries IS NOT NULL
    AND array_length(rm.source_countries, 1) > 0
    AND c.source_country = ANY(rm.source_countries)
  )
  AND (
    (
      rm.destination_countries IS NOT NULL
      AND array_length(rm.destination_countries, 1) > 0
      AND c.dest_country = ANY(rm.destination_countries)
    )
    OR rm.provider_id = 'wise'
  )
`;
const RIGHTS_NAMED_PROVIDER_CONDITION = `
  COALESCE(rm.allowed_provider_attribution, true) = true
  AND COALESCE(rm.allowed_derived_only, false) = false
`;
const applyRightsConditions = (conditions, options = {}) => {
    conditions.push(`(${RIGHTS_ACTIVE_CONDITION})`);
    if (options.requireNamedProvider) {
        conditions.push(`(${RIGHTS_NAMED_PROVIDER_CONDITION})`);
    }
};
const parseCorridorSlug = (slug) => {
    if (!slug)
        return null;
    const parts = slug.split('-').map((part) => part.trim()).filter(Boolean);
    if (parts.length !== 2)
        return null;
    return {
        sourceCurrency: parts[0].toLowerCase(),
        destCurrency: parts[1].toLowerCase(),
    };
};
const pushParam = (params) => {
    return (value) => {
        params.push(value);
        return `$${params.length}`;
    };
};
const buildCorridorConditions = (filters, params) => {
    const corridor = (0, pulse_cache_keys_1.normalizePulseCorridor)(filters.corridor);
    if (!corridor)
        return [];
    const parsed = parseCorridorSlug(corridor);
    if (!parsed)
        return [];
    const addParam = pushParam(params);
    const sourceParam = addParam(parsed.sourceCurrency);
    const destParam = addParam(parsed.destCurrency);
    return [`LOWER(c.source_currency) = ${sourceParam}`, `LOWER(c.dest_currency) = ${destParam}`];
};
const buildQuoteFilters = (filters, alias, params, options = {}) => {
    const conditions = [`${alias}.status = 'ok'`];
    const includeTimeframe = options.includeTimeframe !== false;
    if (includeTimeframe) {
        const interval = options.intervalOverride ?? (0, pulse_cache_keys_1.resolvePulseInterval)(filters.timeframe);
        const addParam = pushParam(params);
        const intervalParam = addParam(interval);
        conditions.push(`${alias}.collected_at >= NOW() - ${intervalParam}::interval`);
    }
    if (options.includeAmount !== false && filters.amount) {
        const addParam = pushParam(params);
        const amountParam = addParam(filters.amount);
        conditions.push(`${alias}.amount_bucket = ${amountParam}`);
    }
    if (options.includePayin !== false) {
        const payin = (0, pulse_cache_keys_1.normalizePulseMethod)(filters.payin);
        if (payin) {
            const addParam = pushParam(params);
            const payinParam = addParam(payin);
            conditions.push(`${alias}.payin = ${payinParam}`);
        }
    }
    if (options.includePayout !== false) {
        const payout = (0, pulse_cache_keys_1.normalizePulseMethod)(filters.payout);
        if (payout) {
            const addParam = pushParam(params);
            const payoutParam = addParam(payout);
            conditions.push(`${alias}.payout = ${payoutParam}`);
        }
    }
    return conditions;
};
const buildAttemptFilters = (filters, alias, params) => {
    const conditions = [];
    const interval = (0, pulse_cache_keys_1.resolvePulseInterval)(filters.timeframe);
    const addParam = pushParam(params);
    const intervalParam = addParam(interval);
    conditions.push(`${alias}.attempted_at >= NOW() - ${intervalParam}::interval`);
    if (filters.amount) {
        const amountParam = addParam(filters.amount);
        conditions.push(`${alias}.amount_bucket = ${amountParam}`);
    }
    const payin = (0, pulse_cache_keys_1.normalizePulseMethod)(filters.payin);
    if (payin) {
        const payinParam = addParam(payin);
        conditions.push(`${alias}.payin_method = ${payinParam}`);
    }
    const payout = (0, pulse_cache_keys_1.normalizePulseMethod)(filters.payout);
    if (payout) {
        const payoutParam = addParam(payout);
        conditions.push(`${alias}.payout_method = ${payoutParam}`);
    }
    return conditions;
};
const buildEventFilters = (filters, alias, params) => {
    const conditions = [];
    const interval = (0, pulse_cache_keys_1.resolvePulseInterval)(filters.timeframe);
    const addParam = pushParam(params);
    const intervalParam = addParam(interval);
    conditions.push(`${alias}.created_at >= NOW() - ${intervalParam}::interval`);
    return conditions;
};
const normalizeAmount = (value) => {
    return Number.isFinite(Number(value)) ? Number(value) : null;
};
const buildChartSeries = (chartId, dailyStats, providerDaily, quoteAttempts, amount) => {
    const chart = (0, pulse_defaults_1.buildChartData)(chartId);
    const series = [];
    const dailyMap = dailyStats.map((row) => ({
        bucket: row.bucket,
        avg_rate: toNumber(row.avg_rate, 0),
        best_rate: toNumber(row.best_rate, 0),
        worst_rate: toNumber(row.worst_rate, 0),
        median_rate: toNumber(row.median_rate, 0),
        p25_rate: toNumber(row.p25_rate, 0),
        p75_rate: toNumber(row.p75_rate, 0),
        avg_fee: toNumber(row.avg_fee, 0),
        provider_count: toNumber(row.provider_count, 0),
        quote_count: toNumber(row.quote_count, 0),
    }));
    const timePoints = dailyMap.map((row) => new Date(row.bucket).getTime());
    const buildLine = (id, label, color, values) => ({
        id,
        label,
        color,
        points: values.map((value, index) => ({
            t: timePoints[index] ?? Date.now(),
            v: value,
        })),
    });
    switch (chartId) {
        case 'all-in-cost': {
            const values = dailyMap.map((row) => {
                if (!row.best_rate || amount <= 0)
                    return 0;
                const feePct = row.avg_fee / amount;
                const markupPct = row.best_rate > 0 ? (row.best_rate - row.median_rate) / row.best_rate : 0;
                return Math.max(0, (feePct + markupPct) * 100);
            });
            series.push(buildLine('all-in-cost', 'All-in cost', '#2563eb', values));
            break;
        }
        case 'fx-markup': {
            const values = dailyMap.map((row) => {
                if (!row.best_rate)
                    return 0;
                return Math.max(0, ((row.best_rate - row.median_rate) / row.best_rate) * 10000);
            });
            series.push(buildLine('fx-markup', 'Median markup', '#2563eb', values));
            break;
        }
        case 'fee-vs-markup': {
            const feeValues = dailyMap.map((row) => (amount > 0 ? (row.avg_fee / amount) * 10000 : 0));
            const markupValues = dailyMap.map((row) => {
                if (!row.best_rate)
                    return 0;
                return Math.max(0, ((row.best_rate - row.median_rate) / row.best_rate) * 10000);
            });
            series.push(buildLine('fee', 'Fee (bps)', '#22c55e', feeValues));
            series.push(buildLine('markup', 'Markup (bps)', '#2563eb', markupValues));
            break;
        }
        case 'spread-distribution': {
            const p25Values = dailyMap.map((row) => {
                if (!row.best_rate)
                    return 0;
                return Math.max(0, ((row.best_rate - row.p25_rate) / row.best_rate) * 10000);
            });
            const p50Values = dailyMap.map((row) => {
                if (!row.best_rate)
                    return 0;
                return Math.max(0, ((row.best_rate - row.median_rate) / row.best_rate) * 10000);
            });
            const p75Values = dailyMap.map((row) => {
                if (!row.best_rate)
                    return 0;
                return Math.max(0, ((row.best_rate - row.p75_rate) / row.best_rate) * 10000);
            });
            series.push(buildLine('p25', 'P25', '#94a3b8', p25Values));
            series.push(buildLine('p50', 'P50', '#2563eb', p50Values));
            series.push(buildLine('p75', 'P75', '#f97316', p75Values));
            break;
        }
        case 'provider-winner': {
            const grouped = {};
            for (const row of providerDaily) {
                const provider = String(row.provider_name || row.provider_id || 'Unknown');
                if (!grouped[provider])
                    grouped[provider] = [];
                grouped[provider].push({
                    t: new Date(row.bucket).getTime(),
                    v: toNumber(row.avg_receive, 0),
                });
            }
            for (const [provider, points] of Object.entries(grouped)) {
                const sorted = points.sort((a, b) => a.t - b.t);
                series.push({
                    id: provider.toLowerCase(),
                    label: provider,
                    color: getProviderColor(provider),
                    points: sorted.map((point) => ({ ...point })),
                });
            }
            break;
        }
        case 'leader-change-frequency': {
            const winners = [];
            const byDay = new Map();
            for (const row of providerDaily) {
                const timestamp = new Date(row.bucket).getTime();
                const provider = String(row.provider_name || row.provider_id || 'Unknown');
                const value = toNumber(row.avg_receive, 0);
                const current = byDay.get(timestamp);
                if (!current || value > current.value) {
                    byDay.set(timestamp, { provider, value });
                }
            }
            for (const [timestamp, entry] of Array.from(byDay.entries()).sort((a, b) => a[0] - b[0])) {
                winners.push({ t: timestamp, provider: entry.provider });
            }
            let lastProvider = null;
            const values = winners.map((winner) => {
                const changed = lastProvider && lastProvider !== winner.provider;
                lastProvider = winner.provider;
                return changed ? 1 : 0;
            });
            series.push(buildLine('leader-change', 'Leader changes', '#2563eb', values));
            break;
        }
        case 'leader-edge': {
            const edges = dailyMap.map((row) => {
                if (!row.best_rate || !row.worst_rate)
                    return 0;
                return Math.max(0, ((row.best_rate - row.worst_rate) / row.best_rate) * 10000);
            });
            series.push(buildLine('leader-edge', 'Leader edge', '#2563eb', edges));
            break;
        }
        case 'pass-through-latency': {
            const values = dailyMap.map((row) => {
                if (!row.quote_count)
                    return 0;
                const avgMinutes = Math.max(0, (row.quote_count / Math.max(row.provider_count, 1)) * 1.2);
                return Number(avgMinutes.toFixed(2));
            });
            series.push(buildLine('latency', 'Latency (min)', '#2563eb', values));
            break;
        }
        case 'volatility-pulse': {
            const values = dailyMap.map((row, index) => {
                if (index === 0)
                    return 0;
                const previous = dailyMap[index - 1];
                if (!previous || !previous.best_rate)
                    return 0;
                return Math.abs((row.best_rate - previous.best_rate) / previous.best_rate) * 100;
            });
            series.push(buildLine('volatility', 'Volatility', '#2563eb', values));
            break;
        }
        case 'quote-anomalies': {
            const grouped = new Map();
            for (const row of providerDaily) {
                const provider = String(row.provider_name || row.provider_id || 'Unknown');
                const key = provider.toLowerCase();
                if (!grouped.has(key)) {
                    grouped.set(key, { provider, color: getProviderColor(provider), points: [] });
                }
                const meanRate = toNumber(row.avg_rate, 0);
                const fee = toNumber(row.avg_fee, 0);
                const baseline = dailyMap[0]?.median_rate || meanRate || 1;
                const deviationX = meanRate ? (meanRate - baseline) / baseline : 0;
                const deviationY = fee && amount ? fee / amount : 0;
                grouped.get(key)?.points.push({ t: deviationX * 10, v: deviationY * 10 });
            }
            for (const entry of grouped.values()) {
                series.push({
                    id: entry.provider.toLowerCase(),
                    label: entry.provider,
                    color: entry.color,
                    points: entry.points.map((point) => ({ ...point })),
                });
            }
            break;
        }
        case 'spread-volatility': {
            const values = dailyMap.map((row) => {
                if (!row.best_rate)
                    return 0;
                return Math.max(0, ((row.best_rate - row.worst_rate) / row.best_rate) * 10000);
            });
            series.push(buildLine('spread-volatility', 'Spread (bps)', '#2563eb', values));
            break;
        }
        case 'quote-success': {
            const values = quoteAttempts.map((row) => {
                const success = toNumber(row.success_count, 0);
                const total = Math.max(1, toNumber(row.total_count, 1));
                return (success / total) * 100;
            });
            const times = quoteAttempts.map((row) => new Date(row.bucket).getTime());
            series.push({
                id: 'success',
                label: 'Success rate',
                color: '#2563eb',
                points: values.map((value, index) => ({
                    t: times[index] ?? Date.now(),
                    v: value,
                })),
            });
            break;
        }
        case 'provider-availability': {
            const values = dailyMap.map((row) => row.provider_count);
            series.push(buildLine('provider-availability', 'Providers', '#2563eb', values));
            break;
        }
        case 'data-freshness': {
            const values = dailyMap.map((row) => Math.max(0, (row.quote_count / Math.max(row.provider_count, 1)) * 5));
            series.push(buildLine('freshness', 'Freshness (min)', '#2563eb', values));
            break;
        }
        case 'corridor-liquidity': {
            const values = dailyMap.map((row) => row.quote_count);
            series.push(buildLine('liquidity', 'Liquidity', '#2563eb', values));
            break;
        }
        default: {
            series.push(...chart.series);
            break;
        }
    }
    return {
        ...chart,
        series,
        insight: chart.insight,
    };
};
class PulseCacheRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async upsertEntry(input) {
        const startTime = Date.now();
        let success = false;
        let errorType;
        try {
            await (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => {
                await (0, repository_retry_1.withRetry)(async () => {
                    await (0, db_1.query)(`INSERT INTO gold.pulse_cache (key, payload)
             VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET
               payload = EXCLUDED.payload,
               updated_at = NOW()`, [input.key, input.payload], this.pool);
                    await repository_cache_1.pulseCache.invalidate(input.key);
                });
            });
            success = true;
        }
        catch (error) {
            const { message } = (0, error_handling_1.formatError)(error);
            errorType = (0, error_handling_1.isError)(error) ? error.code || 'unknown' : 'unknown';
            logger.error('pulse_cache_upsert_failed', {
                key: input.key,
                error: message,
            });
            throw error;
        }
        finally {
            const durationMs = Date.now() - startTime;
            await (0, repository_metrics_1.recordRepositoryMetric)('pulse-cache', 'upsert', durationMs, success, errorType);
        }
    }
    async listPulseCorridors() {
        const interval = (0, pulse_cache_keys_1.resolvePulseInterval)('1y');
        const result = await (0, db_1.query)(`SELECT
        LOWER(c.source_currency) || '-' || LOWER(c.dest_currency) AS corridor,
        c.corridor_id,
        c.source_country AS from_country,
        c.dest_country AS to_country,
        c.source_currency AS send_currency,
        c.dest_currency AS recv_currency,
        COUNT(DISTINCT CASE WHEN rm.provider_id IS NOT NULL THEN lqp.provider_id END) AS provider_count,
        MAX(CASE WHEN rm.provider_id IS NOT NULL THEN lqp.collected_at END) AS last_updated
       FROM silver.corridor c
       LEFT JOIN silver.latest_quote_by_provider lqp
         ON lqp.corridor_id = c.corridor_id
        AND lqp.status = 'ok'
        AND lqp.collected_at >= NOW() - $1::interval
       LEFT JOIN silver.rights_matrix rm
         ON rm.provider_id = lqp.provider_id
        AND ${RIGHTS_ACTIVE_CONDITION}
       GROUP BY c.corridor_id, c.source_country, c.dest_country, c.source_currency, c.dest_currency
       HAVING COUNT(DISTINCT CASE WHEN rm.provider_id IS NOT NULL THEN lqp.provider_id END) >= 1
       ORDER BY provider_count DESC, last_updated DESC NULLS LAST`, [interval], this.pool);
        return result.rows.map((row) => ({
            corridor: row.corridor,
            corridor_id: row.corridor_id,
            from_country: row.from_country,
            to_country: row.to_country,
            send_currency: row.send_currency,
            recv_currency: row.recv_currency,
            provider_count: toNumber(row.provider_count, 0),
            last_updated: toIsoString(row.last_updated),
        }));
    }
    async listPulseMethods(filters) {
        const params = [];
        const addParam = pushParam(params);
        const interval = (0, pulse_cache_keys_1.resolvePulseInterval)(filters.timeframe);
        const intervalParam = addParam(interval);
        const conditions = [`lqp.status = 'ok'`, `lqp.collected_at >= NOW() - ${intervalParam}::interval`];
        applyRightsConditions(conditions);
        const corridorConditions = buildCorridorConditions(filters, params);
        if (corridorConditions.length > 0) {
            conditions.push(...corridorConditions);
        }
        if (filters.amount) {
            const amountParam = addParam(filters.amount);
            conditions.push(`lqp.amount_bucket = ${amountParam}`);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await (0, db_1.query)(`SELECT DISTINCT lqp.payin, lqp.payout
       FROM silver.latest_quote_by_provider lqp
       JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
       JOIN silver.rights_matrix rm ON rm.provider_id = lqp.provider_id
       ${whereClause}
       ORDER BY lqp.payin, lqp.payout`, params, this.pool);
        return result.rows.map((row) => ({ payin: row.payin, payout: row.payout }));
    }
    async aggregatePulseCacheData(filters) {
        const startTime = Date.now();
        const cacheKey = (0, pulse_cache_keys_1.buildPulseCacheKey)('aggregate', filters);
        let success = false;
        let errorType;
        try {
            const cached = await repository_cache_1.pulseCache.get(cacheKey);
            if (cached) {
                if (cached instanceof Map) {
                    return cached;
                }
                if (Array.isArray(cached)) {
                    return new Map(cached);
                }
                if (typeof cached === 'object') {
                    return new Map(Object.entries(cached));
                }
            }
            const amount = normalizeAmount(filters.amount) ?? 1000;
            const rangeInterval = (0, pulse_cache_keys_1.resolvePulseRangeInterval)(filters.range);
            const bucketUnit = (0, pulse_cache_keys_1.resolvePulseBucket)(rangeInterval);
            const latestParams = [];
            const latestConditions = buildQuoteFilters(filters, 'lqp', latestParams);
            applyRightsConditions(latestConditions, { requireNamedProvider: true });
            const corridorConditions = buildCorridorConditions(filters, latestParams);
            if (corridorConditions.length > 0) {
                latestConditions.push(...corridorConditions);
            }
            const latestWhere = latestConditions.length > 0 ? `WHERE ${latestConditions.join(' AND ')}` : '';
            const methodParams = [];
            const methodConditions = buildQuoteFilters(filters, 'lqp', methodParams, {
                includePayin: false,
                includePayout: false,
            });
            applyRightsConditions(methodConditions, { requireNamedProvider: true });
            const methodCorridorConditions = buildCorridorConditions(filters, methodParams);
            if (methodCorridorConditions.length > 0) {
                methodConditions.push(...methodCorridorConditions);
            }
            const methodWhere = methodConditions.length > 0 ? `WHERE ${methodConditions.join(' AND ')}` : '';
            const dailyParams = [];
            const dailyConditions = buildQuoteFilters(filters, 'qr', dailyParams, { intervalOverride: rangeInterval });
            applyRightsConditions(dailyConditions);
            const dailyCorridorConditions = buildCorridorConditions(filters, dailyParams);
            if (dailyCorridorConditions.length > 0) {
                dailyConditions.push(...dailyCorridorConditions);
            }
            const dailyWhere = dailyConditions.length > 0 ? `WHERE ${dailyConditions.join(' AND ')}` : '';
            const attemptParams = [];
            const attemptConditions = buildAttemptFilters(filters, 'qa', attemptParams);
            applyRightsConditions(attemptConditions);
            const attemptCorridorConditions = buildCorridorConditions(filters, attemptParams);
            if (attemptCorridorConditions.length > 0) {
                attemptConditions.push(...attemptCorridorConditions);
            }
            const attemptWhere = attemptConditions.length > 0 ? `WHERE ${attemptConditions.join(' AND ')}` : '';
            const overviewParams = [];
            const addOverviewParam = pushParam(overviewParams);
            addOverviewParam((0, pulse_cache_keys_1.resolvePulseInterval)(filters.timeframe));
            const overviewConditions = buildCorridorConditions(filters, overviewParams);
            const overviewWhere = overviewConditions.length > 0 ? `WHERE ${overviewConditions.join(' AND ')}` : '';
            const eventParams = [];
            const eventConditions = buildEventFilters(filters, 'oe', eventParams);
            applyRightsConditions(eventConditions, { requireNamedProvider: true });
            const eventCorridorConditions = buildCorridorConditions(filters, eventParams);
            if (eventCorridorConditions.length > 0) {
                eventConditions.push(...eventCorridorConditions);
            }
            const eventWhere = eventConditions.length > 0 ? `WHERE ${eventConditions.join(' AND ')}` : '';
            const [latestQuotesResult, dailyStatsResult, providerDailyResult, methodCoverageResult, overviewResult, coverageResult, snapshotResult, benchmarkingResult, eventResult, attemptResult, reliabilityResult] = await Promise.all([
                (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => (0, repository_retry_1.withRetry)(async () => (0, db_1.query)(`SELECT
            lqp.provider_id,
            p.display_name AS provider_name,
            lqp.collected_at,
            lqp.send_amount,
            lqp.fee_amount,
            lqp.total_debit_amount,
            lqp.receive_amount,
            lqp.implied_fx_rate,
            lqp.delivery_time_min_minutes,
            lqp.delivery_time_max_minutes,
            lqp.promotional_rate,
            lqp.base_rate,
           lqp.promotional_cap_amount,
           lqp.payin,
           lqp.payout,
           c.dest_currency
           FROM silver.latest_quote_by_provider lqp
           JOIN silver.provider p ON p.provider_id = lqp.provider_id
           JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
           JOIN silver.rights_matrix rm ON rm.provider_id = lqp.provider_id
           ${latestWhere}
           ORDER BY lqp.implied_fx_rate DESC`, latestParams, this.pool))),
                (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => (0, repository_retry_1.withRetry)(async () => (0, db_1.query)(`SELECT
            date_trunc('${bucketUnit}', qr.collected_at) AS bucket,
            COUNT(*) AS quote_count,
            COUNT(DISTINCT qr.provider_id) AS provider_count,
            AVG(qr.implied_fx_rate) AS avg_rate,
            MAX(qr.implied_fx_rate) AS best_rate,
            MIN(qr.implied_fx_rate) AS worst_rate,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY qr.implied_fx_rate) AS median_rate,
            PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY qr.implied_fx_rate) AS p25_rate,
            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY qr.implied_fx_rate) AS p75_rate,
            AVG(qr.fee_amount) AS avg_fee
           FROM silver.quote_record qr
           JOIN silver.corridor c ON c.corridor_id = qr.corridor_id
           JOIN silver.rights_matrix rm ON rm.provider_id = qr.provider_id
           ${dailyWhere}
           GROUP BY bucket
           ORDER BY bucket`, dailyParams, this.pool))),
                (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => (0, repository_retry_1.withRetry)(async () => (0, db_1.query)(`SELECT
            date_trunc('${bucketUnit}', qr.collected_at) AS bucket,
            qr.provider_id,
            p.display_name AS provider_name,
            AVG(qr.implied_fx_rate) AS avg_rate,
            AVG(qr.receive_amount) AS avg_receive,
            AVG(qr.fee_amount) AS avg_fee,
            COUNT(*) AS sample_count
           FROM silver.quote_record qr
           JOIN silver.provider p ON p.provider_id = qr.provider_id
           JOIN silver.corridor c ON c.corridor_id = qr.corridor_id
           JOIN silver.rights_matrix rm ON rm.provider_id = qr.provider_id
           ${dailyWhere}
           GROUP BY bucket, qr.provider_id, p.display_name
           ORDER BY bucket, p.display_name`, dailyParams, this.pool))),
                (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => (0, repository_retry_1.withRetry)(async () => (0, db_1.query)(`SELECT
            lqp.provider_id,
            p.display_name AS provider_name,
            BOOL_OR(lqp.payin = 'bank' OR lqp.payout = 'bank') AS bank,
            BOOL_OR(lqp.payin = 'cash' OR lqp.payout = 'cash') AS cash,
            BOOL_OR(lqp.payin = 'wallet' OR lqp.payout = 'wallet') AS wallet,
            BOOL_OR(lqp.payin = 'card' OR lqp.payout = 'card') AS card,
            MIN(lqp.delivery_time_min_minutes) AS min_delivery,
            MAX(lqp.delivery_time_max_minutes) AS max_delivery,
            MAX(lqp.collected_at) AS last_updated
           FROM silver.latest_quote_by_provider lqp
           JOIN silver.provider p ON p.provider_id = lqp.provider_id
           JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
           JOIN silver.rights_matrix rm ON rm.provider_id = lqp.provider_id
           ${methodWhere}
           GROUP BY lqp.provider_id, p.display_name
           ORDER BY p.display_name`, methodParams, this.pool))),
                (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => (0, repository_retry_1.withRetry)(async () => (0, db_1.query)(`SELECT
            COUNT(DISTINCT c.corridor_id) AS total_corridors,
            COUNT(DISTINCT CASE WHEN rm.provider_id IS NOT NULL THEN lqp.provider_id END) AS active_providers,
            COUNT(DISTINCT CASE WHEN rm.provider_id IS NOT NULL THEN lqp.corridor_id END) AS corridors_with_quotes,
            AVG(CASE WHEN rm.provider_id IS NOT NULL THEN EXTRACT(EPOCH FROM (NOW() - lqp.collected_at)) / 60 ELSE NULL END) AS avg_freshness_minutes
           FROM silver.corridor c
           LEFT JOIN silver.latest_quote_by_provider lqp
             ON lqp.corridor_id = c.corridor_id
            AND lqp.status = 'ok'
            AND lqp.collected_at >= NOW() - $1::interval
           LEFT JOIN silver.rights_matrix rm
             ON rm.provider_id = lqp.provider_id
            AND ${RIGHTS_ACTIVE_CONDITION}
           ${overviewWhere}`, overviewParams, this.pool))),
                (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => (0, repository_retry_1.withRetry)(async () => (0, db_1.query)(`SELECT
            COUNT(DISTINCT c.corridor_id) AS total_corridors,
            COUNT(DISTINCT CASE WHEN rm.provider_id IS NOT NULL THEN c.corridor_id END) AS covered_corridors,
            ROUND(
              100.0 * COUNT(DISTINCT CASE WHEN rm.provider_id IS NOT NULL THEN c.corridor_id END) /
              NULLIF(COUNT(DISTINCT c.corridor_id), 0),
              2
            ) AS coverage_percentage
           FROM silver.corridor c
           LEFT JOIN silver.latest_quote_by_provider lqp
             ON lqp.corridor_id = c.corridor_id
            AND lqp.status = 'ok'
            AND lqp.collected_at >= NOW() - $1::interval
           LEFT JOIN silver.rights_matrix rm
             ON rm.provider_id = lqp.provider_id
            AND ${RIGHTS_ACTIVE_CONDITION}
           ${overviewWhere}`, overviewParams, this.pool))),
                (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => (0, repository_retry_1.withRetry)(async () => (0, db_1.query)(`SELECT
            COUNT(*) AS total_quotes,
            COUNT(DISTINCT qr.corridor_id) AS unique_corridors,
            COUNT(DISTINCT qr.provider_id) AS unique_providers,
            MIN(qr.collected_at) AS oldest_quote,
            MAX(qr.collected_at) AS newest_quote
           FROM silver.quote_record qr
           JOIN silver.corridor c ON c.corridor_id = qr.corridor_id
           JOIN silver.rights_matrix rm ON rm.provider_id = qr.provider_id
           ${dailyWhere}`, dailyParams, this.pool))),
                (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => (0, repository_retry_1.withRetry)(async () => (0, db_1.query)(`SELECT
            lqp.provider_id,
            p.display_name AS provider_name,
            COUNT(*) AS quote_count,
            AVG(lqp.implied_fx_rate) AS avg_rate,
            AVG(lqp.fee_amount) AS avg_fee,
            AVG(EXTRACT(EPOCH FROM (NOW() - lqp.collected_at)) / 60) AS avg_freshness_minutes
           FROM silver.latest_quote_by_provider lqp
           JOIN silver.provider p ON p.provider_id = lqp.provider_id
           JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
           JOIN silver.rights_matrix rm ON rm.provider_id = lqp.provider_id
           ${latestWhere}
           GROUP BY lqp.provider_id, p.display_name
           HAVING COUNT(*) >= 1
           ORDER BY quote_count DESC`, latestParams, this.pool))),
                (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => (0, repository_retry_1.withRetry)(async () => (0, db_1.query)(`SELECT
            oe.alert_id AS id,
            oe.provider_id,
            oe.corridor_id,
            oe.block_reason,
            oe.http_status,
           oe.created_at
           FROM silver.ops_alert_event oe
           JOIN silver.corridor c ON c.corridor_id = oe.corridor_id
           JOIN silver.rights_matrix rm ON rm.provider_id = oe.provider_id
           ${eventWhere}
           ORDER BY oe.created_at DESC
           LIMIT 100`, eventParams, this.pool))),
                (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => (0, repository_retry_1.withRetry)(async () => (0, db_1.query)(`SELECT
            date_trunc('${bucketUnit}', qa.attempted_at) AS bucket,
            COUNT(*) AS total_count,
            SUM(CASE WHEN qa.success THEN 1 ELSE 0 END) AS success_count
           FROM silver.quote_attempt qa
           JOIN silver.corridor c ON c.corridor_id = qa.corridor_id
           JOIN silver.rights_matrix rm ON rm.provider_id = qa.provider_id
           ${attemptWhere}
           GROUP BY bucket
           ORDER BY bucket`, attemptParams, this.pool))),
                (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => (0, repository_retry_1.withRetry)(async () => (0, db_1.query)(`SELECT
            qa.provider_id,
            SUM(CASE WHEN qa.success THEN 1 ELSE 0 END) AS success_count,
            COUNT(*) AS total_count
           FROM silver.quote_attempt qa
           JOIN silver.corridor c ON c.corridor_id = qa.corridor_id
           JOIN silver.rights_matrix rm ON rm.provider_id = qa.provider_id
           ${attemptWhere}
           GROUP BY qa.provider_id`, attemptParams, this.pool))),
            ]);
            const latestQuotes = latestQuotesResult.rows;
            const dailyStats = dailyStatsResult.rows;
            const providerDaily = providerDailyResult.rows;
            const methodCoverageRows = methodCoverageResult.rows;
            const overviewRow = overviewResult.rows[0];
            const coverageRow = coverageResult.rows[0];
            const snapshotRow = snapshotResult.rows[0];
            const benchmarkingRows = benchmarkingResult.rows;
            const eventRows = eventResult.rows;
            const attemptRows = attemptResult.rows;
            const reliabilityRows = reliabilityResult.rows;
            const lastUpdated = toIsoString(latestQuotes[0]?.collected_at) || new Date().toISOString();
            const methodCoverage = methodCoverageRows.map((row) => ({
                provider: String(row.provider_name || row.provider_id || 'Unknown'),
                bank: Boolean(row.bank),
                cash: Boolean(row.cash),
                wallet: Boolean(row.wallet),
                card: Boolean(row.card),
                speed: formatSpeed(row.min_delivery !== null ? toNumber(row.min_delivery, 0) : null, row.max_delivery !== null ? toNumber(row.max_delivery, 0) : null),
            }));
            const tableRows = latestQuotes.map((row) => ({
                timestamp: new Date(String(row.collected_at ?? new Date().toISOString())).getTime(),
                provider: String(row.provider_name || row.provider_id || 'Unknown'),
                deliveredAmount: toNumber(row.receive_amount, 0),
                deliveredCurrency: String(row.dest_currency || 'USD'),
                fee: toNumber(row.fee_amount, 0),
                feeCurrency: 'USD',
                rate: toNumber(row.implied_fx_rate, 0),
                markupBps: 0,
                provenance: 'observed',
            }));
            const tableBestRate = Math.max(...tableRows.map((row) => row.rate), 0);
            const tableRowsWithMarkup = tableRows.map((row) => ({
                ...row,
                markupBps: tableBestRate > 0 ? Math.round(((tableBestRate - row.rate) / tableBestRate) * 10000) : 0,
            }));
            const tableData = {
                columns: pulse_defaults_1.pulseDefaults.table.columns,
                rows: tableRowsWithMarkup,
                totalRows: tableRowsWithMarkup.length,
                page: 1,
                pageSize: tableRowsWithMarkup.length,
                lastUpdated,
            };
            const providerHeatmapDays = [];
            const providerWinCounts = {};
            const dailyWinnerMap = new Map();
            for (const row of providerDaily) {
                const timestamp = new Date(row.bucket).getTime();
                const provider = String(row.provider_name || row.provider_id || 'Unknown');
                const value = toNumber(row.avg_receive, 0);
                if (!dailyWinnerMap.has(timestamp)) {
                    dailyWinnerMap.set(timestamp, []);
                }
                dailyWinnerMap.get(timestamp)?.push({ provider, value });
            }
            for (const [timestamp, providers] of Array.from(dailyWinnerMap.entries()).sort((a, b) => a[0] - b[0])) {
                const sorted = providers.sort((a, b) => b.value - a.value);
                const winner = sorted[0];
                const runnerUp = sorted[1];
                if (!winner)
                    continue;
                const date = new Date(timestamp).toISOString().slice(0, 10);
                providerHeatmapDays.push({
                    date,
                    timestamp,
                    winner: winner.provider,
                    winnerColor: getProviderColor(winner.provider),
                    savings: runnerUp ? Math.max(0, winner.value - runnerUp.value) : 0,
                });
                providerWinCounts[winner.provider] = (providerWinCounts[winner.provider] || 0) + 1;
            }
            const providerStats = {};
            const totalWins = providerHeatmapDays.length || 1;
            for (const [provider, wins] of Object.entries(providerWinCounts)) {
                providerStats[provider] = {
                    wins,
                    percentage: Math.round((wins / totalWins) * 100),
                };
            }
            const marketSnapshotQuotes = latestQuotes.map((row) => {
                const providerName = String(row.provider_name || row.provider_id || 'Unknown');
                const rate = toNumber(row.implied_fx_rate, 0);
                return {
                    provider: providerName,
                    color: getProviderColor(providerName),
                    recipientGets: toNumber(row.receive_amount, 0),
                    fee: toNumber(row.fee_amount, 0),
                    rate,
                    markupBps: 0,
                    speed: formatSpeed(row.delivery_time_min_minutes !== null ? toNumber(row.delivery_time_min_minutes, 0) : null, row.delivery_time_max_minutes !== null ? toNumber(row.delivery_time_max_minutes, 0) : null),
                    isPromo: row.promotional_rate !== null && row.promotional_rate !== undefined,
                    promoText: row.promotional_rate ? 'Promo rate applied' : undefined,
                };
            });
            const midMarketRate = marketSnapshotQuotes.length > 0
                ? marketSnapshotQuotes.reduce((sum, quote) => sum + quote.rate, 0) / marketSnapshotQuotes.length
                : 0;
            const sortedByRate = [...marketSnapshotQuotes].sort((a, b) => b.rate - a.rate);
            const bestRate = sortedByRate[0]?.rate || 0;
            const updatedQuotes = sortedByRate.map((quote) => ({
                ...quote,
                markupBps: bestRate > 0 ? Math.round(((bestRate - quote.rate) / bestRate) * 10000) : 0,
            }));
            const bestQuote = sortedByRate[0];
            const secondBestQuote = sortedByRate[1];
            const worstQuote = sortedByRate[sortedByRate.length - 1];
            const medianRate = sortedByRate.length > 0
                ? sortedByRate[Math.floor(sortedByRate.length / 2)].rate
                : 0;
            const marketDepth = {
                bestRate: bestQuote?.rate || 0,
                bestProvider: bestQuote?.provider || 'n/a',
                secondBestRate: secondBestQuote?.rate || bestQuote?.rate || 0,
                secondBestProvider: secondBestQuote?.provider || 'n/a',
                medianRate,
                worstRate: worstQuote?.rate || 0,
                worstProvider: worstQuote?.provider || 'n/a',
                spreadRange: Math.max(0, (bestQuote?.rate || 0) - (worstQuote?.rate || 0)),
                spreadRangeBps: bestQuote?.rate ? Math.round(((bestQuote.rate - (worstQuote?.rate || 0)) / bestQuote.rate) * 10000) : 0,
                providerCount: sortedByRate.length,
            };
            const reliabilityMap = new Map();
            for (const row of reliabilityRows) {
                const total = Math.max(1, toNumber(row.total_count, 1));
                const successCount = toNumber(row.success_count, 0);
                reliabilityMap.set(String(row.provider_id), successCount / total);
            }
            const trueCost = updatedQuotes.map((quote) => {
                const providerId = quote.provider.toLowerCase().replace(/\s+/g, '');
                const marginPct = midMarketRate > 0 ? Math.max(0, (midMarketRate - quote.rate) / midMarketRate) : 0;
                const hiddenMarkup = amount * marginPct;
                const totalCost = quote.fee + hiddenMarkup;
                const totalCostPercent = amount > 0 ? (totalCost / amount) * 100 : 0;
                const bestTotalCost = updatedQuotes.length > 0
                    ? Math.min(...updatedQuotes.map((q) => q.fee))
                    : 0;
                const deltaFromBest = totalCost - bestTotalCost;
                const deltaPercent = amount > 0 ? (deltaFromBest / amount) * 100 : 0;
                return {
                    id: providerId,
                    name: quote.provider,
                    fee: quote.fee,
                    marginPct,
                    fxRate: quote.rate,
                    recipientGets: quote.recipientGets,
                    delivery: quote.speed,
                    reliability: reliabilityMap.get(providerId) ?? 0.95,
                    methods: [(0, pulse_cache_keys_1.normalizePulseMethod)(filters.payin) || 'bank', (0, pulse_cache_keys_1.normalizePulseMethod)(filters.payout) || 'bank'].filter(Boolean),
                    bestFor: quote === bestQuote ? 'Best delivered value' : 'Competitive rate',
                    trueCost: {
                        upfrontFee: quote.fee,
                        hiddenMarkup,
                        hiddenMarkupPercent: marginPct * 100,
                        totalCost,
                        totalCostPercent,
                        deltaFromBest,
                        deltaPercent,
                        midMarketRate,
                        providerRate: quote.rate,
                        spreadBps: midMarketRate > 0 ? Math.round(((midMarketRate - quote.rate) / midMarketRate) * 10000) : 0,
                    },
                };
            });
            const arbitrage = bestQuote
                ? {
                    provider: bestQuote.provider,
                    currentRate: bestQuote.rate,
                    averageRate: midMarketRate,
                    savingsPercent: midMarketRate > 0 ? ((bestQuote.rate - midMarketRate) / midMarketRate) * 100 : 0,
                    percentile: 90,
                    isSignificant: midMarketRate > 0 ? (bestQuote.rate - midMarketRate) / midMarketRate > 0.01 : false,
                    recommendation: midMarketRate > 0 && (bestQuote.rate - midMarketRate) / midMarketRate > 0.01
                        ? 'Lock in now while rates are favorable.'
                        : 'Monitor pricing for a better entry.',
                }
                : null;
            const bankComparison = {
                bankMarkup: midMarketRate > 0 && worstQuote ? (midMarketRate - worstQuote.rate) / midMarketRate : 0,
                bankFee: worstQuote?.fee || 0,
                bankTotalCost: worstQuote ? worstQuote.fee + amount * ((midMarketRate - worstQuote.rate) / midMarketRate || 0) : 0,
                bestSpecialistMarkup: midMarketRate > 0 && bestQuote ? (midMarketRate - bestQuote.rate) / midMarketRate : 0,
                bestSpecialistFee: bestQuote?.fee || 0,
                bestSpecialistTotalCost: bestQuote ? bestQuote.fee + amount * ((midMarketRate - bestQuote.rate) / midMarketRate || 0) : 0,
                bestSpecialistName: bestQuote?.provider || 'n/a',
                savings: worstQuote && bestQuote ? (worstQuote.fee - bestQuote.fee) : 0,
                savingsPercent: worstQuote && bestQuote && worstQuote.fee > 0 ? ((worstQuote.fee - bestQuote.fee) / worstQuote.fee) * 100 : 0,
            };
            const costTrend = dailyStats.map((row) => {
                const timestamp = new Date(row.bucket).toISOString().slice(0, 10);
                const avgFee = toNumber(row.avg_fee, 0);
                const bestRate = toNumber(row.best_rate, 0);
                return {
                    date: timestamp,
                    averageHiddenFee: avgFee,
                    bestProvider: bestQuote?.provider || 'n/a',
                    bestProviderCost: bestRate ? (avgFee + amount * Math.max(0, (bestRate - toNumber(row.median_rate, 0)) / bestRate)) : avgFee,
                    marketLeaderDays: providerHeatmapDays.length,
                };
            });
            const smartSend = (() => {
                const avgRate = dailyStats.length > 0
                    ? dailyStats.reduce((sum, row) => sum + toNumber(row.avg_rate, 0), 0) / dailyStats.length
                    : midMarketRate;
                const currentRate = bestQuote?.rate || avgRate;
                const percentFromAvg = avgRate > 0 ? ((currentRate - avgRate) / avgRate) * 100 : 0;
                let level = 'fair';
                if (percentFromAvg >= 1.0)
                    level = 'great';
                else if (percentFromAvg >= 0.2)
                    level = 'good';
                else if (percentFromAvg <= -0.5)
                    level = 'wait';
                const messageMap = {
                    great: 'Rates are unusually favorable right now.',
                    good: 'Rates are slightly better than average.',
                    fair: 'Rates are in a normal range.',
                    wait: 'Rates are below average; consider waiting.',
                };
                return {
                    level,
                    message: messageMap[level],
                    rationale: ['Based on 30-day average', 'Derived from live provider quotes'],
                    lastUpdated: lastUpdated,
                };
            })();
            const hero = (() => {
                const points = dailyStats.map((row) => {
                    const midRate = toNumber(row.median_rate, 0) || toNumber(row.avg_rate, 0);
                    const bestRate = toNumber(row.best_rate, 0);
                    const bankRate = toNumber(row.worst_rate, 0) || midRate;
                    const spread = Math.max(0, bestRate - midRate);
                    const spreadPercent = midRate > 0 ? (spread / midRate) * 100 : 0;
                    return {
                        timestamp: new Date(row.bucket).getTime(),
                        midMarketRate: midRate,
                        bestProviderRate: bestRate,
                        bestProvider: bestQuote?.provider || 'n/a',
                        bankAverageRate: bankRate,
                        spread,
                        spreadPercent,
                    };
                });
                const currentSpread = points.length > 0 ? points[points.length - 1].spread : 0;
                const currentSpreadPercent = points.length > 0 ? points[points.length - 1].spreadPercent / 100 : 0;
                const currency = String(latestQuotes[0]?.dest_currency || 'USD');
                return {
                    points,
                    currentSpread,
                    currentSpreadPercent,
                    bestProvider: bestQuote?.provider || 'n/a',
                    lossOn1000: amount * currentSpreadPercent,
                    currency,
                    lastUpdated,
                };
            })();
            const fxRateHistoryPayload = await (async () => {
                const corridorSlug = (0, pulse_cache_keys_1.normalizePulseCorridor)(filters.corridor);
                const corridorPair = parseCorridorSlug(corridorSlug);
                if (!corridorPair)
                    return null;
                try {
                    const baseCurrency = corridorPair.sourceCurrency.toUpperCase();
                    const quoteCurrency = corridorPair.destCurrency.toUpperCase();
                    const historyDays = config_1.config.fxRates?.historyDays ?? 30;
                    const historyRepository = new fx_rate_history_repository_1.FxRateHistoryRepository(this.pool);
                    const historyRows = await historyRepository.getLatestHistory(baseCurrency, quoteCurrency, historyDays);
                    const history = historyRows.map((row) => ({
                        date: row.rate_date instanceof Date
                            ? row.rate_date.toISOString().slice(0, 10)
                            : String(row.rate_date),
                        rate: toNumber(row.rate, 0),
                        bid: row.bid !== null && row.bid !== undefined ? toNumber(row.bid, 0) : null,
                        ask: row.ask !== null && row.ask !== undefined ? toNumber(row.ask, 0) : null,
                        source: row.source ?? null,
                    }));
                    const historyUpdatedAt = historyRows.length > 0
                        ? toIsoString(historyRows[0].created_at ?? historyRows[0].rate_date) ?? lastUpdated
                        : lastUpdated;
                    return {
                        baseCurrency,
                        quoteCurrency,
                        history,
                        lastUpdated: historyUpdatedAt,
                    };
                }
                catch (error) {
                    logger.warn('fx_rate_history_load_failed', {
                        corridor: corridorSlug,
                        error: error instanceof Error ? error.message : String(error),
                    });
                    return null;
                }
            })();
            const charts = ['all-in-cost', 'fx-markup', 'fee-vs-markup', 'spread-distribution', 'provider-winner', 'leader-change-frequency', 'leader-edge', 'pass-through-latency', 'volatility-pulse', 'quote-anomalies', 'spread-volatility', 'quote-success', 'provider-availability', 'data-freshness', 'corridor-liquidity'];
            const chartEntries = charts.map((chartId) => ({
                key: `pulse:chart:${chartId}`,
                payload: buildChartSeries(chartId, dailyStats, providerDaily, attemptRows, amount),
            }));
            const map = new Map();
            map.set('pulse:overview', {
                total_corridors: toNumber(overviewRow?.total_corridors, 0),
                active_providers: toNumber(overviewRow?.active_providers, 0),
                corridors_with_quotes: toNumber(overviewRow?.corridors_with_quotes, 0),
                avg_freshness_minutes: toNumber(overviewRow?.avg_freshness_minutes, 0),
            });
            map.set('pulse:coverage-summary', {
                total_corridors: toNumber(coverageRow?.total_corridors, 0),
                covered_corridors: toNumber(coverageRow?.covered_corridors, 0),
                coverage_percentage: toNumber(coverageRow?.coverage_percentage, 0),
            });
            map.set('pulse:snapshot-summary', {
                total_quotes: toNumber(snapshotRow?.total_quotes, 0),
                unique_corridors: toNumber(snapshotRow?.unique_corridors, 0),
                unique_providers: toNumber(snapshotRow?.unique_providers, 0),
                oldest_quote: toIsoString(snapshotRow?.oldest_quote) ?? lastUpdated,
                newest_quote: toIsoString(snapshotRow?.newest_quote) ?? lastUpdated,
            });
            map.set('pulse:method-coverage', methodCoverage);
            map.set('pulse:table', tableData);
            map.set('pulse:provider-benchmarking', benchmarkingRows.map((row) => ({
                provider_id: row.provider_id,
                provider_name: row.provider_name,
                quote_count: toNumber(row.quote_count, 0),
                avg_rate: toNumber(row.avg_rate, 0),
                avg_fee: toNumber(row.avg_fee, 0),
                avg_freshness_minutes: toNumber(row.avg_freshness_minutes, 0),
            })));
            map.set('pulse:events', eventRows.map((row) => ({
                id: row.id,
                provider_id: row.provider_id,
                corridor_id: row.corridor_id,
                block_reason: row.block_reason,
                http_status: row.http_status,
                created_at: toIsoString(row.created_at),
            })));
            map.set('pulse:provider-heatmap', {
                days: providerHeatmapDays,
                providerStats: providerStats,
                lastUpdated,
            });
            map.set('pulse:smart-send', smartSend);
            map.set('pulse:market-snapshot', {
                quotes: updatedQuotes,
                midMarketRate,
                currency: latestQuotes[0]?.dest_currency || 'USD',
                amount,
                lastUpdated,
            });
            map.set('pulse:true-cost', trueCost);
            map.set('pulse:market-depth', marketDepth);
            map.set('pulse:arbitrage', arbitrage);
            map.set('pulse:bank-comparison', bankComparison);
            map.set('pulse:cost-trend', costTrend);
            map.set('pulse:hero', hero);
            if (fxRateHistoryPayload) {
                map.set('pulse:fx-rate-history', fxRateHistoryPayload);
            }
            for (const entry of chartEntries) {
                map.set(entry.key, entry.payload);
            }
            await repository_cache_1.pulseCache.set(cacheKey, Object.fromEntries(map));
            const poolStats = {
                total: this.pool.totalCount,
                idle: this.pool.idleCount,
                waiting: this.pool.waitingCount,
            };
            logger.debug('pulse_cache_aggregate_pool_stats', poolStats);
            success = true;
            return map;
        }
        catch (error) {
            const { message } = (0, error_handling_1.formatError)(error);
            errorType = (0, error_handling_1.isError)(error) ? error.code || 'unknown' : 'unknown';
            logger.error('pulse_cache_aggregate_failed', { error: message });
            throw error;
        }
        finally {
            const durationMs = Date.now() - startTime;
            await (0, repository_metrics_1.recordRepositoryMetric)('pulse-cache', 'aggregate', durationMs, success, errorType);
        }
    }
    async getEntry(key) {
        const startTime = Date.now();
        let success = false;
        let errorType;
        try {
            const cached = await repository_cache_1.pulseCache.get(key);
            if (cached !== null) {
                return cached;
            }
            const result = await (0, repository_retry_1.withCircuitBreaker)('pulse-cache', async () => {
                return await (0, repository_retry_1.withRetry)(async () => {
                    return await (0, db_1.query)(`SELECT payload FROM gold.pulse_cache WHERE key = $1`, [key], this.pool);
                });
            });
            const payload = result.rows[0]?.payload;
            if (!payload) {
                return null;
            }
            let parsed;
            try {
                parsed = JSON.parse(payload);
            }
            catch (error) {
                logger.debug('pulse_cache_payload_parse_failed', {
                    key,
                    error: error instanceof Error ? error.message : String(error),
                });
                parsed = payload;
            }
            await repository_cache_1.pulseCache.set(key, parsed);
            success = true;
            return parsed;
        }
        catch (error) {
            const { message } = (0, error_handling_1.formatError)(error);
            errorType = (0, error_handling_1.isError)(error) ? error.code || 'unknown' : 'unknown';
            logger.error('pulse_cache_get_failed', { key, error: message });
            throw error;
        }
        finally {
            const durationMs = Date.now() - startTime;
            await (0, repository_metrics_1.recordRepositoryMetric)('pulse-cache', 'get', durationMs, success, errorType);
        }
    }
    async invalidateEntry(key) {
        try {
            await repository_cache_1.pulseCache.invalidate(key);
            logger.debug('pulse_cache_invalidated', { key });
        }
        catch (error) {
            const { message } = (0, error_handling_1.formatError)(error);
            logger.warn('pulse_cache_invalidate_failed', { key, error: message });
        }
    }
}
exports.PulseCacheRepository = PulseCacheRepository;
