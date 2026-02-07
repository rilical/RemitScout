export function formatRelativeTime(value: string | Date, opts?: { locale?: string }): string {
  const locale = opts?.locale ?? 'en-US'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'

  const now = Date.now()
  const diffSeconds = Math.round((date.getTime() - now) / 1000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  const abs = Math.abs(diffSeconds)
  if (abs < 60) return rtf.format(diffSeconds, 'second')

  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute')

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')

  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day')

  const diffWeeks = Math.round(diffDays / 7)
  if (Math.abs(diffWeeks) < 5) return rtf.format(diffWeeks, 'week')

  const diffMonths = Math.round(diffDays / 30)
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month')

  const diffYears = Math.round(diffDays / 365)
  return rtf.format(diffYears, 'year')
}
