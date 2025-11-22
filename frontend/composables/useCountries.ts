import { COUNTRIES, getCountryByCode } from '~/utils/countries-currencies'

export const useCountries = () => {
  const countries = ref(COUNTRIES)

  const getCountry = (code: string) => {
    return getCountryByCode(code)
  }

  const list = computed(() => {
    return COUNTRIES.map(country => ({
      value: country.code,
      label: `${country.flag} ${country.name} (${country.currency})`
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
  return useLazyAsyncData(`country-${code}`, async () => {
    // Mock country data
    return {
      code,
      name: code === 'US' ? 'United States' : code === 'UK' ? 'United Kingdom' : 'Country',
      currency: 'USD',
      providers: 15,
      avgTransferTime: '1-2 business days',
      bankingHours: '9:00 AM - 5:00 PM',
      weekendProcessing: 'Limited',
    };
  });
};
