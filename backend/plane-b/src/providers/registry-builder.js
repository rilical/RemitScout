"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProviderRegistry = exports.buildProviderRegistry = void 0;
const provider_catalog_1 = require("../../../shared/provider-catalog");
const withRegistryRunOptions = (options) => ({
    ...options,
    closePool: false,
});
const buildProviderRegistry = (definitions) => {
    return definitions.map((definition) => ({
        providerId: definition.providerId,
        displayName: definition.displayName,
        supportedCorridors: definition.supportedCorridors,
        baseRates: definition.baseRates,
        run: (options) => definition.runCollector(withRegistryRunOptions(options)),
    }));
};
exports.buildProviderRegistry = buildProviderRegistry;
const validateProviderRegistry = (registry) => {
    const ids = new Set();
    for (const entry of registry) {
        if (!entry.providerId || typeof entry.providerId !== 'string') {
            throw new Error('Provider registry entry missing providerId');
        }
        if (ids.has(entry.providerId)) {
            throw new Error(`Provider registry has duplicate providerId: ${entry.providerId}`);
        }
        ids.add(entry.providerId);
        if (!entry.displayName || typeof entry.displayName !== 'string') {
            throw new Error(`Provider registry entry missing displayName: ${entry.providerId}`);
        }
        if (!Array.isArray(entry.supportedCorridors)) {
            throw new Error(`Provider registry entry missing supportedCorridors: ${entry.providerId}`);
        }
        if (!entry.baseRates
            || !Number.isFinite(entry.baseRates.rpm)
            || !Number.isFinite(entry.baseRates.perCorridorRpm)) {
            throw new Error(`Provider registry entry missing baseRates: ${entry.providerId}`);
        }
        if (typeof entry.run !== 'function') {
            throw new Error(`Provider registry entry missing run function: ${entry.providerId}`);
        }
    }
    const catalogProviderIds = new Set((0, provider_catalog_1.listProviders)());
    for (const providerId of ids) {
        if (!catalogProviderIds.has(providerId)) {
            throw new Error(`Provider registry providerId missing from catalog: ${providerId}`);
        }
    }
    for (const providerId of catalogProviderIds) {
        if (!ids.has(providerId)) {
            throw new Error(`Provider catalog providerId missing from providerRegistry: ${providerId}`);
        }
    }
};
exports.validateProviderRegistry = validateProviderRegistry;
