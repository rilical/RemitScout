const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const httpLimits = {
  rpm: toNumber(process.env.PLANE_B_INTERMEX_RPM, 20),
  concurrency: toNumber(process.env.PLANE_B_INTERMEX_CONCURRENCY, 1),
  perLocale: true,
  perCorridorRpm: toNumber(process.env.PLANE_B_INTERMEX_CORRIDOR_RPM, 4),
}

/**
 * MVP: Playwright support is not yet implemented.
 * These limits are defined for future use and do not affect current functionality.
 */
export const playwrightLimits = {
  rpm: toNumber(process.env.PLANE_B_INTERMEX_PLAYWRIGHT_RPM, 4),
  concurrency: toNumber(process.env.PLANE_B_INTERMEX_PLAYWRIGHT_CONCURRENCY, 1),
  perLocale: true,
  perCorridorRpm: toNumber(process.env.PLANE_B_INTERMEX_PLAYWRIGHT_CORRIDOR_RPM, 2),
}
