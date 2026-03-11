import { computed, isReadonly, ref, watch, type Ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { getCountryByCode, getCountryCurrencies } from '~/utils/countries-currencies'

type CorridorCurrencyPair = {
  fromCurrency: string
  toCurrency: string
}

type CorridorCurrencyResponse = {
  from: string
  to: string
  fromCurrencies: string[]
  toCurrencies: string[]
  pairs: CorridorCurrencyPair[]
}

const normalize = (value?: string) => (value || '').trim().toUpperCase()

const unique = (values: string[]) => Array.from(new Set(values))
const sortCurrencies = (values: string[], fallback: string) =>
  unique(values.filter(Boolean).map(normalize)).sort((a, b) => {
    if (a === fallback) return -1
    if (b === fallback) return 1
    return a.localeCompare(b)
  })

const setCurrencyValue = (target: Ref<string> | undefined, value: string) => {
  if (!target || isReadonly(target)) return
  target.value = value
}

export const useCorridorCurrencies = (
  fromCountry: Ref<string>,
  toCountry: Ref<string>,
  fromCurrency?: Ref<string>,
  toCurrency?: Ref<string>,
) => {
  const { request } = useApi()
  const pairs = ref<CorridorCurrencyPair[]>([])
  const fromCurrencies = ref<string[]>([])
  const toCurrencies = ref<string[]>([])
  const pending = ref(false)

  const fromFallback = computed(() => {
    const country = getCountryByCode(normalize(fromCountry.value))
    return country?.currency ? country.currency.toUpperCase() : ''
  })
  const fromCountryCurrencies = computed(() => getCountryCurrencies(normalize(fromCountry.value)))

  const toFallback = computed(() => {
    const country = getCountryByCode(normalize(toCountry.value))
    return country?.currency ? country.currency.toUpperCase() : ''
  })
  const toCountryCurrencies = computed(() => getCountryCurrencies(normalize(toCountry.value)))

  const resetWithFallback = () => {
    pairs.value = []
    fromCurrencies.value = fromCountryCurrencies.value
    toCurrencies.value = toCountryCurrencies.value
  }

  const load = async () => {
    const from = normalize(fromCountry.value)
    const to = normalize(toCountry.value)

    if (!from || !to || from.length !== 2 || to.length !== 2) {
      resetWithFallback()
      return
    }

    if (import.meta.server) {
      resetWithFallback()
      return
    }

    pending.value = true
    try {
      const data = await request<CorridorCurrencyResponse>('/corridor-currencies', {
        query: { from, to },
        timeoutMs: 5000,
        retries: 0,
      })
      pairs.value = Array.isArray(data.pairs) ? data.pairs : []
      fromCurrencies.value = Array.isArray(data.fromCurrencies) ? data.fromCurrencies.map(normalize) : []
      toCurrencies.value = Array.isArray(data.toCurrencies) ? data.toCurrencies.map(normalize) : []
    }
    catch {
      resetWithFallback()
    }
    finally {
      pending.value = false
    }
  }

  watch([fromCountry, toCountry], () => {
    void load()
  }, { immediate: true })

  const availableFromCurrencies = computed(() => {
    const result: string[] = []

    // Collect currencies from pairs (filtered by to currency if selected)
    if (pairs.value.length) {
      const targetTo = normalize(toCurrency?.value)
      const filtered = targetTo
        ? pairs.value.filter(pair => pair.toCurrency === targetTo)
        : pairs.value
      const list = unique(filtered.map(pair => pair.fromCurrency))
      if (list.length) {
        result.push(...list)
      }
    }

    // Add currencies from API response
    if (fromCurrencies.value.length) {
      result.push(...fromCurrencies.value)
    }

    result.push(...fromCountryCurrencies.value)

    const sorted = sortCurrencies(result, fromFallback.value)
    return sorted.length ? sorted : (fromFallback.value ? [fromFallback.value] : [])
  })

  const availableToCurrencies = computed(() => {
    const result: string[] = []

    // Collect currencies from pairs (filtered by from currency if selected)
    if (pairs.value.length) {
      const targetFrom = normalize(fromCurrency?.value)
      const filtered = targetFrom
        ? pairs.value.filter(pair => pair.fromCurrency === targetFrom)
        : pairs.value
      const list = unique(filtered.map(pair => pair.toCurrency))
      if (list.length) {
        result.push(...list)
      }
    }

    // Add currencies from API response
    if (toCurrencies.value.length) {
      result.push(...toCurrencies.value)
    }

    result.push(...toCountryCurrencies.value)

    const sorted = sortCurrencies(result, toFallback.value)
    return sorted.length ? sorted : (toFallback.value ? [toFallback.value] : [])
  })

  if (fromCurrency) {
    watch(availableFromCurrencies, (list) => {
      if (!list.length) return
      const current = normalize(fromCurrency.value)
      if (!current || !list.includes(current)) {
        setCurrencyValue(fromCurrency, list[0])
      }
    }, { immediate: true })
  }

  if (toCurrency) {
    watch(availableToCurrencies, (list) => {
      if (!list.length) return
      const current = normalize(toCurrency.value)
      if (!current || !list.includes(current)) {
        setCurrencyValue(toCurrency, list[0])
      }
    }, { immediate: true })
  }

  return {
    availableFromCurrencies,
    availableToCurrencies,
    pairs,
    pending,
    refresh: load,
  }
}
