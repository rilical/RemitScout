<template>
  <div class="min-h-screen bg-brand-600 flex items-center justify-center px-6 py-12">
    <div class="max-w-md w-full text-center">
      <div class="bg-white rounded-2xl p-8 shadow-xl">
        <div class="flex flex-col items-center gap-6 mb-8">
          <div class="flex flex-col items-center gap-4">
            <ProviderLogo
              v-if="provider?.slug"
              :slug="provider.slug"
              :alt="provider.name"
              size="large"
            />
            <span v-else class="text-4xl font-bold text-slate-600">
              {{ provider?.name?.slice(0, 1) || '?' }}
            </span>
            <div class="text-xl font-normal text-slate-300 my-2">
              X
            </div>
            <div>
              <img
                src="/png/SVG/FULL_LOGO.svg"
                alt="Remit-Scout"
                class="h-16 w-auto mx-auto"
              />
            </div>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900 mb-2">
              Redirecting to {{ provider?.name || 'Provider' }}
            </h1>
            <p class="text-sm text-slate-600">
              Opening in <span class="font-semibold">{{ secondsRemaining }}</span> seconds
            </p>
          </div>
        </div>

        <div class="mb-6">
          <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              class="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-out"
              :style="{ width: `${progressPct}%` }"
            />
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <button
            type="button"
            class="w-full rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            :disabled="!targetUrl"
            @click="redirectNow"
          >
            Continue now →
          </button>
          <NuxtLink
            to="/send-money"
            class="w-full rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to compare
          </NuxtLink>
        </div>
      </div>

      <div v-if="!targetUrl" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
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
import { useProviderVisits } from '~/composables/useProviderVisits'
import { extractUtmParams } from '~/lib/outbound'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const { request } = useApi()
const { trackClick } = useTelemetry()
const { ensureSession } = useSession()
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

const getQueryValue = (key: string) => {
  const raw = route.query[key]
  return Array.isArray(raw) ? raw[0] : raw
}

const toNumber = (value?: string) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const readAttribution = () => {
  if (!import.meta.client) return {}
  try {
    const raw = window.localStorage.getItem('rs:attribution')
    if (!raw) return {}
    return JSON.parse(raw) as { gclid?: string; fbclid?: string; msclkid?: string }
  } catch {
    return {}
  }
}

const sanitizeTarget = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/')) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {
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
  const queryTarget = sanitizeTarget(getQueryValue('target'))
  if (queryTarget) return queryTarget
  const fallback = sanitizeTarget(provider.value?.affiliateUrl || provider.value?.url)
  return fallback
})

const targetHost = computed(() => {
  if (!targetUrl.value) return 'Unavailable'
  if (targetUrl.value.startsWith('/')) return 'Remit-Scout'
  try {
    return new URL(targetUrl.value).hostname.replace(/^www\./, '')
  } catch {
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
const redirectStatus = computed(() => (hasRedirected.value ? 'Redirected' : 'Queued'))
const sessionLabel = computed(() => {
  if (import.meta.server) return 'anonymous'
  const ids = ensureSession()
  return ids.session_id?.slice(0, 8) || 'anonymous'
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
