"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolatilityService = void 0;
const volatility_service_1 = require("../../../shared/volatility-service");
const logger_1 = require("../../../shared/logger");
const repositories_1 = require("../repositories");
const logger = (0, logger_1.createLogger)('plane-b.volatility-service');
class VolatilityService {
    service;
    repo;
    constructor(pool) {
        this.repo = new repositories_1.CorridorVolatilityRepository(pool);
        this.service = new volatility_service_1.VolatilityService(this.repo);
    }
    getCacheTtlForCorridor(corridorId) {
        return this.service.getCacheTtlForCorridor(corridorId);
    }
    async getCacheTtlForCorridors(corridorIds) {
        const volatilityMap = await this.repo.getVolatilityScores(corridorIds);
        const allowOnDemand = process.env.VOLATILITY_CACHE_ON_DEMAND === '1';
        const missingCorridorIds = allowOnDemand
            ? corridorIds.filter(id => !volatilityMap.has(id))
            : [];
        if (missingCorridorIds.length > 0) {
            const calculationPromises = missingCorridorIds.map(async (corridorId) => {
                try {
                    const calculated = await this.repo.calculateVolatilityScore(corridorId);
                    if (calculated) {
                        volatilityMap.set(corridorId, calculated);
                    }
                }
                catch (error) {
                    logger.error('volatility_calculation_failed', {
                        corridor_id: corridorId,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            });
            await Promise.all(calculationPromises);
        }
        const resultMap = new Map();
        for (const corridorId of corridorIds) {
            const record = volatilityMap.get(corridorId);
            if (!record) {
                resultMap.set(corridorId, (0, volatility_service_1.buildCacheTtlResult)(null, false));
                continue;
            }
            resultMap.set(corridorId, (0, volatility_service_1.buildCacheTtlResult)(record.volatility_score, true));
        }
        return resultMap;
    }
    async refreshCacheForCorridors(corridorIds) {
        return this.repo.upsertVolatilityForCorridors(corridorIds);
    }
}
exports.VolatilityService = VolatilityService;
