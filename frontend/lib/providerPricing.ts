type PromoInfo = {
  fee: number
  rate: number
  newCustomersOnly: boolean
} | null | undefined

type ComparablePricingInput = {
  feeAmount?: number | null
  fxRate?: number | null
  hasPromo?: boolean
  promoInfo?: PromoInfo
}

const toFiniteNumber = (value: number | null | undefined) => (
  Number.isFinite(value) ? Number(value) : 0
)

export function resolveComparableProviderPricing(input: ComparablePricingInput) {
  const hasComparablePromo = Boolean(
    input.hasPromo
    && input.promoInfo
    && input.promoInfo.newCustomersOnly !== true,
  )

  return {
    providerRate: hasComparablePromo ? toFiniteNumber(input.promoInfo?.rate) : toFiniteNumber(input.fxRate),
    upfrontFee: hasComparablePromo ? toFiniteNumber(input.promoInfo?.fee) : toFiniteNumber(input.feeAmount),
  }
}
