export function formatNumber(
  value: number,
  opts?: Intl.NumberFormatOptions & { locale?: string },
): string {
  const { locale, ...nfOpts } = opts ?? {}
  try {
    return new Intl.NumberFormat(locale ?? 'en-US', nfOpts).format(value)
  }
  catch {
    return String(value)
  }
}

export function formatCompactNumber(value: number, opts?: { locale?: string }): string {
  const locale = opts?.locale ?? 'en-US'
  try {
    return new Intl.NumberFormat(locale, { notation: 'compact', compactDisplay: 'short' }).format(value)
  }
  catch {
    return String(value)
  }
}

/**
 * valuePct is a percent value (e.g. 2.3 => "2.3%").
 */
export function formatPercent(
  valuePct: number,
  opts?: { locale?: string, digits?: number, sign?: boolean },
): string {
  const locale = opts?.locale ?? 'en-US'
  const digits = opts?.digits ?? 1
  const sign = opts?.sign ?? false

  // Always render '-' for negative values; `sign` only controls adding '+' for positives.
  const prefix = valuePct < 0 ? '-' : sign && valuePct > 0 ? '+' : ''
  const abs = Math.abs(valuePct)

  // Using NumberFormat percent would require a fraction (0.023). Keep this explicit to avoid confusion.
  const body = formatNumber(abs, { locale, minimumFractionDigits: digits, maximumFractionDigits: digits })
  return `${prefix}${body}%`
}
