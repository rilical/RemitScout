import { useSession } from '~/composables/useSession'
import { useApi } from '~/composables/useApi'
import { usePrivacySettings } from '~/composables/usePrivacySettings'
import type { AdPlacement, AdCreative } from '~/lib/ads'

export type AdApiResponse = {
  ad: (AdCreative & { placement?: string, layout?: string }) | null
}

export const useAds = () => {
  const { request } = useApi()
  const { ensureSession } = useSession()
  const { marketingConsent } = usePrivacySettings()

  const fetchAdForPlacement = async (placement: AdPlacement, options?: {
    corridorId?: string
    pagePath?: string
  }): Promise<AdApiResponse> => {
    const query: Record<string, any> = {
      placement,
      corridor_id: options?.corridorId,
      page_path: options?.pagePath,
    }
    if (marketingConsent.value) {
      const { session_id, anon_id } = ensureSession()
      query.session_id = session_id
      query.anon_id = anon_id
    }
    return request<AdApiResponse>('/ads/placement', {
      method: 'GET',
      query,
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
    const body: Record<string, any> = {
      ad_id: input.adId,
      placement: input.placement,
      corridor_id: input.corridorId,
      page_path: input.pagePath,
      target_url: input.targetUrl,
      is_affiliate: input.isAffiliate ?? false,
    }
    if (marketingConsent.value) {
      const { session_id, anon_id } = ensureSession()
      body.session_id = session_id
      body.anon_id = anon_id
    }
    await request('/ads/click', {
      method: 'POST',
      body,
      retries: 0,
    })
  }

  return {
    fetchAdForPlacement,
    trackAdClick,
  }
}
