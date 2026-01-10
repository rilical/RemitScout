import { useApi } from '~/composables/useApi'

export const useProviders = (
  from?: string,
  to?: string,
  amount?: number,
  method?: string,
  options: Record<string, any> = {},
) => {
  const { request } = useApi()
  const { live, ...restOptions } = options
  const query: Record<string, unknown> = {}

  if (from) query.from = from
  if (to) query.to = to
  if (typeof amount === 'number') query.amount = amount
  if (method) query.method = method
  if (live === true) query.live = true

  const key = options.key || `providers-${from || 'all'}-${to || 'all'}-${amount || 'any'}-${method || 'any'}-${live === true ? 'live' : 'cached'}`

  return useAsyncData(
    key,
    () => request('/providers', { query }),
    { watch: false, ...restOptions },
  )
}
