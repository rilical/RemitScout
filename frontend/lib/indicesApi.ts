import { useApi } from '~/composables/useApi'
import type { IndexSeriesResponse } from '~/types/indices'

type IndexSeriesParams = {
  corridor_id: string
  amount_bucket?: number
  method_profile?: string
  days?: number
  api_key?: string
}

export async function getIndexSeries(params: IndexSeriesParams): Promise<IndexSeriesResponse> {
  const { request } = useApi()
  const { api_key, ...query } = params
  const headers = api_key ? { 'x-api-key': api_key } : undefined
  return await request<IndexSeriesResponse>('/indices/series', { query, headers })
}
