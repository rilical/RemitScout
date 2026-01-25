const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const httpLimits = {
  rpm: toNumber(process.env.PLANE_B_TRANSFERGO_RPM, 8),
  maxRpm: toNumber(process.env.PLANE_B_TRANSFERGO_MAX_RPM, 12),
  concurrency: toNumber(process.env.PLANE_B_TRANSFERGO_CONCURRENCY, 2),
  perLocale: true,
  perCorridorRpm: toNumber(process.env.PLANE_B_TRANSFERGO_CORRIDOR_RPM, 3),
}

/**
 * MVP: Playwright support is not yet implemented.
 * These limits are defined for future use and do not affect current functionality.
 */
export const playwrightLimits = {
  rpm: toNumber(process.env.PLANE_B_TRANSFERGO_PLAYWRIGHT_RPM, 4),
  concurrency: toNumber(process.env.PLANE_B_TRANSFERGO_PLAYWRIGHT_CONCURRENCY, 1),
  perLocale: true,
  perCorridorRpm: toNumber(process.env.PLANE_B_TRANSFERGO_PLAYWRIGHT_CORRIDOR_RPM, 2),
}
