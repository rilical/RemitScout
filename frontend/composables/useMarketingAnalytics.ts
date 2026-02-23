import { useApi } from '~/composables/useApi'
import { usePrivacySettings } from '~/composables/usePrivacySettings'

type Attribution = {
  fbclid?: string
  gclid?: string
  msclkid?: string
  ttclid?: string
  li_fat_id?: string
  utm?: Record<string, string>
  lastSeenAt?: string
}

type MarketingEventInput = {
  eventId?: string
  eventSourceUrl?: string
  value?: number
  currency?: string
  providerId?: string
  corridorId?: string
  source?: string
  pagePath?: string
  customData?: Record<string, unknown>
}

type MarketingEventNames = {
  ga4: string
  meta: string
}

type WindowFunction = (...args: unknown[]) => void

const getWindowFunction = (key: 'gtag' | 'fbq'): WindowFunction | undefined => {
  if (typeof window === 'undefined') return undefined
  const candidate = (window as unknown as Record<string, unknown>)[key]
  return typeof candidate === 'function' ? candidate as WindowFunction : undefined
}

type SearchEventInput = {
  corridorId: string
  amount?: number
  amountBucket?: number
  payin?: string
  payout?: string
  pagePath?: string
}

type ProviderClickInput = {
  providerId: string
  corridorId?: string
  targetUrl: string
  quotedRate?: number
  quotedFee?: number
  pagePath?: string
}

type SendMoneyViewInput = {
  corridorId?: string
  pagePath?: string
}

type ConversionInput = {
  providerId: string
  corridorId?: string
  value?: number
  currency?: string
  pagePath?: string
  source?: string
}

type CheckoutStartInput = {
  value?: number
  currency?: string
  pagePath?: string
  plan?: string
}

const storageKey = 'rs:attribution'

const readStored = (): Attribution => {
  if (!import.meta.client) return {}
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return {}
    return JSON.parse(raw) as Attribution
  }
  catch {
    return {}
  }
}

const persistStored = (next: Attribution) => {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(next))
  }
  catch {
    // ignore storage failures
  }
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

const readCookie = (name: string) => {
  if (!import.meta.client) return undefined
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[$()*+./?[\\\]^{|}-]/g, '\\$&')}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

const buildFbc = (fbclid?: string) => {
  if (!fbclid) return undefined
  const ts = Math.floor(Date.now() / 1000)
  return `fb.1.${ts}.${fbclid}`
}

const parseCorridorCurrencies = (corridorId?: string) => {
  if (!corridorId) return {}
  const parts = corridorId.split('-')
  if (parts.length !== 4) return {}
  return {
    source_currency: parts[2],
    dest_currency: parts[3],
  }
}

const metaStandardEvents = new Set([
  'PageView',
  'ViewContent',
  'Search',
  'Lead',
  'CompleteRegistration',
  'Purchase',
  'InitiateCheckout',
  'AddPaymentInfo',
  'AddToCart',
  'AddToWishlist',
  'Contact',
  'StartTrial',
  'Subscribe',
])

export const useMarketingAnalytics = () => {
  const { request } = useApi()
  const { analyticsConsent, marketingConsent } = usePrivacySettings()
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()
  const ga4Id = runtimeConfig.public.ga4MeasurementId
  const metaPixelId = runtimeConfig.public.metaPixelId
  const tiktokPixelId = runtimeConfig.public.tiktokPixelId

  const updateAttribution = () => {
    if (!import.meta.client) return {}
    if (!marketingConsent.value) return {}

    const stored = readStored()
    const query = route.query as Record<string, unknown>
    const next: Attribution = {
      ...stored,
      fbclid: typeof query.fbclid === 'string' ? query.fbclid : stored.fbclid,
      gclid: typeof query.gclid === 'string' ? query.gclid : stored.gclid,
      msclkid: typeof query.msclkid === 'string' ? query.msclkid : stored.msclkid,
      ttclid: typeof query.ttclid === 'string' ? query.ttclid : stored.ttclid,
      li_fat_id: typeof query.li_fat_id === 'string' ? query.li_fat_id : stored.li_fat_id,
      utm: getUtmParams(query) || stored.utm,
      lastSeenAt: new Date().toISOString(),
    }
    persistStored(next)
    return next
  }

  const ensureAttribution = () => updateAttribution()

  const shouldSkipAll = () => !analyticsConsent.value && !marketingConsent.value

  const generateEventId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `rs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  }

  const sendGa4Event = (eventName: string, params?: Record<string, unknown>) => {
    if (!import.meta.client || !ga4Id || typeof window === 'undefined') return
    if (!analyticsConsent.value) return
    const gtag = getWindowFunction('gtag')
    if (!gtag) return
    gtag('event', eventName, params || {})
  }

  const sendMetaPixelEvent = (eventName: string, params: Record<string, unknown>, eventId: string) => {
    if (!import.meta.client || !metaPixelId || typeof window === 'undefined') return
    if (!marketingConsent.value) return
    const fbq = getWindowFunction('fbq')
    if (!fbq) return
    const trackType = metaStandardEvents.has(eventName) ? 'track' : 'trackCustom'
    fbq(trackType, eventName, params, { eventID: eventId })
  }

  const sendMetaCapiEvent = async (
    input: MarketingEventInput & { eventName: string },
    attribution: Attribution,
    eventId: string,
  ) => {
    if (!marketingConsent.value) return
    if (!metaPixelId) return
    try {
      await request('/marketing/meta', {
        method: 'POST',
        body: {
          event_name: input.eventName,
          event_id: eventId,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: input.eventSourceUrl || (import.meta.client ? window.location.href : undefined),
          value: input.value,
          currency: input.currency,
          provider_id: input.providerId,
          corridor_id: input.corridorId,
          source: input.source,
          page_path: input.pagePath,
          utm: attribution.utm,
          gclid: attribution.gclid,
          fbclid: attribution.fbclid,
          msclkid: attribution.msclkid,
          ttclid: attribution.ttclid,
          li_fat_id: attribution.li_fat_id,
          fbc: readCookie('_fbc') || buildFbc(attribution.fbclid),
          fbp: readCookie('_fbp'),
          custom_data: input.customData,
        },
        retries: 0,
      })
    }
    catch {
      // ignore marketing errors
    }
  }

  const sendTikTokEventsApiEvent = async (
    input: MarketingEventInput & { eventName: string },
    attribution: Attribution,
    eventId: string,
  ) => {
    if (!marketingConsent.value) return
    if (!tiktokPixelId) return
    try {
      await request('/marketing/tiktok', {
        method: 'POST',
        body: {
          event_name: input.eventName,
          event_id: eventId,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: input.eventSourceUrl || (import.meta.client ? window.location.href : undefined),
          value: input.value,
          currency: input.currency,
          provider_id: input.providerId,
          corridor_id: input.corridorId,
          source: input.source,
          page_path: input.pagePath,
          utm: attribution.utm,
          gclid: attribution.gclid,
          fbclid: attribution.fbclid,
          msclkid: attribution.msclkid,
          ttclid: attribution.ttclid,
          li_fat_id: attribution.li_fat_id,
          ttp: readCookie('_ttp'),
          custom_data: input.customData,
        },
        retries: 0,
      })
    }
    catch {
      // ignore marketing errors
    }
  }

  const trackEvent = async (
    names: MarketingEventNames,
    input: MarketingEventInput,
    ga4Params?: Record<string, unknown>,
    metaParams?: Record<string, unknown>,
  ) => {
    if (shouldSkipAll()) return
    const attribution = marketingConsent.value ? ensureAttribution() : {}
    const eventId = input.eventId || generateEventId()

    sendGa4Event(names.ga4, ga4Params)
    if (marketingConsent.value) {
      sendMetaPixelEvent(names.meta, metaParams || ga4Params || {}, eventId)
      await Promise.allSettled([
        sendMetaCapiEvent({ ...input, eventName: names.meta }, attribution, eventId),
        sendTikTokEventsApiEvent({ ...input, eventName: names.meta }, attribution, eventId),
      ])
    }
  }

  const trackSearch = async (input: SearchEventInput) => {
    const corridorMeta = parseCorridorCurrencies(input.corridorId)
    await trackEvent(
      { ga4: 'search', meta: 'Search' },
      {
        corridorId: input.corridorId,
        pagePath: input.pagePath,
        customData: {
          ...corridorMeta,
          amount: input.amount,
          amount_bucket: input.amountBucket,
          payin: input.payin,
          payout: input.payout,
        },
      },
      {
        corridor_id: input.corridorId,
        amount: input.amount,
        amount_bucket: input.amountBucket,
        payin: input.payin,
        payout: input.payout,
        search_term: input.corridorId,
        ...corridorMeta,
      },
      {
        search_string: input.corridorId,
        ...corridorMeta,
      },
    )
  }

  const trackProviderClick = async (input: ProviderClickInput) => {
    await trackEvent(
      { ga4: 'select_content', meta: 'ViewContent' },
      {
        providerId: input.providerId,
        corridorId: input.corridorId,
        pagePath: input.pagePath,
        customData: {
          target_url: input.targetUrl,
          quoted_rate: input.quotedRate,
          quoted_fee: input.quotedFee,
        },
      },
      {
        content_type: 'provider',
        item_id: input.providerId,
        corridor_id: input.corridorId,
        target_url: input.targetUrl,
        quoted_rate: input.quotedRate,
        quoted_fee: input.quotedFee,
      },
      {
        content_type: 'provider',
        content_ids: [input.providerId],
        content_name: input.providerId,
        corridor_id: input.corridorId,
      },
    )
  }

  const trackSendMoneyView = async (input: SendMoneyViewInput) => {
    await trackEvent(
      { ga4: 'view_send_money', meta: 'ViewContent' },
      {
        corridorId: input.corridorId,
        pagePath: input.pagePath,
        customData: {
          content_name: 'send_money',
          corridor_id: input.corridorId,
        },
      },
      {
        page_path: input.pagePath,
        corridor_id: input.corridorId,
      },
      {
        content_type: 'page',
        content_name: 'send_money',
        corridor_id: input.corridorId,
      },
    )
  }

  const trackAffiliateConversion = async (input: ConversionInput) => {
    await trackEvent(
      { ga4: 'generate_lead', meta: 'Lead' },
      {
        providerId: input.providerId,
        corridorId: input.corridorId,
        value: input.value,
        currency: input.currency,
        pagePath: input.pagePath,
        source: input.source,
      },
      {
        provider_id: input.providerId,
        corridor_id: input.corridorId,
        value: input.value,
        currency: input.currency,
      },
      {
        value: input.value,
        currency: input.currency,
      },
    )
  }

  const trackCheckoutStart = async (input: CheckoutStartInput) => {
    await trackEvent(
      { ga4: 'begin_checkout', meta: 'InitiateCheckout' },
      {
        value: input.value,
        currency: input.currency,
        pagePath: input.pagePath,
        customData: {
          plan: input.plan,
        },
      },
      {
        value: input.value,
        currency: input.currency,
        plan: input.plan,
        page_path: input.pagePath,
      },
      {
        value: input.value,
        currency: input.currency,
        content_name: input.plan,
      },
    )
  }

  const trackPlusPurchase = async (input: CheckoutStartInput) => {
    await trackEvent(
      { ga4: 'purchase', meta: 'Purchase' },
      {
        value: input.value,
        currency: input.currency,
        pagePath: input.pagePath,
        customData: {
          plan: input.plan,
        },
      },
      {
        value: input.value,
        currency: input.currency,
        plan: input.plan,
        page_path: input.pagePath,
      },
      {
        value: input.value,
        currency: input.currency,
        content_name: input.plan,
      },
    )
  }

  const trackPageView = async () => {
    if (!import.meta.client) return
    const gtag = getWindowFunction('gtag')
    if (analyticsConsent.value && ga4Id && gtag) {
      gtag('event', 'page_view', { page_path: route.fullPath })
    }
    if (marketingConsent.value && metaPixelId) {
      sendMetaPixelEvent('PageView', { page_path: route.fullPath }, generateEventId())
    }
  }

  const initMarketing = async () => {
    if (shouldSkipAll()) return
    if (marketingConsent.value) {
      ensureAttribution()
    }
    await trackPageView()
  }

  return {
    initMarketing,
    trackPageView,
    trackSearch,
    trackProviderClick,
    trackAffiliateConversion,
    trackSendMoneyView,
    trackCheckoutStart,
    trackPlusPurchase,
  }
}
