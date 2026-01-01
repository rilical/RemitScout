const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const httpLimits = {
  rpm: toNumber(process.env.PLANE_B_WISE_RPM, 30),
  concurrency: toNumber(process.env.PLANE_B_WISE_CONCURRENCY, 2),
  perLocale: true,
  perCorridorRpm: toNumber(process.env.PLANE_B_WISE_CORRIDOR_RPM, 2),
}

export const playwrightLimits = {
  rpm: toNumber(process.env.PLANE_B_WISE_PLAYWRIGHT_RPM, 4),
  concurrency: toNumber(process.env.PLANE_B_WISE_PLAYWRIGHT_CONCURRENCY, 1),
  perLocale: true,
  perCorridorRpm: toNumber(process.env.PLANE_B_WISE_PLAYWRIGHT_CORRIDOR_RPM, 2),
}
