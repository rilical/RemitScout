type NumberFormatOptions = Intl.NumberFormatOptions

const safeNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export const useAdminFormat = () => {
  const formatNumber = (
    value: unknown,
    options: number | NumberFormatOptions = {},
  ) => {
    const numeric = safeNumber(value)
    if (numeric === null) return '—'

    const normalizedOptions = typeof options === 'number'
      ? { maximumFractionDigits: options, minimumFractionDigits: 0 }
      : options

    return new Intl.NumberFormat('en-US', normalizedOptions).format(numeric)
  }

  const formatPercent = (value: unknown, digits = 1) => {
    const numeric = safeNumber(value)
    if (numeric === null) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: digits,
    }).format(numeric)
  }

  const formatCurrency = (value: unknown, currency = 'USD', options: NumberFormatOptions = {}) => {
    const numeric = safeNumber(value)
    if (numeric === null) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      ...options,
    }).format(numeric)
  }

  const formatDateTime = (value: string | number | Date | null | undefined) => {
    if (!value) return '—'
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  const formatDate = (value: string | number | Date | null | undefined) => {
    if (!value) return '—'
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
    }).format(date)
  }

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds && seconds !== 0) return '—'
    const total = Math.max(0, Math.floor(seconds))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const secs = total % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  return {
    formatNumber,
    formatPercent,
    formatCurrency,
    formatDateTime,
    formatDate,
    formatDuration,
    formatTimestamp: formatDateTime,
  }
}
