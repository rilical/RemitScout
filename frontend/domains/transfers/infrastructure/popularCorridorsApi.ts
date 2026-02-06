import { useApi } from '~/composables/useApi'

export type PopularCorridorsResponse = {
  data: Array<{
    route?: string
    top_provider?: string
    count_24h?: number
    fee_range?: string | null
    speed_range?: string | null
  }>
  updatedAt: string
}

export async function fetchPopularCorridors() {
  const { request } = useApi()
  return request<PopularCorridorsResponse>('/popular-corridors')
}
