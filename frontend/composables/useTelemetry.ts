import { watch } from 'vue'
import { useSession } from '~/composables/useSession'
import { useApi } from '~/composables/useApi'
import { usePrivacySettings } from '~/composables/usePrivacySettings'
import { useMarketingAnalytics } from '~/composables/useMarketingAnalytics'

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

type ConversionPayload = {
  provider_id: string
  corridor_id?: string
  conversion_value?: number
  conversion_currency?: string
  offer_id?: string
  source?: string
  page_path?: string
  utm?: Record<string, string>
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

type Attribution = {
  utm?: Record<string, string>
  gclid?: string
  fbclid?: string
  msclkid?: string
  ttclid?: string
  li_fat_id?: string
}

const attributionStorageKey = 'rs:attribution'

const readAttribution = (): Attribution => {
  if (!import.meta.client) return {}
  try {
    const raw = window.localStorage.getItem(attributionStorageKey)
    if (!raw) return {}
    return JSON.parse(raw) as Attribution
  }
  catch {
    return {}
  }
}

const persistAttribution = (next: Attribution) => {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(attributionStorageKey, JSON.stringify(next))
  }
  catch {
    // ignore storage failures
  }
}

export const useTelemetry = () => {
  const { request } = useApi()
  const { ensureSession, trackSession } = useSession()
  const { analyticsConsent, marketingConsent } = usePrivacySettings()
  const marketing = useMarketingAnalytics()
  const route = useRoute()
  const sessionInitialized = useState<boolean>('telemetry:session:initialized', () => false)

  const getAttribution = (): Attribution => {
    if (!import.meta.client) return {}
    if (!marketingConsent.value) return {}
    const stored = readAttribution()
    const query = route.query as Record<string, unknown>
    const next: Attribution = {
      ...stored,
      utm: getUtmParams(query) || stored.utm,
      gclid: typeof query.gclid === 'string' ? query.gclid : stored.gclid,
      fbclid: typeof query.fbclid === 'string' ? query.fbclid : stored.fbclid,
      msclkid: typeof query.msclkid === 'string' ? query.msclkid : stored.msclkid,
      ttclid: typeof query.ttclid === 'string' ? query.ttclid : stored.ttclid,
      li_fat_id: typeof query.li_fat_id === 'string' ? query.li_fat_id : stored.li_fat_id,
    }
    persistAttribution(next)
    return next
  }

  const buildBasePayload = () => {
    const pagePath = route.fullPath
    const ids = ensureSession()
    const attribution = marketingConsent.value ? getAttribution() : {}

    return marketingConsent.value
      ? {
          ...ids,
          utm: attribution.utm,
          gclid: attribution.gclid,
          fbclid: attribution.fbclid,
          msclkid: attribution.msclkid,
          ttclid: attribution.ttclid,
          li_fat_id: attribution.li_fat_id,
          page_path: pagePath,
        }
      : {
          ...ids,
          page_path: pagePath,
        }
  }

  const initSession = async () => {
    if (import.meta.server) return
    if (!analyticsConsent.value) return
    if (sessionInitialized.value) return
    const ids = ensureSession()
    const payload = {
      ...ids,
      referrer: document.referrer || undefined,
      first_page: route.fullPath,
      ...(marketingConsent.value ? getAttribution() : {}),
    }

    try {
      await request('/telemetry/session', {
        method: 'POST',
        body: payload,
        retries: 0,
      })
      await trackSession()
      sessionInitialized.value = true
    }
    catch {
      // ignore telemetry init errors
    }
  }

  const trackSearch = async (payload: SearchPayload) => {
    void marketing.trackSearch({
      corridorId: payload.corridor_id,
      amount: payload.amount,
      amountBucket: payload.amount_bucket,
      payin: payload.payin,
      payout: payload.payout,
      pagePath: route.fullPath,
    })

    if (!analyticsConsent.value) return
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
    }
    catch {
      // ignore telemetry errors
    }
  }

  const trackClick = async (payload: ClickPayload) => {
    void marketing.trackProviderClick({
      providerId: payload.provider_id,
      corridorId: payload.corridor_id,
      targetUrl: payload.target_url,
      quotedRate: payload.quoted_rate,
      quotedFee: payload.quoted_fee,
      pagePath: route.fullPath,
    })

    if (!analyticsConsent.value) return
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
    }
    catch {
      // ignore telemetry errors
    }
  }

  const trackConversion = async (payload: ConversionPayload) => {
    void marketing.trackAffiliateConversion({
      providerId: payload.provider_id,
      corridorId: payload.corridor_id,
      value: payload.conversion_value,
      currency: payload.conversion_currency,
      pagePath: route.fullPath,
      source: payload.source,
    })

    if (!analyticsConsent.value) return
    const base = buildBasePayload()
    try {
      await request('/telemetry/conversion', {
        method: 'POST',
        body: {
          ...base,
          ...payload,
        },
        retries: 0,
      })
    }
    catch {
      // ignore telemetry errors
    }
  }

  watch(
    () => analyticsConsent.value,
    (enabled) => {
      if (enabled) {
        void initSession()
      }
    },
    { immediate: true },
  )

  return {
    initSession,
    trackSearch,
    trackClick,
    trackConversion,
  }
}
