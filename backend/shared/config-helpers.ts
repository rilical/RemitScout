export const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const toBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback
  const normalized = value.trim().toLowerCase()
  if (normalized === '') return fallback
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

export const toList = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const clampInt = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.floor(value)))
}

export const toPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

