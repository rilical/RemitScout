<template>
  <div class="min-h-screen bg-brand-600 flex items-center justify-center px-6 py-12">
    <div class="max-w-md w-full text-center">
      <div class="bg-surface rounded-2xl p-8 shadow-xl">
        <div class="flex flex-col items-center gap-6 mb-8">
          <div class="flex flex-col items-center gap-4">
            <ProviderLogo
              v-if="provider?.slug"
              :slug="provider.slug"
              :alt="provider.name"
              size="large"
            />
            <span
              v-else
              class="text-h1 font-bold text-neutral-600"
            >
              {{ provider?.name?.slice(0, 1) || '?' }}
            </span>
            <div class="text-h4 font-normal text-neutral-300 my-2">
              X
            </div>
            <div>
              <NuxtImg
                src="/png/SVG/FULL_LOGO.svg"
                alt="Remit-Scout"
                width="271"
                height="64"
                loading="lazy"
                class="h-16 w-auto mx-auto object-contain"
              />
            </div>
          </div>
          <div>
            <h1 class="text-h3 font-bold text-rs-fg mb-2">
              Redirecting to {{ provider?.name || 'Provider' }}
            </h1>
            <p class="text-body-sm text-neutral-600">
              Opening in <span class="font-semibold">{{ secondsRemaining }}</span> seconds
            </p>
          </div>
        </div>

        <div class="mb-6">
          <div class="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              class="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-out"
              :style="{ width: `${progressPct}%` }"
            />
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <button
            type="button"
            class="w-full rounded-lg bg-brand-600 px-5 py-3 text-body-sm font-semibold text-white transition hover:bg-brand-700"
            :disabled="!targetUrl"
            @click="redirectNow"
          >
            Continue now →
          </button>
          <NuxtLink
            to="/send-money"
            class="w-full rounded-lg border border-neutral-300 px-5 py-3 text-body-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            Back to compare
          </NuxtLink>
        </div>
      </div>

      <div
        v-if="!targetUrl"
        class="mt-6 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-body-sm text-warning-800"
      >
        We could not determine a valid destination URL for this provider. Please go back and try another link.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import { useApi } from '~/composables/useApi'
import { useTelemetry } from '~/composables/useTelemetry'
import { useSession } from '~/composables/useSession'
import { usePrivacySettings } from '~/composables/usePrivacySettings'
import { useProviderVisits } from '~/composables/useProviderVisits'
import { setSeo } from '~/composables/useSeo'
import { extractUtmParams } from '~/lib/outbound'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com'

setSeo({
  title: 'Redirecting | Remit-Scout',
  description: 'Redirecting to an external provider site.',
  canonical: `${siteUrl}${route.path}`,
  noindex: true,
})

const { request } = useApi()
const { trackClick } = useTelemetry()
const { ensureSession } = useSession()
const { marketingConsent } = usePrivacySettings()
const { trackProviderVisit } = useProviderVisits()

const providerParam = computed(() => {
  const raw = route.params.provider
  return Array.isArray(raw) ? raw[0] : raw
})

const providerKey = `provider-metadata:${providerParam.value || 'unknown'}`
const { data: providerResponse } = await useAsyncData(
  providerKey,
  async () => {
    if (!providerParam.value) return null
    return await request<{ data: any }>(`/providers/metadata/${providerParam.value}`)
  },
  { watch: [providerParam] },
)

const provider = computed(() => providerResponse.value?.data ?? null)

const getQueryValue = (key: string): string | undefined => {
  const raw = route.query[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value : undefined
}

const toNumber = (value?: string) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const readAttribution = () => {
  if (!import.meta.client) return {}
  if (!marketingConsent.value) return {}
  try {
    const raw = window.localStorage.getItem('rs:attribution')
    if (!raw) return {}
    return JSON.parse(raw) as { gclid?: string, fbclid?: string, msclkid?: string }
  }
  catch {
    return {}
  }
}

const normalizeHost = (host: string) => host.replace(/^www\./i, '').toLowerCase()

const extractHost = (value?: string | null): string | null => {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return normalizeHost(parsed.hostname)
  }
  catch {
    return null
  }
}

const isAllowedHost = (host: string, allowlist: string[]) => {
  const normalizedHost = normalizeHost(host)
  return allowlist.some((allowed) => {
    const normalizedAllowed = normalizeHost(allowed)
    return (
      normalizedHost === normalizedAllowed
      || normalizedHost.endsWith(`.${normalizedAllowed}`)
    )
  })
}

const allowedTargetHosts = computed(() => {
  const hosts = new Set<string>()
  const providerUrlHost = extractHost(provider.value?.url)
  const affiliateUrlHost = extractHost(provider.value?.affiliateUrl ?? null)
  if (providerUrlHost) hosts.add(providerUrlHost)
  if (affiliateUrlHost) hosts.add(affiliateUrlHost)
  return [...hosts]
})

const sanitizeTarget = (value: string | null | undefined, allowlist: string[]) => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/')) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:')
      && allowlist.length > 0
      && isAllowedHost(parsed.hostname, allowlist)
    ) {
      return parsed.toString()
    }
  }
  catch {
    return null
  }
  return null
}

const corridorId = computed(() => getQueryValue('corridor_id') || getQueryValue('corridor') || null)
const amount = computed(() => toNumber(getQueryValue('amount')))
const quotedRate = computed(() => toNumber(getQueryValue('rate')))
const quotedFee = computed(() => toNumber(getQueryValue('fee')))
const fromCurrency = computed(() => getQueryValue('fromCurrency') || null)
const toCurrency = computed(() => getQueryValue('toCurrency') || null)
const affiliateParam = computed(() => getQueryValue('affiliate'))

const affiliateFlag = computed(() => {
  if (affiliateParam.value === '1' || affiliateParam.value === 'true') return true
  if (affiliateParam.value === '0' || affiliateParam.value === 'false') return false
  if (provider.value?.affiliateUrl) return true
  return false
})

const targetUrl = computed(() => {
  const queryTarget = sanitizeTarget(getQueryValue('target'), allowedTargetHosts.value)
  if (queryTarget) return queryTarget
  const fallback = sanitizeTarget(
    provider.value?.affiliateUrl || provider.value?.url,
    allowedTargetHosts.value,
  )
  return fallback
})

const targetHost = computed(() => {
  if (!targetUrl.value) return 'Unavailable'
  if (targetUrl.value.startsWith('/')) return 'Remit-Scout'
  try {
    return new URL(targetUrl.value).hostname.replace(/^www\./, '')
  }
  catch {
    return 'Provider site'
  }
})

const amountLabel = computed(() => {
  if (!amount.value || !fromCurrency.value || !toCurrency.value) return null
  return `${amount.value.toLocaleString()} ${fromCurrency.value} to ${toCurrency.value}`
})

const rateLabel = computed(() => {
  if (!quotedRate.value || !fromCurrency.value || !toCurrency.value) return null
  return `1 ${fromCurrency.value} = ${quotedRate.value.toFixed(4)} ${toCurrency.value}`
})

const feeLabel = computed(() => {
  if (!quotedFee.value || !fromCurrency.value) return null
  return `${quotedFee.value.toFixed(2)} ${fromCurrency.value}`
})

const totalSeconds = 2
const secondsRemaining = ref(totalSeconds)
const progressPct = computed(() => {
  const elapsed = totalSeconds - secondsRemaining.value
  const pct = (elapsed / totalSeconds) * 100
  return Math.min(100, Math.max(0, pct))
})

const hasTracked = ref(false)
const hasRedirected = ref(false)
let countdownTimer: number | null = null
let redirectTimer: number | null = null

const redirectNow = () => {
  if (!targetUrl.value || hasRedirected.value || typeof window === 'undefined') return
  hasRedirected.value = true
  window.location.assign(targetUrl.value)
}

const trackOutbound = async () => {
  if (hasTracked.value || !targetUrl.value || !providerParam.value) return
  hasTracked.value = true

  await trackClick({
    provider_id: providerParam.value,
    corridor_id: corridorId.value ?? undefined,
    target_url: targetUrl.value,
    quoted_rate: quotedRate.value ?? undefined,
    quoted_fee: quotedFee.value ?? undefined,
    is_affiliate: affiliateFlag.value,
  })

  if (!marketingConsent.value) return

  const sessionIds = ensureSession()
  const attribution = readAttribution()
  await trackProviderVisit({
    session_id: sessionIds.session_id,
    anon_id: sessionIds.anon_id ?? undefined,
    provider_id: providerParam.value,
    corridor_id: corridorId.value ?? undefined,
    target_url: targetUrl.value,
    page_path: route.fullPath,
    utm: extractUtmParams(route.query as Record<string, unknown>),
    gclid: attribution.gclid,
    fbclid: attribution.fbclid,
    msclkid: attribution.msclkid,
    ttclid: (attribution as any).ttclid,
    li_fat_id: (attribution as any).li_fat_id,
    quoted_rate: quotedRate.value ?? undefined,
    quoted_fee: quotedFee.value ?? undefined,
  })
}

onMounted(() => {
  void trackOutbound()

  if (!targetUrl.value || typeof window === 'undefined') return

  countdownTimer = window.setInterval(() => {
    if (secondsRemaining.value > 0) {
      secondsRemaining.value -= 1
    }
  }, 1000)

  redirectTimer = window.setTimeout(() => {
    redirectNow()
  }, totalSeconds * 1000)
})

onBeforeUnmount(() => {
  if (countdownTimer) window.clearInterval(countdownTimer)
  if (redirectTimer) window.clearTimeout(redirectTimer)
})
</script>
