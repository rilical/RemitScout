const truncateToDecimals = (value: number, digits: number) => {
  const factor = 10 ** digits
  const sign = value < 0 ? -1 : 1
  return sign * Math.trunc(Math.abs(value) * factor) / factor
}

export const formatExchangeRateValue = (rate: number, digits = 3) => {
  if (!Number.isFinite(rate)) return '—'
  return truncateToDecimals(rate, digits).toFixed(digits)
}

export const formatExchangeRateLabel = (
  rate: number,
  from = 'USD',
  to = 'PHP',
  digits = 3,
) => `1 ${from} -> ${formatExchangeRateValue(rate, digits)} ${to}`
