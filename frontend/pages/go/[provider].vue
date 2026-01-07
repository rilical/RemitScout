<template>
  <div class="min-h-screen bg-slate-950 text-white">
    <div class="relative overflow-hidden">
      <div class="absolute inset-0 opacity-70">
        <div class="absolute -top-32 left-1/3 h-80 w-80 rounded-full bg-blue-600/30 blur-[140px]" />
        <div class="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
      </div>

      <div class="relative mx-auto max-w-4xl px-6 py-14 sm:py-20">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img src="/logos/remit-scout.svg" alt="Remit-Scout" class="h-8 w-auto" />
            <div class="text-xs uppercase tracking-[0.2em] text-slate-300">Trusted handoff</div>
          </div>
          <div v-if="provider" class="text-xs text-slate-300">
            Provider ID: <span class="font-semibold text-white">{{ provider.id }}</span>
          </div>
        </div>

        <div class="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.9)]">
            <div class="flex items-center gap-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <ProviderLogo
                  v-if="provider?.slug"
                  :slug="provider.slug"
                  :alt="provider.name"
                  class="h-9 w-auto"
                />
                <span v-else class="text-2xl font-semibold text-white">
                  {{ provider?.name?.slice(0, 1) || '?' }}
                </span>
              </div>
              <div>
                <p class="text-sm text-slate-300">Taking you to</p>
                <h1 class="text-3xl font-semibold text-white">
                  {{ provider?.name || 'the provider site' }}
                </h1>
              </div>
            </div>

            <p class="mt-6 text-sm leading-relaxed text-slate-300">
              We are opening the provider site in <span class="font-semibold text-white">{{ secondsRemaining }}</span> seconds.
              This transition page tracks outbound clicks so we can keep providers accountable and keep pricing transparent.
            </p>

            <div class="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span v-if="corridorId">Corridor: <span class="text-white">{{ corridorId }}</span></span>
                <span v-if="amountLabel">Amount: <span class="text-white">{{ amountLabel }}</span></span>
                <span v-if="rateLabel">Rate: <span class="text-white">{{ rateLabel }}</span></span>
                <span v-if="feeLabel">Fee: <span class="text-white">{{ feeLabel }}</span></span>
              </div>
              <div class="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <div class="h-2 w-2 rounded-full bg-emerald-400" />
                <span v-if="affiliateFlag">Affiliate link detected</span>
                <span v-else>Standard provider link</span>
              </div>
            </div>

            <div class="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                :disabled="!targetUrl"
                @click="redirectNow"
              >
                Continue now
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5" />
                </svg>
              </button>
              <NuxtLink
                to="/send-money"
                class="inline-flex flex-1 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                Back to compare
              </NuxtLink>
            </div>

            <p class="mt-4 text-xs text-slate-400">
              If you are not redirected automatically, click "Continue now".
            </p>
          </div>

          <div class="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs uppercase tracking-[0.2em] text-slate-300">Transfer summary</p>
                <h2 class="mt-2 text-xl font-semibold text-white">Quick handoff</h2>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-full border border-white/20">
                <div class="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              </div>
            </div>

            <div class="mt-6 space-y-4 text-sm text-slate-200">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Destination</span>
                <span class="font-semibold text-white">{{ targetHost }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Status</span>
                <span class="font-semibold text-emerald-300">{{ redirectStatus }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Session</span>
                <span class="font-semibold text-white">{{ sessionLabel }}</span>
              </div>
            </div>

            <div class="mt-8 rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-xs text-slate-300">
              <p class="font-semibold text-white">Why this page?</p>
              <p class="mt-2 text-slate-300">
                We track outbound traffic and affiliate labels to keep provider rankings honest and help you compare offers fairly.
              </p>
            </div>
          </div>
        </div>

        <div v-if="!targetUrl" class="mt-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm text-amber-100">
          We could not determine a valid destination URL for this provider. Please go back and try another link.
        </div>
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
  return Boolean(provider.value?.isAffiliate)
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

const secondsRemaining = ref(4)
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
  await trackProviderVisit({
    session_id: sessionIds.session_id,
    anon_id: sessionIds.anon_id ?? undefined,
    provider_id: providerParam.value,
    corridor_id: corridorId.value ?? undefined,
    target_url: targetUrl.value,
    page_path: route.fullPath,
    utm: extractUtmParams(route.query as Record<string, unknown>),
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
  }, secondsRemaining.value * 1000)
})

onBeforeUnmount(() => {
  if (countdownTimer) window.clearInterval(countdownTimer)
  if (redirectTimer) window.clearTimeout(redirectTimer)
})
</script>
