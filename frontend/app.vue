<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CookieConsentBanner />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useTelemetry } from '~/composables/useTelemetry'
import { useMarketingAnalytics } from '~/composables/useMarketingAnalytics'
import { usePrivacySettings } from '~/composables/usePrivacySettings'
import { useEntitlements } from '~/composables/useEntitlements'
import CookieConsentBanner from '~/components/privacy/CookieConsentBanner.vue'

// Global app setup
useHead({
  htmlAttrs: {
    lang: 'en',
  },
})

const { initSession } = useTelemetry()
const { settings, hasConsent } = usePrivacySettings()
const { initMarketing, trackPageView } = useMarketingAnalytics()
const { isPlus, hydrated } = useEntitlements()
const runtimeConfig = useRuntimeConfig()
const ga4Id = runtimeConfig.public.ga4MeasurementId
const metaPixelId = runtimeConfig.public.metaPixelId
const route = useRoute()
const allowAnalytics = computed(() =>
  runtimeConfig.public.analyticsEnabled === true
  && settings.value.analytics === true
  && hasConsent.value,
)
const adsEnabled = computed(() => runtimeConfig.public?.adsEnabled === true)

useHead(() => {
  if (!allowAnalytics.value) {
    return {
      script: [],
      noscript: [],
    }
  }

  const script: Array<Record<string, any>> = []
  const noscript: Array<Record<string, any>> = []

  if (ga4Id) {
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

  if (metaPixelId) {
    script.push({
      key: 'meta-pixel',
      innerHTML: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');`,
    })
    noscript.push({
      key: 'meta-pixel-noscript',
      innerHTML: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" />`,
    })
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
  () => allowAnalytics.value,
  async (value) => {
    if (!value) return
    await nextTick()
    void initMarketing()
  },
  { immediate: true, flush: 'post' },
)

watch(
  () => route.fullPath,
  async () => {
    void trackPageView()
    if (!import.meta.client) return
    if (!hydrated.value || isPlus.value) return
    if (!adsEnabled.value) return
    await nextTick()
    const win = window as typeof window & { ezstandalone?: any }
    if (!win.ezstandalone?.cmd) return
    win.ezstandalone.cmd.push(() => {
      if (typeof win.ezstandalone.showAds === 'function') {
        win.ezstandalone.showAds()
      }
    })
  },
)
</script>
