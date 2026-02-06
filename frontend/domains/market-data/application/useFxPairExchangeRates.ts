import type { Ref } from 'vue'
import { computed } from 'vue'
import { fetchProviderRates, fetchSpotRate } from '~/domains/market-data/infrastructure/fxRatesApi'
import { toFxProviderPricingRows } from '~/domains/market-data/application/fxProviderPricing'

export function useFxPairExchangeRates(base: Ref<string>, quote: Ref<string>) {
  const { data: spotRate, pending: spotPending, error: spotError } = useAsyncData(
    () => `fx-spot-${base.value}-${quote.value}`,
    () => fetchSpotRate(base.value, quote.value),
    { watch: [base, quote] },
  )

  const { data: providerRates, pending: providerPending, error: providerError } = useAsyncData(
    () => `fx-providers-${base.value}-${quote.value}`,
    () => fetchProviderRates(base.value, quote.value),
    { watch: [base, quote] },
  )

  const pending = computed(() => spotPending.value || providerPending.value)
  const error = computed(() => spotError.value || providerError.value)

  const midMarketRate = computed(() => {
    if (!spotRate.value?.rate) return `${base.value} 1 = ${quote.value} N/A`
    return `${base.value} 1 = ${quote.value} ${spotRate.value.rate.toFixed(4)}`
  })

  const providerPricingRows = computed(() => (
    toFxProviderPricingRows(providerRates.value?.data, quote.value)
  ))

  return {
    spotRate,
    providerRates,
    pending,
    error,
    midMarketRate,
    providerPricingRows,
  }
}
