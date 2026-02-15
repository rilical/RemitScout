import type { ProviderMetadata } from '~/types/provider'
import type { paths } from '~/shared/lib/api/types'
import { useApi } from '~/composables/useApi'

type ProviderMetadataResponse = paths['/providers/metadata']['get']['responses']['200'] extends { content: { 'application/json': infer R } }
  ? R
  : { data: ProviderMetadata[] }

export const useProviderMetadata = (options: Record<string, any> = {}) => {
  const { request } = useApi()
  const key = options.key || 'provider-metadata'

  return useAsyncData(
    key,
    async () => {
      const response = await request<ProviderMetadataResponse>('/providers/metadata')
      return response.data
    },
    { watch: [], ...options },
  )
}
