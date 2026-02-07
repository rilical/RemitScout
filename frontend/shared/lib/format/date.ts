import { formatRelativeTime } from './relative'

export function formatDate(
  value: string | Date,
  opts?: { locale?: string, style?: 'short' | 'long' },
): string {
  const locale = opts?.locale ?? 'en-US'
  const style = opts?.style ?? 'short'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return String(value)

  const options: Intl.DateTimeFormatOptions = style === 'long'
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' }

  try {
    return new Intl.DateTimeFormat(locale, options).format(date)
  }
  catch {
    return date.toISOString()
  }
}

/**
 * Long "Month YYYY" label.
 * Useful for invoices and billing history.
 */
export function formatMonthYear(value: string | Date, opts?: { locale?: string }): string {
  const locale = opts?.locale ?? 'en-US'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return String(value)

  try {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(date)
  }
  catch {
    return date.toISOString()
  }
}

/**
 * Short "Mon D" label (no year).
 * Useful for chart axes and sparklines where the year is not important.
 */
export function formatMonthDay(value: string | Date, opts?: { locale?: string }): string {
  const locale = opts?.locale ?? 'en-US'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return String(value)

  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date)
  }
  catch {
    return date.toISOString()
  }
}

export function formatDateTime(value: string | Date, opts?: { locale?: string }): string {
  const locale = opts?.locale ?? 'en-US'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return String(value)

  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }
  catch {
    return date.toISOString()
  }
}

/**
 * Short "Month Day, h:mm AM" style label (no year).
 * Useful for tables where the year is not important.
 */
export function formatShortDateTime(value: string | Date, opts?: { locale?: string }): string {
  const locale = opts?.locale ?? 'en-US'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return String(value)

  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }
  catch {
    return date.toISOString()
  }
}

export function formatUpdatedLabel(
  updatedAt: string | Date | null | undefined,
  opts?: { locale?: string },
): string {
  if (!updatedAt) return 'Updated —'
  const locale = opts?.locale ?? 'en-US'
  const date = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt
  if (Number.isNaN(date.getTime())) return 'Updated —'
  return `Updated ${formatRelativeTime(date, { locale })}`
}
