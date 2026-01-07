import type { ProviderMetadata } from '~/types/provider'
import { useApi } from '~/composables/useApi'

type ProviderMetadataResponse = {
  data: ProviderMetadata
}

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
    { watch: false, ...options },
  )
}
