import { useSession } from '~/composables/useSession'
import { useApi } from '~/composables/useApi'
import type { AdPlacement, AdCreative } from '~/lib/ads'

export type AdApiResponse = {
  ad: (AdCreative & { placement?: string, layout?: string }) | null
}

export const useAds = () => {
  const { request } = useApi()
  const { ensureSession } = useSession()

  const fetchAdForPlacement = async (placement: AdPlacement, options?: {
    corridorId?: string
    pagePath?: string
  }): Promise<AdApiResponse> => {
    const { session_id, anon_id } = ensureSession()
    return request<AdApiResponse>('/ads/placement', {
      method: 'GET',
      query: {
        placement,
        session_id,
        anon_id,
        corridor_id: options?.corridorId,
        page_path: options?.pagePath,
      },
      retries: 0,
    })
  }

  const trackAdClick = async (input: {
    adId: string
    placement: AdPlacement
    corridorId?: string
    pagePath?: string
    targetUrl?: string
    isAffiliate?: boolean
  }) => {
    const { session_id, anon_id } = ensureSession()
    await request('/ads/click', {
      method: 'POST',
      body: {
        ad_id: input.adId,
        placement: input.placement,
        session_id,
        anon_id,
        corridor_id: input.corridorId,
        page_path: input.pagePath,
        target_url: input.targetUrl,
        is_affiliate: input.isAffiliate ?? false,
      },
      retries: 0,
    })
  }

  return {
    fetchAdForPlacement,
    trackAdClick,
  }
}
