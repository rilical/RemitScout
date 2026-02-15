import { useApi } from '~/composables/useApi'
import type { paths } from '~/shared/lib/api/types'

export type SpotRateResponse = paths['/rates/spot']['get']['responses']['200'] extends { content: { 'application/json': infer R } }
  ? R
  : {
      rate: number
      updatedAt?: string
    }

export type ProviderRatesResponse = paths['/rates/providers']['get']['responses']['200'] extends { content: { 'application/json': infer R } }
  ? R
  : {
      data: Array<{
        name: string
        rate: number
        markupBps?: number
        speed?: string
      }>
    }

export async function fetchSpotRate(base: string, quote: string) {
  const { request } = useApi()
  return request<SpotRateResponse>('/rates/spot', { query: { base, quote } })
}

export async function fetchProviderRates(base: string, quote: string) {
  const { request } = useApi()
  return request<ProviderRatesResponse>('/rates/providers', { query: { base, quote } })
}
