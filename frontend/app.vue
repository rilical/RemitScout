<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CookieConsentBanner />
    <CookiePreferencesModal />
    <UiToast />
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

useHead(() => {
  const script: Array<Record<string, any>> = []
  const noscript: Array<Record<string, any>> = []

  // Google tags (GA4 and/or Google Ads) are loaded only when analytics consent is granted.
  const googleTagId = ga4Id || googleAdsConversionId
  if (allowAnalytics.value && googleTagId) {
    script.push(
      {
        key: 'ga4-src',
        src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`,
        async: true,
      },
      {
        key: 'ga4-init',
        innerHTML: [
          'window.dataLayer=window.dataLayer||[];',
          'function gtag(){dataLayer.push(arguments);}',
          `gtag('js', new Date());`,
          ga4Id ? `gtag('config','${ga4Id}',{anonymize_ip:true,send_page_view:false});` : '',
          googleAdsConversionId ? `gtag('config','${googleAdsConversionId}');` : '',
        ].filter(Boolean).join(''),
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

  // Microsoft Clarity (heatmaps/session replay). Treated as analytics.
  if (allowAnalytics.value && clarityProjectId) {
    script.push({
      key: 'clarity',
      innerHTML: `((c,l,a,r,i,t,y)=>{c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${clarityProjectId}");`,
    })
  }

  // LinkedIn Insight Tag. Treated as marketing.
  if (allowMarketing.value && linkedinPartnerId) {
    script.push(
      {
        key: 'linkedin-insight-base',
        innerHTML: `window._linkedin_partner_id="${linkedinPartnerId}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(window._linkedin_partner_id);`,
      },
      {
        key: 'linkedin-insight-src',
        innerHTML: `(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s)})(window.lintrk);`,
      },
    )
    noscript.push({
      key: 'linkedin-insight-noscript',
      innerHTML: `<img height="1" width="1" alt="" style="display:none" src="https://px.ads.linkedin.com/collect/?pid=${linkedinPartnerId}&fmt=gif" />`,
    })
  }

  // TikTok Pixel. Treated as marketing.
  if (allowMarketing.value && tiktokPixelId) {
    script.push({
      key: 'tiktok-pixel',
      innerHTML: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load("${tiktokPixelId}");ttq.page();}(window,document,'ttq');`,
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
