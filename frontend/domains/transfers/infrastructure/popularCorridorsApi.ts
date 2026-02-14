import { useApi } from '~/composables/useApi'
import type { paths } from '~/shared/lib/api/types'

export type PopularCorridorsResponse = paths['/popular-corridors']['get']['responses']['200'] extends { content: { 'application/json': infer R } }
  ? R
  : {
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
