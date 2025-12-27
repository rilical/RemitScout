import { useApi } from '~/composables/useApi'

export const useProviders = (
  from?: string,
  to?: string,
  amount?: number,
  method?: string,
  options: Record<string, any> = {},
) => {
  const { request } = useApi()
  const query: Record<string, unknown> = {}

  if (from) query.from = from
  if (to) query.to = to
  if (typeof amount === 'number') query.amount = amount
  if (method) query.method = method

  const key = options.key || `providers-${from || 'all'}-${to || 'all'}-${amount || 'any'}-${method || 'any'}`

  return useAsyncData(
    key,
    () => request('/providers', { query }),
    { watch: false, ...options },
  )
}
