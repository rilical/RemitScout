type B2bEffectiveRateInput = {
  baseRate?: unknown
  sendAmount?: unknown
  receiveAmount?: unknown
  impliedFxRate?: unknown
}

const toPositiveNumber = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/**
 * B2B Gold/weighting/volatility paths must not consume promotional rate effects.
 * Resolution order:
 * 1) base_rate when available
 * 2) derived rate from receive_amount / send_amount
 * 3) implied_fx_rate as a compatibility fallback
 */
export const resolveB2bEffectiveRate = (input: B2bEffectiveRateInput): number | null => {
  const baseRate = toPositiveNumber(input.baseRate)
  if (baseRate !== null) return baseRate

  const sendAmount = toPositiveNumber(input.sendAmount)
  const receiveAmount = toPositiveNumber(input.receiveAmount)
  if (sendAmount !== null && receiveAmount !== null) {
    return receiveAmount / sendAmount
  }

  return toPositiveNumber(input.impliedFxRate)
}

export const buildB2bEffectiveRateSql = (alias: string): string => `COALESCE(
  NULLIF(${alias}.base_rate::double precision, 0),
  CASE
    WHEN ${alias}.send_amount IS NOT NULL
      AND ${alias}.send_amount::double precision > 0
      AND ${alias}.receive_amount IS NOT NULL
      AND ${alias}.receive_amount::double precision > 0
      THEN ${alias}.receive_amount::double precision / ${alias}.send_amount::double precision
    ELSE NULL
  END,
  NULLIF(${alias}.implied_fx_rate::double precision, 0)
)`
