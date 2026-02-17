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
const metaPixelId = runtimeConfig.public.metaPixelId
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
  } catch {
    hardReload()
  }
}

const makeCrashId = () => {
  if (!import.meta.client) return `srv_${Date.now().toString(36)}`
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
  } catch {
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
  } catch {
    // ignore
  }

  // Stop propagation so Nuxt doesn't render a blank screen.
  return false
})

useHead(() => {
  const script: Array<Record<string, any>> = []
  const noscript: Array<Record<string, any>> = []

  if (allowAnalytics.value && ga4Id) {
    script.push(
      {
        key: 'ga4-src',
        src: `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`,
        async: true,
      },
      {
        key: 'ga4-init',
        innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${ga4Id}',{anonymize_ip:true,send_page_view:false});`,
      },
    )
  }

  if (allowMarketing.value && metaPixelId) {
    script.push({
      key: 'meta-pixel',
      innerHTML: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');`,
    })
    noscript.push({
      key: 'meta-pixel-noscript',
      innerHTML: `<img height="1" width="1" alt="" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" />`,
    })
  }

  if (allowEzoic.value) {
    script.push(
      {
        key: 'ezoic-init',
        innerHTML: 'window.ezstandalone=window.ezstandalone||{};ezstandalone.cmd=ezstandalone.cmd||[];',
      },
      {
        key: 'ezoic-header',
        async: true,
        src: 'https://www.ezojs.com/ezoic/sa.min.js',
      },
    )
  }

  return {
    script,
    noscript,
  }
})

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
