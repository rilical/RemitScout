const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const httpLimits = {
  rpm: toNumber(process.env.PLANE_B_SINGX_RPM, 20),
  concurrency: toNumber(process.env.PLANE_B_SINGX_CONCURRENCY, 2),
  perLocale: true,
  perCorridorRpm: toNumber(process.env.PLANE_B_SINGX_CORRIDOR_RPM, 4),
}

export const playwrightLimits = {
  rpm: toNumber(process.env.PLANE_B_SINGX_PLAYWRIGHT_RPM, 4),
  concurrency: toNumber(process.env.PLANE_B_SINGX_PLAYWRIGHT_CONCURRENCY, 1),
  perLocale: true,
  perCorridorRpm: toNumber(process.env.PLANE_B_SINGX_PLAYWRIGHT_CORRIDOR_RPM, 2),
}
