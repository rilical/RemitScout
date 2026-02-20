import * as Sentry from '@sentry/vue'
import { watch } from 'vue'

const stripUrlQuery = (value: string): string => {
  try {
    const url = new URL(value)
    url.search = ''
    url.hash = ''
    return url.toString()
  }
 catch {
    return value.split('?')[0] || value
  }
}

const redactHeader = (headers: Record<string, string>, key: string) => {
  for (const candidate of [key, key.toLowerCase(), key.toUpperCase()]) {
    if (candidate in headers) {
      headers[candidate] = '[REDACTED]'
    }
  }
}

const sanitizeEvent = (event: Sentry.ErrorEvent): Sentry.ErrorEvent | null => {
  const sentryEvent = event as Sentry.ErrorEvent & {
    request?: Record<string, unknown>
    user?: Record<string, unknown>
  }

  // Avoid leaking query params (emails, tokens) in URLs.
  if (sentryEvent.request?.url && typeof sentryEvent.request.url === 'string') {
    sentryEvent.request.url = stripUrlQuery(sentryEvent.request.url)
  }

  // Strip obvious sensitive request metadata.
  if (sentryEvent.request?.headers && typeof sentryEvent.request.headers === 'object') {
    const headers = sentryEvent.request.headers as Record<string, string>
    redactHeader(headers, 'cookie')
    redactHeader(headers, 'authorization')
    redactHeader(headers, 'x-api-key')
  }

  if ('cookies' in (sentryEvent.request ?? {})) {
    delete (sentryEvent.request as Record<string, unknown>).cookies
  }

  // Never send email from the client.
  if (sentryEvent.user && typeof sentryEvent.user === 'object' && 'email' in sentryEvent.user) {
    delete (sentryEvent.user as Record<string, unknown>).email
  }

  return sentryEvent as Sentry.ErrorEvent
}

let initialized = false

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  const runtimeConfig = useRuntimeConfig()
  const dsn = runtimeConfig.public.sentryDsn as string | undefined
  const enabled = runtimeConfig.public.sentryEnabled === true

  const { analyticsConsent } = usePrivacySettings()
  const { user } = useAuth()

  const init = () => {
    if (initialized) return
    if (!enabled) return
    if (!dsn) return
    if (!analyticsConsent.value) return

    initialized = true

    Sentry.init({
      app: nuxtApp.vueApp,
      dsn,
      enabled,
      release: (runtimeConfig.public.appVersion as string | undefined) || undefined,
      environment: (runtimeConfig.public.environmentName as string | undefined) || undefined,
      sendDefaultPii: false,
      beforeSend: sanitizeEvent,
    })
  }

  watch(
    () => analyticsConsent.value,
    (ok) => {
      if (ok) init()
    },
    { immediate: true },
  )

  watch(
    () => user.value?.id || null,
    (userId) => {
      if (!analyticsConsent.value) return
      try {
        Sentry.setUser(userId ? { id: userId } : null)
      }
 catch {
        // ignore
      }
    },
    { immediate: true },
  )
})
