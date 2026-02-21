"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playwrightLimits = exports.httpLimits = void 0;
const config_1 = require("../../../../shared/config");
const http = config_1.config.planeB.providerLimits.http.ria;
const playwright = config_1.config.planeB.providerLimits.playwright.ria;
exports.httpLimits = {
    rpm: http.rpm,
    concurrency: http.concurrency,
    perLocale: true,
    perCorridorRpm: http.perCorridorRpm,
};
/**
 * MVP: Playwright support is not yet implemented.
 * These limits are defined for future use and do not affect current functionality.
 */
exports.playwrightLimits = {
    rpm: playwright.rpm,
    concurrency: playwright.concurrency,
    perLocale: true,
    perCorridorRpm: playwright.perCorridorRpm,
};
