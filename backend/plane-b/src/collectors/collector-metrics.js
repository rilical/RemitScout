"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsContentType = exports.getMetrics = exports.updateCircuitBreakerState = exports.recordCollection = void 0;
const prom_client_1 = require("prom-client");
const metrics_registry_1 = require("../../../shared/metrics-registry");
Object.defineProperty(exports, "getMetrics", { enumerable: true, get: function () { return metrics_registry_1.getMetrics; } });
Object.defineProperty(exports, "metricsContentType", { enumerable: true, get: function () { return metrics_registry_1.metricsContentType; } });
const cloudwatch_metrics_1 = require("../../../shared/cloudwatch-metrics");
const environmentDimension = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';
const providerCollectionSuccessTotal = new prom_client_1.Counter({
    name: 'provider_collection_success_total',
    help: 'Successful provider collections.',
    labelNames: ['provider_id', 'corridor_id'],
    registers: [metrics_registry_1.metricsRegistry],
});
const providerCollectionFailureTotal = new prom_client_1.Counter({
    name: 'provider_collection_failure_total',
    help: 'Failed provider collections.',
    labelNames: ['provider_id', 'corridor_id', 'error_type'],
    registers: [metrics_registry_1.metricsRegistry],
});
const providerCollectionDurationSeconds = new prom_client_1.Histogram({
    name: 'provider_collection_duration_seconds',
    help: 'Provider collection duration.',
    labelNames: ['provider_id', 'corridor_id'],
    buckets: [0.5, 1, 2, 5, 10, 30, 60],
    registers: [metrics_registry_1.metricsRegistry],
});
const circuitBreakerState = new prom_client_1.Gauge({
    name: 'circuit_breaker_state',
    help: 'Circuit breaker state (0=closed, 1=open, 2=half_open).',
    labelNames: ['provider_id', 'corridor_id'],
    registers: [metrics_registry_1.metricsRegistry],
});
const normalizeCorridorId = (corridorId) => corridorId ?? 'global';
const recordCollection = (providerId, corridorId, success, durationSeconds, errorType) => {
    const provider = providerId || 'unknown';
    const corridor = normalizeCorridorId(corridorId);
    if (success) {
        providerCollectionSuccessTotal.inc({ provider_id: provider, corridor_id: corridor });
        (0, cloudwatch_metrics_1.recordCloudWatchMetric)({
            name: 'provider_collection_success_total',
            value: 1,
            unit: 'Count',
            dimensions: { provider_id: provider, corridor_id: corridor },
            highCardinality: true,
        });
        (0, cloudwatch_metrics_1.recordCloudWatchMetric)({
            name: 'provider_collection_success_by_provider_total',
            value: 1,
            unit: 'Count',
            dimensions: {
                provider_id: provider,
                environment: environmentDimension,
            },
            highCardinality: true,
        });
    }
    else {
        providerCollectionFailureTotal.inc({
            provider_id: provider,
            corridor_id: corridor,
            error_type: errorType || 'unknown',
        });
        (0, cloudwatch_metrics_1.recordCloudWatchMetric)({
            name: 'provider_collection_failure_total',
            value: 1,
            unit: 'Count',
            dimensions: {
                provider_id: provider,
                corridor_id: corridor,
                error_type: errorType || 'unknown',
            },
            highCardinality: true,
        });
        (0, cloudwatch_metrics_1.recordCloudWatchMetric)({
            name: 'provider_collection_failure_by_provider_total',
            value: 1,
            unit: 'Count',
            dimensions: {
                provider_id: provider,
                environment: environmentDimension,
            },
            highCardinality: true,
        });
    }
    if (typeof durationSeconds === 'number' && Number.isFinite(durationSeconds) && durationSeconds >= 0) {
        providerCollectionDurationSeconds.observe({ provider_id: provider, corridor_id: corridor }, durationSeconds);
        (0, cloudwatch_metrics_1.recordCloudWatchMetric)({
            name: 'provider_collection_duration_seconds',
            value: durationSeconds,
            unit: 'Seconds',
            dimensions: { provider_id: provider, corridor_id: corridor },
            highCardinality: true,
        });
    }
};
exports.recordCollection = recordCollection;
const updateCircuitBreakerState = (providerId, corridorId, state) => {
    const provider = providerId || 'unknown';
    const corridor = normalizeCorridorId(corridorId);
    const stateValue = state === 'closed' ? 0 : state === 'open' ? 1 : 2;
    circuitBreakerState.set({ provider_id: provider, corridor_id: corridor }, stateValue);
    (0, cloudwatch_metrics_1.recordCloudWatchMetric)({
        name: 'circuit_breaker_state',
        value: stateValue,
        unit: 'Count',
        dimensions: { provider_id: provider, corridor_id: corridor },
        highCardinality: true,
    });
};
exports.updateCircuitBreakerState = updateCircuitBreakerState;
