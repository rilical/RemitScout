export const EXPORTS_MAX_WINDOW_DAYS_HARD_CAP = 30

export const clampExportDays = (days: number) => {
  if (!Number.isFinite(days)) return EXPORTS_MAX_WINDOW_DAYS_HARD_CAP
  return Math.min(Math.max(Math.floor(days), 1), EXPORTS_MAX_WINDOW_DAYS_HARD_CAP)
}

