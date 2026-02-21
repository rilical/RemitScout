"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterQueuesByRightsMatrix = void 0;
const corridor_1 = require("../../../shared/corridor");
const logger_1 = require("../../../shared/logger");
const logger = (0, logger_1.createLogger)('plane-b.rights-matrix-filter');
const normalizeCountryList = (countries) => {
    if (!Array.isArray(countries))
        return [];
    return countries
        .map((code) => code?.trim().toUpperCase())
        .filter((code) => Boolean(code));
};
const isCountryAllowed = (list, code) => {
    return list.length > 0 && list.includes(code.toUpperCase());
};
const filterCorridors = (corridors, rights) => {
    const sourceCountries = normalizeCountryList(rights.sourceCountries);
    const destinationCountries = normalizeCountryList(rights.destinationCountries);
    if (sourceCountries.length === 0 || destinationCountries.length === 0) {
        return [];
    }
    return corridors.filter((corridorId) => {
        const parsed = (0, corridor_1.parseCorridorId)(corridorId);
        if (!parsed)
            return false;
        return isCountryAllowed(sourceCountries, parsed.sourceCountry)
            && isCountryAllowed(destinationCountries, parsed.destCountry);
    });
};
const filterQueuesByRightsMatrix = (queues, rights, providerId) => {
    if (!rights) {
        logger.info('rights_matrix_filter_skipped', {
            provider_id: providerId,
            reason: 'missing_rights_entry',
        });
        return { tier1: [], tier2: [], all: [] };
    }
    const sourceCountries = normalizeCountryList(rights.sourceCountries);
    const destinationCountries = normalizeCountryList(rights.destinationCountries);
    if (sourceCountries.length === 0 || destinationCountries.length === 0) {
        logger.info('rights_matrix_filter_skipped', {
            provider_id: providerId,
            reason: 'missing_country_sets',
            source_count: sourceCountries.length,
            destination_count: destinationCountries.length,
        });
        return { tier1: [], tier2: [], all: [] };
    }
    const filtered = {
        tier1: filterCorridors(queues.tier1, rights),
        tier2: filterCorridors(queues.tier2, rights),
        all: filterCorridors(queues.all, rights),
    };
    logger.info('rights_matrix_filter_applied', {
        provider_id: providerId,
        before_all: queues.all.length,
        after_all: filtered.all.length,
        before_tier1: queues.tier1.length,
        after_tier1: filtered.tier1.length,
        before_tier2: queues.tier2.length,
        after_tier2: filtered.tier2.length,
    });
    return filtered;
};
exports.filterQueuesByRightsMatrix = filterQueuesByRightsMatrix;
