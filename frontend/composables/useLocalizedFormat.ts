export function useLocalizedFormat() {
  const { locale } = useI18n()

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    try {
      return new Intl.NumberFormat(locale.value, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    }
    catch (error) {
      return `${currency} ${amount.toFixed(2)}`
    }
  }

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(locale.value, options).format(number)
  }

  const formatPercent = (value: number, decimals: number = 1): string => {
    return new Intl.NumberFormat(locale.value, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100)
  }

  const formatDate = (date: Date | string, format: 'short' | 'long' = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    const options: Intl.DateTimeFormatOptions
      = format === 'long'
        ? {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          }
        : {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }

    return new Intl.DateTimeFormat(locale.value, options).format(dateObj)
  }

  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    return new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: locale.value === 'en',
    }).format(dateObj)
  }

  const formatRelativeTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

    const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })

    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second')
    }
    else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
    }
    else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
    }
    else if (diffInSeconds < 604800) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
    }
    else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 604800), 'week')
    }
    else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month')
    }
    else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year')
    }
  }

  return {
    formatCurrency,
    formatNumber,
    formatPercent,
    formatDate,
    formatDateTime,
    formatRelativeTime,
  }
}
