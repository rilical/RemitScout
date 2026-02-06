export type FxProviderPricingRow = {
  id: string
  name: string
  speed: string
  rate: string
  markupPercent: string
}

export type FxProviderRateDto = {
  name: string
  rate: number
  markupBps?: number
  speed?: string
}

export function toFxProviderPricingRows(
  providerRates: FxProviderRateDto[] | undefined,
  quote: string,
) {
  if (!providerRates?.length) return []

  return providerRates.map((item) => {
    const markup = typeof item.markupBps === 'number' ? item.markupBps / 100 : null

    return {
      id: item.name,
      name: item.name,
      speed: item.speed || 'N/A',
      rate: `${quote} ${item.rate.toFixed(4)}`,
      markupPercent: markup === null ? '—' : `${markup.toFixed(2)}%`,
    }
  })
}
