import { useSession } from '~/composables/useSession'
import { useApi } from '~/composables/useApi'

type SearchPayload = {
  corridor_id: string
  amount?: number
  amount_bucket?: number
  payin?: string
  payout?: string
  page_path?: string
  utm?: Record<string, string>
}

type ClickPayload = {
  provider_id: string
  corridor_id?: string
  target_url: string
  page_path?: string
  utm?: Record<string, string>
  quoted_rate?: number
  quoted_fee?: number
  is_affiliate?: boolean
}

const getUtmParams = (query: Record<string, unknown>) => {
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  const utm: Record<string, string> = {}
  for (const key of utmKeys) {
    const value = query[key]
    if (typeof value === 'string' && value.trim()) {
      utm[key] = value
    }
  }
  return Object.keys(utm).length > 0 ? utm : undefined
}

export const useTelemetry = () => {
  const { request } = useApi()
  const { ensureSession, trackSession } = useSession()
  const route = useRoute()

  const buildBasePayload = () => {
    const ids = ensureSession()
    const utm = getUtmParams(route.query as Record<string, unknown>)
    const pagePath = route.fullPath

    return {
      ...ids,
      utm,
      page_path: pagePath,
    }
  }

  const initSession = async () => {
    if (import.meta.server) return
    const ids = ensureSession()
    const payload = {
      ...ids,
      referrer: document.referrer || undefined,
      first_page: route.fullPath,
    }

    try {
      await request('/telemetry/session', {
        method: 'POST',
        body: payload,
        retries: 0,
      })
      await trackSession()
    } catch {
      // ignore telemetry init errors
    }
  }

  const trackSearch = async (payload: SearchPayload) => {
    const base = buildBasePayload()
    try {
      await request('/telemetry/search', {
        method: 'POST',
        body: {
          ...base,
          ...payload,
        },
        retries: 0,
      })
    } catch {
      // ignore telemetry errors
    }
  }

  const trackClick = async (payload: ClickPayload) => {
    const base = buildBasePayload()
    try {
      await request('/telemetry/click', {
        method: 'POST',
        body: {
          ...base,
          ...payload,
        },
        retries: 0,
      })
    } catch {
      // ignore telemetry errors
    }
  }

  return {
    initSession,
    trackSearch,
    trackClick,
  }
}
