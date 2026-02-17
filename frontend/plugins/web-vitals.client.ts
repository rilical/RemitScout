import { watch } from 'vue'
import { onCLS, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

let started = false

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  const runtimeConfig = useRuntimeConfig()
  const { analyticsConsent } = usePrivacySettings()
  const route = useRoute()

  const sampleRate = Number(runtimeConfig.public.webVitalsSampleRate ?? 0.1)
  const sampled = Number.isFinite(sampleRate) && sampleRate > 0 && Math.random() < Math.min(1, Math.max(0, sampleRate))

  const sendToGa4 = (metric: Metric) => {
    if (!runtimeConfig.public.analyticsEnabled) return
    const measurementId = runtimeConfig.public.ga4MeasurementId as string | undefined
    if (!measurementId) return
    if (typeof window === 'undefined') return
    const gtag = (window as any).gtag
    if (typeof gtag !== 'function') return

    gtag('event', 'web_vital', {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      route: route.path,
    })
  }

  const sendToSentry = async (metric: Metric) => {
    const enabled = runtimeConfig.public.sentryEnabled === true
    const dsn = runtimeConfig.public.sentryDsn as string | undefined
    if (!enabled || !dsn) return

    try {
      const Sentry = await import('@sentry/vue')
      Sentry.captureMessage('web_vital', {
        level: 'info',
        tags: {
          metric: metric.name,
          rating: metric.rating,
          route: route.path,
        },
        extra: {
          value: metric.value,
          delta: metric.delta,
          navigationType: metric.navigationType,
        },
      })
    } catch {
      // ignore
    }
  }

  const handleMetric = (metric: Metric) => {
    if (!analyticsConsent.value) return
    sendToGa4(metric)
    void sendToSentry(metric)
  }

  const start = () => {
    if (started) return
    if (!sampled) return
    started = true
    onCLS(handleMetric)
    onINP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)
  }

  watch(
    () => analyticsConsent.value,
    (ok) => {
      if (ok) start()
    },
    { immediate: true },
  )
})
