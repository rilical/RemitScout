"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasProvider = exports.getProviderIds = exports.getProvider = exports.providerRegistry = void 0;
/**
 * LLM Code Map:
 * - `providerDefinitions`: single source for provider wiring and static metadata.
 * - `providerRegistry`: runtime registry consumed by Plane B ingest/refresh workers.
 * - Exports:
 *   - `getProvider(providerId)`: lookup provider entry.
 *   - `getProviderIds()`: list all provider ids (used by probes, schedulers, workflows).
 *   - `hasProvider(providerId)`: membership check.
 */
const registry_builder_1 = require("./registry-builder");
const provider_definitions_1 = require("./provider-definitions");
/**
 * Central runtime registry for provider metadata and collector entry points.
 */
exports.providerRegistry = (0, registry_builder_1.buildProviderRegistry)(provider_definitions_1.providerDefinitions);
(0, registry_builder_1.validateProviderRegistry)(exports.providerRegistry);
const providerRegistryById = new Map(exports.providerRegistry.map(provider => [provider.providerId, provider]));
const getProvider = (providerId) => providerRegistryById.get(providerId);
exports.getProvider = getProvider;
const getProviderIds = () => exports.providerRegistry.map(provider => provider.providerId);
exports.getProviderIds = getProviderIds;
const hasProvider = (providerId) => providerRegistryById.has(providerId);
exports.hasProvider = hasProvider;
