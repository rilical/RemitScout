<template>
  <div>
    <div
      v-if="rootError"
      class="min-h-screen bg-white flex items-center justify-center px-page-x"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="max-w-2xl w-full text-center">
        <h1 class="text-h2 font-bold text-neutral-900 mb-3">
          Something went wrong
        </h1>
        <p class="text-body text-neutral-600 mb-6">
          We hit an unexpected error. You can reload the page or go back to the homepage.
        </p>
        <p
          v-if="crashId"
          class="text-body-sm text-neutral-500 mb-8"
        >
          Error ID: <span class="font-mono">{{ crashId }}</span>
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-body font-semibold text-white shadow-lg transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            @click="hardReload"
          >
            Reload
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl border-2 border-brand-600 bg-surface px-6 py-3 text-body font-semibold text-brand-600 transition-all hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            @click="goHome"
          >
            Go home
          </button>
        </div>
      </div>
    </div>

    <template v-else>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <CookieConsentBanner />
      <CookiePreferencesModal />
      <UiToast />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onErrorCaptured, onMounted, ref, watch } from 'vue'
import { useTelemetry } from '~/composables/useTelemetry'
import { useMarketingAnalytics } from '~/composables/useMarketingAnalytics'
import { usePrivacySettings } from '~/composables/usePrivacySettings'
import { useVisitSession } from '~/composables/useVisitSession'
import { useEntitlements } from '~/composables/useEntitlements'
import { useSession } from '~/composables/useSession'
import CookieConsentBanner from '~/components/privacy/CookieConsentBanner.vue'
import CookiePreferencesModal from '~/components/privacy/CookiePreferencesModal.vue'

// Global app setup
useHead({
  htmlAttrs: {
    lang: 'en',
  },
})

const { initSession } = useTelemetry()
// Initialize the per-visit timestamp as early as possible (consent-neutral).
useVisitSession()
const { analyticsConsent, marketingConsent } = usePrivacySettings()
const { initMarketing, trackPageView } = useMarketingAnalytics()
const { isPlus, hydrated } = useEntitlements()
const { clearSession } = useSession()
const runtimeConfig = useRuntimeConfig()
const ga4Id = runtimeConfig.public.ga4MeasurementId
const gtmContainerId = runtimeConfig.public.gtmContainerId
const metaPixelId = runtimeConfig.public.metaPixelId
const googleAdsConversionId = runtimeConfig.public.googleAdsConversionId
const linkedinPartnerId = runtimeConfig.public.linkedinPartnerId
const tiktokPixelId = runtimeConfig.public.tiktokPixelId
const clarityProjectId = runtimeConfig.public.clarityProjectId
const route = useRoute()
const allowAnalytics = computed(() => runtimeConfig.public.analyticsEnabled === true && analyticsConsent.value)
const allowMarketing = computed(() => marketingConsent.value)
const allowEzoic = computed(() =>
  runtimeConfig.public?.adsEnabled === true
  && allowMarketing.value
  && hydrated.value
  && !isPlus.value,
)

const rootError = ref<unknown>(null)
const crashId = ref<string | null>(null)

const hardReload = () => {
  if (!import.meta.client) return
  window.location.reload()
}

const goHome = async () => {
  try {
    await navigateTo('/')
  }
 catch {
    hardReload()
  }
}

const makeCrashId = () => {
  if (!import.meta.client) return `srv_${Date.now().toString(36)}`
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
  }
 catch {
    // ignore
  }
  return `rs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

onErrorCaptured((err) => {
  rootError.value = err
  crashId.value = crashId.value || makeCrashId()

  // Best-effort error capture (guarded by consent + DSN in the Sentry plugin).
  try {
    void import('@sentry/vue')
      .then((Sentry) => {
        Sentry.setTag('crash_id', crashId.value || '')
        Sentry.setTag('route', route.fullPath || '')
        Sentry.captureException(err)
      })
      .catch(() => {
        // ignore
      })
  }
 catch {
    // ignore
  }

  // Stop propagation so Nuxt doesn't render a blank screen.
  return false
})

type DynamicWindow = Window & typeof globalThis & Record<string, any>

const ensureExternalScript = (id: string, src: string) => {
  if (!import.meta.client) return
  if (document.getElementById(id)) return
  const script = document.createElement('script')
  script.id = id
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

const ensureTrackingPixel = (id: string, src: string) => {
  if (!import.meta.client) return
  if (document.getElementById(id)) return
  const img = document.createElement('img')
  img.id = id
  img.src = src
  img.alt = ''
  img.width = 1
  img.height = 1
  img.style.display = 'none'
  ;(document.body || document.documentElement).appendChild(img)
}

let googleTagsReady = false
let gtmReady = false
let metaPixelReady = false
let clarityReady = false
let linkedInReady = false
let tikTokReady = false
let ezoicReady = false

const ensureGoogleTagManager = () => {
  if (!import.meta.client) return
  if (!allowAnalytics.value || !gtmContainerId || gtmReady) return

  const win = window as DynamicWindow
  win.dataLayer = Array.isArray(win.dataLayer) ? win.dataLayer : []
  win.dataLayer.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
  })

  ensureExternalScript(
    'rs-gtm-src',
    `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmContainerId)}`,
  )

  gtmReady = true
}

const ensureGoogleTags = () => {
  if (!import.meta.client) return
  if (!allowAnalytics.value) return
  const googleTagId = ga4Id || googleAdsConversionId
  if (!googleTagId || googleTagsReady) return

  const win = window as DynamicWindow
  win.dataLayer = Array.isArray(win.dataLayer) ? win.dataLayer : []
  if (typeof win.gtag !== 'function') {
    win.gtag = (...args: unknown[]) => {
      win.dataLayer.push(args)
    }
  }

  ensureExternalScript(
    'rs-ga4-src',
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`,
  )

  win.gtag('js', new Date())
  if (ga4Id) {
    win.gtag('config', ga4Id, { anonymize_ip: true, send_page_view: false })
  }
  if (googleAdsConversionId) {
    win.gtag('config', googleAdsConversionId)
  }

  googleTagsReady = true
}

const ensureMetaPixel = () => {
  if (!import.meta.client) return
  if (!allowMarketing.value || !metaPixelId || metaPixelReady) return

  const win = window as DynamicWindow
  if (typeof win.fbq !== 'function') {
    const fbq = (...args: unknown[]) => {
      const scoped = fbq as typeof fbq & {
        callMethod?: (...args: unknown[]) => void
        queue?: unknown[][]
        loaded?: boolean
        version?: string
      }
      if (typeof scoped.callMethod === 'function') {
        scoped.callMethod(...args)
        return
      }
      scoped.queue = scoped.queue || []
      scoped.queue.push(args)
    }
    const scoped = fbq as typeof fbq & {
      queue?: unknown[][]
      loaded?: boolean
      version?: string
    }
    scoped.queue = []
    scoped.loaded = true
    scoped.version = '2.0'
    win.fbq = fbq
    win._fbq = fbq
  }

  ensureExternalScript('rs-meta-pixel-src', 'https://connect.facebook.net/en_US/fbevents.js')
  win.fbq('init', metaPixelId)
  ensureTrackingPixel(
    'rs-meta-pixel-noscript',
    `https://www.facebook.com/tr?id=${encodeURIComponent(metaPixelId)}&ev=PageView&noscript=1`,
  )
  metaPixelReady = true
}

const ensureClarity = () => {
  if (!import.meta.client) return
  if (!allowAnalytics.value || !clarityProjectId || clarityReady) return

  const win = window as DynamicWindow
  if (typeof win.clarity !== 'function') {
    win.clarity = (...args: unknown[]) => {
      win.clarity.q = win.clarity.q || []
      win.clarity.q.push(args)
    }
  }
  ensureExternalScript(
    'rs-clarity-src',
    `https://www.clarity.ms/tag/${encodeURIComponent(clarityProjectId)}`,
  )
  clarityReady = true
}

const ensureLinkedInInsight = () => {
  if (!import.meta.client) return
  if (!allowMarketing.value || !linkedinPartnerId || linkedInReady) return

  const win = window as DynamicWindow
  win._linkedin_partner_id = linkedinPartnerId
  win._linkedin_data_partner_ids = Array.isArray(win._linkedin_data_partner_ids)
    ? win._linkedin_data_partner_ids
    : []
  if (!win._linkedin_data_partner_ids.includes(linkedinPartnerId)) {
    win._linkedin_data_partner_ids.push(linkedinPartnerId)
  }

  if (typeof win.lintrk !== 'function') {
    win.lintrk = (action: unknown, data: unknown) => {
      win.lintrk.q = win.lintrk.q || []
      win.lintrk.q.push([action, data])
    }
    win.lintrk.q = []
  }

  ensureExternalScript('rs-linkedin-insight-src', 'https://snap.licdn.com/li.lms-analytics/insight.min.js')
  ensureTrackingPixel(
    'rs-linkedin-insight-noscript',
    `https://px.ads.linkedin.com/collect/?pid=${encodeURIComponent(linkedinPartnerId)}&fmt=gif`,
  )
  linkedInReady = true
}

const ensureTikTokPixel = () => {
  if (!import.meta.client) return
  if (!allowMarketing.value || !tiktokPixelId || tikTokReady) return

  const win = window as DynamicWindow
  win.TiktokAnalyticsObject = 'ttq'
  const ttq = (win.ttq = win.ttq || [])
  ttq.methods = ttq.methods || [
    'page',
    'track',
    'identify',
    'instances',
    'debug',
    'on',
    'off',
    'once',
    'ready',
    'alias',
    'group',
    'enableCookie',
    'disableCookie',
  ]
  ttq.setAndDefer = ttq.setAndDefer || ((target: Record<string, any>, method: string) => {
    target[method] = (...args: unknown[]) => {
      target.push([method, ...args])
    }
  })
  for (const method of ttq.methods) {
    if (typeof ttq[method] !== 'function') {
      ttq.setAndDefer(ttq, method)
    }
  }
  ttq.instance = ttq.instance || ((instanceId: string) => {
    const instance = ttq._i?.[instanceId] || []
    for (const method of ttq.methods) {
      if (typeof instance[method] !== 'function') {
        ttq.setAndDefer(instance, method)
      }
    }
    return instance
  })
  ttq.load = ttq.load || ((pixelId: string, options?: Record<string, unknown>) => {
    const src = 'https://analytics.tiktok.com/i18n/pixel/events.js'
    ttq._i = ttq._i || {}
    ttq._i[pixelId] = ttq._i[pixelId] || []
    ttq._i[pixelId]._u = src
    ttq._t = ttq._t || {}
    ttq._t[pixelId] = Date.now()
    ttq._o = ttq._o || {}
    ttq._o[pixelId] = options || {}
    ensureExternalScript(
      'rs-tiktok-pixel-src',
      `${src}?sdkid=${encodeURIComponent(pixelId)}&lib=ttq`,
    )
  })

  ttq.load(tiktokPixelId)
  ttq.page()
  tikTokReady = true
}

const ensureEzoic = () => {
  if (!import.meta.client) return
  if (!allowEzoic.value || ezoicReady) return
  const win = window as DynamicWindow
  win.ezstandalone = win.ezstandalone || {}
  win.ezstandalone.cmd = Array.isArray(win.ezstandalone.cmd) ? win.ezstandalone.cmd : []
  ezoicReady = true
}

const ensureMarketingTags = () => {
  if (!import.meta.client) return
  if (allowAnalytics.value) {
    ensureGoogleTagManager()
    ensureGoogleTags()
    ensureClarity()
  }
  if (allowMarketing.value) {
    ensureMetaPixel()
    ensureLinkedInInsight()
    ensureTikTokPixel()
  }
  ensureEzoic()
}

onMounted(() => {
  void initSession()
})

watch(
  () => [analyticsConsent.value, marketingConsent.value] as const,
  ([analyticsOk, marketingOk]) => {
    if (!import.meta.client) return
    if (!analyticsOk && !marketingOk) {
      clearSession()
    }
  },
  { immediate: true },
)

watch(
  () => marketingConsent.value,
  (enabled) => {
    if (!import.meta.client) return
    if (enabled) return
    try {
      window.localStorage.removeItem('rs:attribution')
    }
    catch {
      // ignore
    }
  },
  { immediate: true },
)

watch(
  () => [allowAnalytics.value, allowMarketing.value] as const,
  async ([analyticsOk, marketingOk]) => {
    if (!import.meta.client) return
    ensureMarketingTags()
    if (!analyticsOk && !marketingOk) return
    await nextTick()
    void initMarketing()
  },
  { immediate: true, flush: 'post' },
)

watch(
  () => [analyticsConsent.value, marketingConsent.value] as const,
  ([nextAnalytics, nextMarketing], [prevAnalytics, prevMarketing]) => {
    if (!import.meta.client) return
    const analyticsRevoked = prevAnalytics && !nextAnalytics
    const marketingRevoked = prevMarketing && !nextMarketing
    if (!analyticsRevoked && !marketingRevoked) return

    clearSession()
    if (marketingRevoked) {
      try {
        window.localStorage.removeItem('rs:attribution')
      }
      catch {
        // ignore
      }
    }

    window.location.reload()
  },
)

watch(
  () => route.fullPath,
  async () => {
    void trackPageView()
    if (!import.meta.client) return
    if (!allowEzoic.value) return
    await nextTick()
    const win = window as typeof window & { ezstandalone?: any }
    win.ezstandalone = win.ezstandalone || {}
    win.ezstandalone.cmd = win.ezstandalone.cmd || []
    win.ezstandalone.cmd.push(() => {
      if (typeof win.ezstandalone.showAds === 'function') {
        win.ezstandalone.showAds()
      }
    })
  },
)

watch(
  () => allowEzoic.value,
  async (enabled) => {
    if (!enabled) return
    if (!import.meta.client) return
    ensureEzoic()
    await nextTick()
    const win = window as typeof window & { ezstandalone?: any }
    win.ezstandalone = win.ezstandalone || {}
    win.ezstandalone.cmd = win.ezstandalone.cmd || []
    win.ezstandalone.cmd.push(() => {
      if (typeof win.ezstandalone.showAds === 'function') {
        win.ezstandalone.showAds()
      }
    })
  },
)
</script>
