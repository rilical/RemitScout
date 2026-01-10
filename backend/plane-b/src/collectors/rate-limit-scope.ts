export const resolveRateLimitScope = (collectorType?: string | null): string | null => {
  if (!collectorType) return null
  return collectorType.startsWith('b2c') ? 'b2c' : null
}
