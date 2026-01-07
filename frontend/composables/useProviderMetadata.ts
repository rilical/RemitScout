import type { ProviderMetadata } from '~/types/provider'
import { useApi } from '~/composables/useApi'

type ProviderMetadataResponse = {
  data: ProviderMetadata[]
}

export const useProviderMetadata = (options: Record<string, any> = {}) => {
  const { request } = useApi()
  const key = options.key || 'provider-metadata'

  return useAsyncData(
    key,
    async () => {
      const response = await request<ProviderMetadataResponse>('/providers/metadata')
      return response.data
    },
    { watch: false, ...options },
  )
}
