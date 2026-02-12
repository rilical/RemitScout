import { config } from '../../../../shared/config'

const http = config.planeB.providerLimits.http.wise
const playwright = config.planeB.providerLimits.playwright.wise

export const httpLimits = {
  rpm: http.rpm,
  concurrency: http.concurrency,
  perLocale: true,
  perCorridorRpm: http.perCorridorRpm,
}

/**
 * MVP: Playwright support is not yet implemented.
 * These limits are defined for future use and do not affect current functionality.
 */
export const playwrightLimits = {
  rpm: playwright.rpm,
  concurrency: playwright.concurrency,
  perLocale: true,
  perCorridorRpm: playwright.perCorridorRpm,
}
