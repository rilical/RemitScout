import { useApi } from '~/composables/useApi'

export const useOffers = (params: Record<string, unknown> = {}, options: Record<string, any> = {}) => {
  const { request } = useApi()
  const key = options.key || `offers-${JSON.stringify(params)}`

  return useAsyncData(
    key,
    () => request('/offers', { query: params }),
    { watch: [], ...options },
  )
}
