<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CookieConsentBanner />
    <CookiePreferencesModal />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useTelemetry } from '~/composables/useTelemetry'
import { useMarketingAnalytics } from '~/composables/useMarketingAnalytics'
import { usePrivacySettings } from '~/composables/usePrivacySettings'
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
      innerHTML: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" />`,
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
