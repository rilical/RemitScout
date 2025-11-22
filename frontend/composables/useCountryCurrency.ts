import { ref, computed, watch } from 'vue'
import { 
  COUNTRIES, 
  getCountryByCode, 
  getAvailableCurrencies,
  getCurrencyDisplay,
  getCountryDisplay
} from '~/utils/countries-currencies'

export function useCountryCurrency() {
  const fromCountry = ref('')
  const toCountry = ref('')
  const fromCurrency = ref('')
  const toCurrency = ref('')

  const fromCountryData = computed(() => 
    fromCountry.value ? getCountryByCode(fromCountry.value) : null
  )

  const toCountryData = computed(() => 
    toCountry.value ? getCountryByCode(toCountry.value) : null
  )

  const availableFromCurrencies = computed(() => 
    fromCountry.value ? getAvailableCurrencies(fromCountry.value) : ['USD', 'GBP', 'EUR']
  )

  const availableToCurrencies = computed(() => 
    toCountry.value ? getAvailableCurrencies(toCountry.value) : []
  )

  watch(fromCountry, (newCountry) => {
    if (!newCountry) {
      fromCurrency.value = ''
      return
    }

    const country = getCountryByCode(newCountry)
    if (!country) return

    if (!fromCurrency.value || !availableFromCurrencies.value.includes(fromCurrency.value)) {
      fromCurrency.value = country.currency
    }
  })

  watch(toCountry, (newCountry) => {
    if (!newCountry) {
      toCurrency.value = ''
      return
    }

    const country = getCountryByCode(newCountry)
    if (!country) return

    if (!toCurrency.value || !availableToCurrencies.value.includes(toCurrency.value)) {
      toCurrency.value = country.currency
    }
  })

  function setFromCountry(code: string) {
    fromCountry.value = code
  }

  function setToCountry(code: string) {
    toCountry.value = code
  }

  function setFromCurrency(code: string) {
    fromCurrency.value = code
  }

  function setToCurrency(code: string) {
    toCurrency.value = code
  }

  function reset() {
    fromCountry.value = ''
    toCountry.value = ''
    fromCurrency.value = ''
    toCurrency.value = ''
  }

  function initialize(from: string, to: string, fromCurr?: string, toCurr?: string) {
    fromCountry.value = from
    toCountry.value = to
    
    if (fromCurr) {
      fromCurrency.value = fromCurr
    }
    
    if (toCurr) {
      toCurrency.value = toCurr
    }
  }

  return {
    fromCountry,
    toCountry,
    fromCurrency,
    toCurrency,
    fromCountryData,
    toCountryData,
    availableFromCurrencies,
    availableToCurrencies,
    setFromCountry,
    setToCountry,
    setFromCurrency,
    setToCurrency,
    reset,
    initialize,
  }
}

