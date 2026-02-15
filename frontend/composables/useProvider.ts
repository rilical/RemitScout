import type { ProviderMetadata } from '~/types/provider'
import type { paths } from '~/shared/lib/api/types'
import { useApi } from '~/composables/useApi'

type ProviderMetadataResponse = paths['/providers/metadata/{id}']['get']['responses']['200'] extends { content: { 'application/json': infer R } }
  ? R
  : { data: ProviderMetadata }

export const useProvider = (idOrSlug: string, options: Record<string, any> = {}) => {
  const { request } = useApi()
  const key = options.key || `provider-${idOrSlug}`

  return useAsyncData(
    key,
    async () => {
      const response = await request<ProviderMetadataResponse>(
        `/providers/metadata/${encodeURIComponent(idOrSlug)}`,
      )
      return response.data
    },
    { watch: [], ...options },
  )
}
