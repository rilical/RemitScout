import { COUNTRIES, getCountryByCode } from '~/utils/countries-currencies'
import { useApi } from '~/composables/useApi'

export const useCountries = () => {
  const countries = ref(COUNTRIES)

  const getCountry = (code: string) => {
    return getCountryByCode(code)
  }

  const list = computed(() => {
    return COUNTRIES.map(country => ({
      value: country.code,
      label: `${country.flag} ${country.name} (${country.currency})`,
    }))
  })

  const commonCorridors = () => {
    return [
      { from: 'US', to: 'IN' },
      { from: 'US', to: 'MX' },
      { from: 'US', to: 'PH' },
      { from: 'GB', to: 'IN' },
      { from: 'CA', to: 'IN' },
      { from: 'AU', to: 'IN' },
      { from: 'US', to: 'NG' },
      { from: 'GB', to: 'NG' },
    ]
  }

  return {
    countries,
    getCountry,
    list,
    commonCorridors,
  }
}

export const useCountry = (code: string) => {
  const { request } = useApi()
  return useAsyncData<{
    name?: string
    code?: string
    currency?: string
    providers?: number
    avgTransferTime?: string
    bankingHours?: string
    weekendProcessing?: string
  }>(
    `country-${code}`,
    () => request(`/countries/${code}`),
  )
}
