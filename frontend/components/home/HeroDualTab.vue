<template>
  <section
    id="hero-dual-tab"
    class="relative bg-surface py-16 sm:py-20 lg:py-24 min-h-[700px]"
  >
    <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <svg
        class="absolute inset-0 h-full w-full hero-map"
        viewBox="0 0 2000 857"
        :preserveAspectRatio="mapPreserveAspectRatio"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id="route-glow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur
              stdDeviation="2.2"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.75 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient
            id="route-blue"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop
              offset="0"
              stop-color="#60a5fa"
            />
            <stop
              offset="1"
              stop-color="#2563eb"
            />
          </linearGradient>
          <linearGradient
            id="route-emerald"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop
              offset="0"
              stop-color="#34d399"
            />
            <stop
              offset="1"
              stop-color="#059669"
            />
          </linearGradient>
          <linearGradient
            id="route-violet"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop
              offset="0"
              stop-color="#a78bfa"
            />
            <stop
              offset="1"
              stop-color="#7c3aed"
            />
          </linearGradient>
        </defs>

        <image
          href="/world.webp"
          x="0"
          y="0"
          width="2000"
          height="857"
          class="hero-map__image"
          preserveAspectRatio="xMidYMid slice"
        />

        <g filter="url(#route-glow)">
          <path
            v-for="route in displayRoutes"
            :key="route.key"
            :d="route.d"
            pathLength="1"
            :stroke="route.stroke"
            :stroke-width="route.strokeWidth"
            class="route-line"
            :style="{
              '--target-opacity': route.opacity,
              '--route-dur': route.dur,
              '--route-delay': route.delay,
            }"
          />
          <path
            v-if="activePath"
            :d="activePath.d"
            pathLength="1"
            stroke="url(#route-blue)"
            stroke-width="2.4"
            class="route-line route-line--active"
            :style="{
              '--route-dur': activeRouteDur,
              '--route-delay': '0s',
            }"
          />
        </g>
      </svg>
    </div>

    <div class="container relative z-10">
      <!-- Money Transfer Content -->
      <div class="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-5 lg:gap-12">
        <div class="animate-fade-in-up delay-200 lg:col-span-3 flex flex-col">
          <h1
            class="mb-4 text-hero font-bold leading-tight text-neutral-900"
          >
            Send more home,<br><span class="text-brand-600">pay less</span> in fees.
          </h1>
          <p class="mb-8 text-body-lg leading-relaxed text-neutral-600">
            Compare current quotes, total fees, and estimated delivery times <span class="whitespace-nowrap">across {{ SITE_STATS.licensedProviders.display }} licensed providers.</span>
          </p>

          <div
            class="animate-scale-in relative flex-1 flex flex-col rounded-3xl border border-neutral-200 bg-surface p-4 sm:p-8 shadow-lg delay-300"
          >
            <form
              role="search"
              aria-label="Money transfer comparison form"
              class="flex-1 flex flex-col"
              @submit.prevent="handleMoneySubmit"
            >
              <!-- Mobile Stepper (visible on mobile only) -->
              <div class="mb-4 flex items-center justify-center gap-2 sm:hidden">
                <div
                  v-for="step in 3"
                  :key="step"
                  class="flex items-center"
                >
                  <div
                    :class="[
                      'flex h-8 w-8 items-center justify-center rounded-full text-body-sm font-bold transition-all',
                      currentMobileStep >= step
                        ? 'bg-brand-600 text-white'
                        : 'bg-neutral-200 text-neutral-600',
                    ]"
                  >
                    {{ step }}
                  </div>
                  <div
                    v-if="step < 3"
                    :class="[
                      'mx-1 h-0.5 w-8 transition-all',
                      currentMobileStep > step ? 'bg-brand-600' : 'bg-neutral-200',
                    ]"
                  />
                </div>
              </div>

              <!-- Step 1: Countries (always visible on desktop, conditional on mobile) -->
              <div
                class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
                :class="{ 'hidden sm:grid': currentMobileStep !== 1 }"
              >
                <div>
                  <label
                    for="from-country"
                    class="mb-2 block text-body-sm font-semibold text-neutral-700"
                  >
                    <span class="mr-2">🛫</span>Sending from
                  </label>
                  <CountrySelect
                    id="from-country"
                    v-model="moneyForm.from"
                    label="Sending from"
                    :exclude-country="moneyForm.to"
                    placeholder="United States"
                  />
                </div>

                <div>
                  <label
                    for="to-country"
                    class="mb-2 block text-body-sm font-semibold text-neutral-700"
                  >
                    <span class="mr-2">🛬</span>Receiving in
                  </label>
                  <CountrySelect
                    id="to-country"
                    v-model="moneyForm.to"
                    label="Receiving in"
                    :exclude-country="moneyForm.from"
                    placeholder="Type in Country"
                  />
                </div>

                <!-- Mobile Next Button for Step 1 -->
                <div class="sm:hidden">
                  <button
                    type="button"
                    :disabled="!moneyForm.from || !moneyForm.to"
                    class="w-full rounded-lg bg-brand-600 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="currentMobileStep = 2"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <!-- Step 2: Currencies (always visible on desktop, conditional on mobile) -->
              <div
                class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
                :class="{ 'hidden sm:grid': currentMobileStep !== 2 }"
              >
                <div>
                  <label
                    for="from-currency"
                    class="mb-2 block text-body-sm font-semibold text-neutral-700"
                  >
                    From currency
                  </label>
                  <CurrencySelect
                    id="from-currency"
                    v-model="moneyForm.fromCurrency"
                    :country-code="moneyForm.from"
                    :currencies="availableFromCurrencies"
                    :exclude-currency="moneyForm.toCurrency"
                    placeholder="Choose currency"
                  />
                </div>

                <div>
                  <label
                    for="to-currency"
                    class="mb-2 block text-body-sm font-semibold text-neutral-700"
                  >
                    To currency
                  </label>
                  <CurrencySelect
                    id="to-currency"
                    v-model="moneyForm.toCurrency"
                    :country-code="moneyForm.to"
                    :currencies="availableToCurrencies"
                    :exclude-currency="moneyForm.fromCurrency"
                    :placeholder="
                      moneyForm.to ? 'Choose currency' : 'Select receiving country first'
                    "
                    :disabled="!moneyForm.to || !availableToCurrencies.length"
                  />
                </div>

                <!-- Mobile Navigation for Step 2 -->
                <div class="flex gap-2 sm:hidden">
                  <button
                    type="button"
                    class="flex-1 rounded-lg border border-neutral-300 py-3 text-body-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                    @click="currentMobileStep = 1"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    :disabled="!moneyForm.fromCurrency || !moneyForm.toCurrency"
                    class="flex-1 rounded-lg bg-brand-600 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="currentMobileStep = 3"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <!-- Step 3: Amount (always visible on desktop, conditional on mobile) -->
              <div
                class="mb-6 flex-1"
                :class="{ 'hidden sm:block': currentMobileStep !== 3 }"
              >
                <label
                  for="amount"
                  class="mb-2 block text-body-sm font-semibold text-neutral-700"
                >
                  You send
                </label>
                <input
                  id="amount"
                  v-model.number="moneyForm.amount"
                  type="number"
                  :min="inputMin"
                  :max="inputMax"
                  step="0.01"
                  class="h-12 w-full rounded-lg border border-neutral-300 bg-surface px-4 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                  :placeholder="amountPlaceholder"
                  @keydown="handleAmountKeydown"
                  @blur="handleAmountBlur"
                  @input="sanitizeAmountInput"
                >
                <p class="mt-1.5 text-body-sm text-neutral-500">
                  Enter the amount you want to send
                </p>

                <!-- Mobile Back Button for Step 3 -->
                <div class="mt-4 sm:hidden">
                  <button
                    type="button"
                    class="w-full rounded-lg border border-neutral-300 py-3 text-body-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                    @click="currentMobileStep = 2"
                  >
                    ← Back
                  </button>
                </div>
              </div>

              <!-- Error/Success Messages (hidden for corridor unavailable errors - shown above button instead) -->
              <div
                v-if="(formError || formSuccess) && !isCorridorUnavailableError"
                role="alert"
                aria-live="polite"
                aria-atomic="true"
                class="mb-4"
              >
                <div
                  v-if="formError"
                  class="rounded-lg bg-red-50 border border-red-200 p-3 text-body-sm text-red-800"
                >
                  <div class="flex items-start gap-2">
                    <svg
                      class="h-5 w-5 flex-shrink-0 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{{ formError }}</span>
                  </div>
                </div>
                <div
                  v-if="formSuccess"
                  class="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-body-sm text-emerald-800"
                >
                  <div class="flex items-start gap-2">
                    <svg
                      class="h-5 w-5 flex-shrink-0 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{{ formSuccess }}</span>
                  </div>
                </div>
              </div>

              <!-- Corridor Unavailable Error - shown directly above button -->
              <div
                v-if="isCorridorUnavailableError"
                role="alert"
                aria-live="polite"
                aria-atomic="true"
                class="mb-4"
              >
                <div class="rounded-lg bg-red-50 border border-red-200 p-3 text-body-sm text-red-800">
                  <div class="flex items-start gap-2">
                    <svg
                      class="h-5 w-5 flex-shrink-0 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{{ formError }}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                :disabled="isSubmitting || isWaitingForQuotes"
                class="group min-h-btn w-full rounded-xl bg-brand-600 font-semibold text-white transition-all duration-200 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 flex items-center justify-center gap-2 mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                :class="{ 'hidden sm:flex': currentMobileStep !== 3 }"
                aria-describedby="form-errors"
              >
                <svg
                  v-if="isSubmitting || isWaitingForQuotes"
                  class="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span v-if="isWaitingForQuotes && formInfo">{{ formInfo }}</span>
                <span v-else-if="isSubmitting">Submitting...</span>
                <span v-else>Compare providers</span>
                <svg
                  v-if="!isSubmitting && !isWaitingForQuotes"
                  class="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </form>

            <div class="mt-6 border-t border-neutral-200/50 pt-6">
              <p class="text-body-sm text-neutral-600">
                Typical savings vs bank last month: 3–9%. Estimates include fees + exchange
                margin.
              </p>
            </div>
          </div>
        </div>

        <div class="animate-slide-in-right hidden delay-300 lg:col-span-2 lg:block">
          <div
            class="flex h-full flex-col rounded-3xl border border-neutral-200 bg-surface p-8 shadow-lg"
          >
            <h3 class="mb-6 text-h3 font-bold text-neutral-900">
              Why Remit-Scout?
            </h3>

            <div class="flex-1 space-y-6">
              <!-- Money Saved -->
              <div class="border-b border-neutral-200 pb-6">
                <p class="mb-1 text-body-sm text-neutral-600">
                  {{ SITE_STATS.totalSaved.label }}
                </p>
                <p class="text-h1 font-bold text-brand-600">
                  {{ SITE_STATS.totalSaved.display }}
                </p>
                <p class="mt-1 text-body-sm text-neutral-600">
                  Since 2024
                </p>
              </div>

              <!-- Providers Compared -->
              <div class="border-b border-neutral-200 pb-6">
                <p class="mb-1 text-body-sm text-neutral-600">
                  {{ SITE_STATS.providers.label }}
                </p>
                <p class="text-h1 font-bold text-brand-600">
                  {{ SITE_STATS.providers.display }}
                </p>
                <p class="mt-1 text-body-sm text-neutral-600">
                  Licensed and regulated where available
                </p>
              </div>

              <!-- Countries Covered -->
              <div class="border-b border-neutral-200 pb-6">
                <p class="mb-1 text-body-sm text-neutral-600">
                  {{ SITE_STATS.corridors.label }}
                </p>
                <p class="text-h1 font-bold text-brand-600">
                  {{ SITE_STATS.corridors.display }}
                </p>
                <p class="mt-1 text-body-sm text-neutral-600">
                  Coverage varies by corridor
                </p>
              </div>

              <!-- Average Savings -->
              <div class="border-b border-neutral-200 pb-6">
                <p class="mb-1 text-body-sm text-neutral-600">
                  Average savings vs banks
                </p>
                <p class="text-h1 font-bold text-brand-600 tracking-tight">
                  <span class="inline-block bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
                    9%
                  </span>
                </p>
                <p class="mt-1 text-body-sm text-neutral-600">
                  On many transfers
                </p>
              </div>

              <!-- Trust -->
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <svg
                    class="w-6 h-6 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <div>
                    <p class="text-body-sm font-semibold text-neutral-900">
                      Independent rankings
                    </p>
                    <p class="text-body-sm text-neutral-600">
                      No pay-to-rank. Results stay data-driven.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Tagline -->
              <div class="pt-6 border-t border-neutral-200">
                <p class="text-body-sm font-medium text-brand-600">
                  Money, made global.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Gradient at the Bottom -->
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-600/10 via-brand-500/5 to-transparent" />

    <!-- SEO: WebSite structured data with search action -->
    <JsonLdWebSiteSearch />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCompareForm } from '~/composables/useCompareForm'
import type { Method } from '~/types/remit'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import { useApi } from '~/composables/useApi'
import { useCorridorCurrencies } from '~/composables/useCorridorCurrencies'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import JsonLdWebSiteSearch from '~/components/seo/JsonLdWebSiteSearch.vue'
import { SITE_STATS } from '~/config/stats'
import { getCountryByCode } from '~/utils/countries-currencies'
import { getMinAmount, getMaxAmount, sanitizeAmount, isValidAmount, formatCurrency } from '~/utils/currency-limits'

type PrefillFormData = Partial<{
  from: string
  to: string
  amount: number
  method: Method
  fromCurrency: string
  toCurrency: string
}>

type LatLon = {
  lat: number
  lon: number
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const { form: moneyForm, submit: submitForm, validationError, statusMessage, isWaitingForQuotes } = useCompareForm()

const formError = validationError
const formSuccess = ref<string>('')
const formInfo = statusMessage
const isSubmitting = ref(false)

const fallbackMinAmount = computed(() => getMinAmount(moneyForm.value.fromCurrency || 'USD'))
const fallbackMaxAmount = computed(() => getMaxAmount(moneyForm.value.fromCurrency || 'USD'))

const isCorridorUnavailableError = computed(() => {
  return formError.value === 'Unavailable corridor. Please try another.'
})

const currentMobileStep = ref(1)

const { recordSearch } = useRemittanceApi()
const { request } = useApi()

const fromCurrencyRef = computed({
  get: () => moneyForm.value.fromCurrency,
  set: (value) => { moneyForm.value.fromCurrency = value },
})

const toCurrencyRef = computed({
  get: () => moneyForm.value.toCurrency,
  set: (value) => { moneyForm.value.toCurrency = value },
})

const { availableFromCurrencies, availableToCurrencies } = useCorridorCurrencies(
  computed(() => moneyForm.value.from),
  computed(() => moneyForm.value.to),
  fromCurrencyRef,
  toCurrencyRef,
)

const minAmount = computed(() => fallbackMinAmount.value)
const maxAmount = computed(() => fallbackMaxAmount.value)
const inputMin = computed(() => minAmount.value)
const inputMax = computed(() => maxAmount.value)
const amountPlaceholder = computed(() => {
  const currency = moneyForm.value.fromCurrency || 'USD'
  return `Enter amount (min ${formatCurrency(minAmount.value, currency)})`
})
const amountLimits = computed(() => ({
  minAmount: minAmount.value,
  maxAmount: maxAmount.value,
  strict: true,
}))

watch(
  () => moneyForm.value.from,
  (newFrom) => {
    if (!newFrom) return

    const country = getCountryByCode(newFrom)
    if (!country?.currency) return

    const defaultCurrency = country.currency.toUpperCase()

    if (availableFromCurrencies.value.length > 0) {
      if (availableFromCurrencies.value.includes(defaultCurrency)) {
        moneyForm.value.fromCurrency = defaultCurrency
      }
      else if (!moneyForm.value.fromCurrency || !availableFromCurrencies.value.includes(moneyForm.value.fromCurrency)) {
        moneyForm.value.fromCurrency = availableFromCurrencies.value[0]
      }
    }
  },
  { immediate: false },
)

watch(
  () => moneyForm.value.to,
  (newTo) => {
    if (!newTo) return

    const country = getCountryByCode(newTo)
    if (!country?.currency) return

    const defaultCurrency = country.currency.toUpperCase()

    if (availableToCurrencies.value.length > 0) {
      if (availableToCurrencies.value.includes(defaultCurrency)) {
        moneyForm.value.toCurrency = defaultCurrency
      }
      else if (!moneyForm.value.toCurrency || !availableToCurrencies.value.includes(moneyForm.value.toCurrency)) {
        moneyForm.value.toCurrency = availableToCurrencies.value[0]
      }
    }
  },
  { immediate: false },
)

watch(
  availableFromCurrencies,
  (currencies) => {
    if (!moneyForm.value.from || currencies.length === 0) return

    const country = getCountryByCode(moneyForm.value.from)
    if (!country?.currency) return

    const defaultCurrency = country.currency.toUpperCase()
    if (currencies.includes(defaultCurrency) && (!moneyForm.value.fromCurrency || !currencies.includes(moneyForm.value.fromCurrency))) {
      moneyForm.value.fromCurrency = defaultCurrency
    }
    else if (!moneyForm.value.fromCurrency || !currencies.includes(moneyForm.value.fromCurrency)) {
      moneyForm.value.fromCurrency = currencies[0]
    }
  },
  { immediate: false },
)

// Watch for currency changes to adjust amount limits
watch(
  () => [moneyForm.value.fromCurrency, amountLimits.value.minAmount, amountLimits.value.maxAmount],
  () => {
    const currentAmount = moneyForm.value.amount || 0
    const min = amountLimits.value.minAmount
    const max = amountLimits.value.maxAmount

    if (min !== null && currentAmount < min) {
      moneyForm.value.amount = min
      return
    }
    if (max !== null && currentAmount > max) {
      moneyForm.value.amount = max
    }
  },
)

watch(
  availableToCurrencies,
  (currencies) => {
    if (!moneyForm.value.to || currencies.length === 0) return

    const country = getCountryByCode(moneyForm.value.to)
    if (!country?.currency) return

    const defaultCurrency = country.currency.toUpperCase()
    if (currencies.includes(defaultCurrency) && (!moneyForm.value.toCurrency || !currencies.includes(moneyForm.value.toCurrency))) {
      moneyForm.value.toCurrency = defaultCurrency
    }
    else if (!moneyForm.value.toCurrency || !currencies.includes(moneyForm.value.toCurrency)) {
      moneyForm.value.toCurrency = currencies[0]
    }
  },
  { immediate: false },
)

defineExpose({
  prefillMoneyForm: (data: PrefillFormData) => {
    Object.assign(moneyForm.value, data)
  },
})

const mapPreserveAspectRatio = ref('xMidYMid slice')

useHead({
  link: [
    { rel: 'preload', as: 'image', href: '/world.webp', type: 'image/webp' },
  ],
})

const updateMapPreserveAspectRatio = () => {
  if (typeof window === 'undefined') return
  mapPreserveAspectRatio.value = window.matchMedia('(min-width: 640px)').matches
    ? 'xMidYMid slice'
    : 'xMidYMid meet'
}

const countryCoordinates: Record<string, LatLon> = {
  US: { lat: 37.1, lon: -95.7 },
  CA: { lat: 56.1, lon: -106.3 },
  MX: { lat: 23.6, lon: -102.5 },
  GB: { lat: 55.3, lon: -3.4 },
  IE: { lat: 53.3, lon: -8 },
  FR: { lat: 46.2, lon: 2.2 },
  DE: { lat: 51.2, lon: 10.4 },
  ES: { lat: 40.4, lon: -3.7 },
  PT: { lat: 39.4, lon: -8 },
  IT: { lat: 41.9, lon: 12.5 },
  PL: { lat: 51.9, lon: 19.1 },
  NL: { lat: 52.1, lon: 5.3 },
  BE: { lat: 50.5, lon: 4.7 },
  CH: { lat: 46.8, lon: 8.2 },
  TR: { lat: 39.1, lon: 35.2 },
  RU: { lat: 61.5, lon: 105.3 },
  IN: { lat: 20.6, lon: 78.9 },
  PK: { lat: 30.4, lon: 69.3 },
  BD: { lat: 23.7, lon: 90.4 },
  LK: { lat: 7.9, lon: 80.7 },
  NP: { lat: 28.4, lon: 84.1 },
  PH: { lat: 0.84, lon: 121.545 },
  MY: { lat: 4.2, lon: 101.9 },
  VN: { lat: 14.1, lon: 108.3 },
  TH: { lat: 15.8, lon: 101 },
  KH: { lat: 12.6, lon: 104.9 },
  ID: { lat: -0.8, lon: 113.9 },
  SG: { lat: 1.35, lon: 103.8 },
  CN: { lat: 35.8, lon: 104.2 },
  HK: { lat: 22.3, lon: 114.2 },
  JP: { lat: 36.2, lon: 138.3 },
  KR: { lat: 35.9, lon: 127.8 },
  TW: { lat: 23.7, lon: 121 },
  AE: { lat: 23.4, lon: 53.8 },
  SA: { lat: 23.9, lon: 45.1 },
  QA: { lat: 25.3, lon: 51.2 },
  KW: { lat: 29.3, lon: 47.5 },
  BH: { lat: 26.1, lon: 50.6 },
  OM: { lat: 21, lon: 55 },
  NG: { lat: 9.1, lon: 8.7 },
  GH: { lat: 7.9, lon: -1 },
  KE: { lat: -0.02, lon: 37.9 },
  TZ: { lat: -6.4, lon: 35 },
  ZA: { lat: -30.6, lon: 22.9 },
  MA: { lat: 31.8, lon: -7.1 },
  EG: { lat: 26.8, lon: 30.8 },
  SN: { lat: 14.5, lon: -14.5 },
  BR: { lat: -14.2, lon: -51.9 },
  AR: { lat: -38.4, lon: -63.6 },
  CL: { lat: -35.7, lon: -71.5 },
  CO: { lat: 4.6, lon: -74.3 },
  PE: { lat: -9.2, lon: -75 },
  VE: { lat: 6.4, lon: -66.6 },
  CU: { lat: 21.5, lon: -77.8 },
  AU: { lat: -51.97, lon: 128.907 },
  NZ: { lat: -40.9, lon: 174.9 },
}

const projectCoord = (lat: number, lon: number) => ({
  x: ((lon + 180) / 360) * 2000,
  y: ((90 - lat) / 180) * 857,
})

const buildArrowPath = (
  fromCode: string,
  toCode: string,
  nudges?: {
    start?: { x: number, y: number }
    end?: { x: number, y: number }
  },
) => {
  const from = countryCoordinates[fromCode]
  const to = countryCoordinates[toCode]
  if (!from || !to) return null

  const inset = 92

  const rawStart = projectCoord(from.lat, from.lon)
  const rawEnd = projectCoord(to.lat, to.lon)

  const startShift = nudges?.start ?? { x: 0, y: 0 }
  const endShift = nudges?.end ?? { x: 0, y: 0 }

  const start = {
    x: clamp(rawStart.x + startShift.x, inset, 2000 - inset),
    y: clamp(rawStart.y + startShift.y, inset, 857 - inset),
  }
  const end = {
    x: clamp(rawEnd.x + endShift.x, inset, 2000 - inset),
    y: clamp(rawEnd.y + endShift.y, inset, 857 - inset),
  }

  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy)

  let lift = clamp(distance * 0.35, 52, 280)
  let controlX = midX + clamp(dx * 0.12, -140, 140)
  let controlY = midY - lift

  const avoidBox = { x0: 640, x1: 1520, y0: 120, y1: 700 }
  const inBox = midX >= avoidBox.x0 && midX <= avoidBox.x1 && midY >= avoidBox.y0 && midY <= avoidBox.y1
  if (inBox) {
    const avoidStrength = clamp((distance - 360) / 560, 0, 1)
    if (avoidStrength > 0) {
      lift = clamp(lift + 110 * avoidStrength, 52, 360)
      controlX += (midX < 1080 ? -1 : 1) * 170 * avoidStrength
      controlY = midY - lift
    }
  }

  return {
    d: `M ${start.x.toFixed(1)},${start.y.toFixed(1)} Q ${controlX.toFixed(1)},${controlY.toFixed(1)} ${end.x.toFixed(1)},${end.y.toFixed(1)}`,
    start,
    end,
  }
}

const getRouteDuration = (
  start: { x: number, y: number },
  end: { x: number, y: number },
  options: { base: number, speed: number, min: number, max: number },
  jitterSeconds = 0,
) => {
  const distance = Math.hypot(end.x - start.x, end.y - start.y)
  const seconds = clamp(options.base + distance / options.speed + jitterSeconds, options.min, options.max)
  return `${seconds.toFixed(1)}s`
}

type DisplayRoute = {
  key: string
  d: string
  stroke: string
  strokeWidth: number
  opacity: number
  dur: string
  delay: string
}

const ROUTE_SPECS: Array<{
  from: keyof typeof countryCoordinates
  to: keyof typeof countryCoordinates
  stroke: string
  width: number
}> = [
  { from: 'US', to: 'PH', stroke: 'url(#route-blue)', width: 1.9 },
  { from: 'CA', to: 'BR', stroke: 'url(#route-emerald)', width: 1.7 },
  { from: 'MX', to: 'ES', stroke: 'url(#route-emerald)', width: 1.65 },
  { from: 'MX', to: 'CL', stroke: 'url(#route-blue)', width: 1.6 },
  { from: 'MX', to: 'AR', stroke: 'url(#route-violet)', width: 1.6 },
  { from: 'CU', to: 'CO', stroke: 'url(#route-emerald)', width: 1.55 },
  { from: 'CU', to: 'PE', stroke: 'url(#route-blue)', width: 1.55 },
  { from: 'CU', to: 'BR', stroke: 'url(#route-violet)', width: 1.5 },
  { from: 'AR', to: 'IT', stroke: 'url(#route-blue)', width: 1.65 },
  { from: 'GB', to: 'IN', stroke: 'url(#route-blue)', width: 1.7 },
  { from: 'DE', to: 'TR', stroke: 'url(#route-emerald)', width: 1.65 },
  { from: 'FR', to: 'MA', stroke: 'url(#route-violet)', width: 1.55 },
  { from: 'ZA', to: 'GB', stroke: 'url(#route-emerald)', width: 1.6 },
  { from: 'NG', to: 'FR', stroke: 'url(#route-blue)', width: 1.55 },
  { from: 'KE', to: 'GB', stroke: 'url(#route-violet)', width: 1.55 },
  { from: 'EG', to: 'IT', stroke: 'url(#route-emerald)', width: 1.55 },
  { from: 'AE', to: 'PK', stroke: 'url(#route-emerald)', width: 1.6 },
  { from: 'IN', to: 'BD', stroke: 'url(#route-emerald)', width: 1.55 },
  { from: 'CN', to: 'VN', stroke: 'url(#route-violet)', width: 1.55 },
  { from: 'US', to: 'AU', stroke: 'url(#route-blue)', width: 1.7 },
  { from: 'JP', to: 'PH', stroke: 'url(#route-blue)', width: 1.5 },
]

const endpointNudge = (
  idx: number,
  total: number,
  radius: number,
  phase = 0,
): { x: number, y: number } => {
  if (total <= 1) return { x: 0, y: 0 }
  const a = phase + (idx / total) * Math.PI * 2
  return { x: Math.cos(a) * radius, y: Math.sin(a) * radius }
}

const displayRoutes = computed<DisplayRoute[]>(() => {
  const durationOptions = { base: 1.9, speed: 240, min: 2.2, max: 7.2 }
  const delayStep = 0.38

  const endpointTotals = new Map<string, number>()
  for (const r of ROUTE_SPECS) {
    endpointTotals.set(r.from, (endpointTotals.get(r.from) ?? 0) + 1)
    endpointTotals.set(r.to, (endpointTotals.get(r.to) ?? 0) + 1)
  }
  const endpointSeen = new Map<string, number>()

  return ROUTE_SPECS
    .map((spec, i) => {
      const fromSeen = endpointSeen.get(spec.from) ?? 0
      endpointSeen.set(spec.from, fromSeen + 1)
      const toSeen = endpointSeen.get(spec.to) ?? 0
      endpointSeen.set(spec.to, toSeen + 1)

      const fromTotal = endpointTotals.get(spec.from) ?? 1
      const toTotal = endpointTotals.get(spec.to) ?? 1

      const start = endpointNudge(fromSeen, fromTotal, 12, 0.2)
      const end = endpointNudge(toSeen, toTotal, 12, 1.1)

      const path = buildArrowPath(spec.from, spec.to, { start, end })
      if (!path) return null

      return {
        key: `${spec.from}-${spec.to}-${i}`,
        d: path.d,
        stroke: spec.stroke,
        strokeWidth: spec.width,
        opacity: 0.28,
        dur: getRouteDuration(path.start, path.end, durationOptions, (i % 4) * 0.25),
        delay: `${(i * delayStep).toFixed(2)}s`,
      }
    })
    .filter(Boolean) as DisplayRoute[]
})

const activePath = computed(() => {
  const fromCode = moneyForm.value.from?.toUpperCase()
  const toCode = moneyForm.value.to?.toUpperCase()

  if (!fromCode || !toCode) return null
  return buildArrowPath(fromCode, toCode)
})

const activeRouteDur = computed(() => {
  const path = activePath.value
  if (!path) return '6.8s'
  return getRouteDuration(path.start, path.end, { base: 1.6, speed: 260, min: 2.0, max: 6.2 })
})

const detectUserLocation = async () => {
  try {
    const data = await request<{ countryCode?: string, country_code?: string }>('/geo')
    const rawCode = data.countryCode || data.country_code || ''
    if (rawCode) {
      const countryCode = rawCode.toUpperCase()
      const country = getCountryByCode(countryCode)

      if (country) {
        moneyForm.value.from = country.code
        moneyForm.value.fromCurrency = country.currency
      }
    }
  }
  catch {
    moneyForm.value.from = 'US'
    moneyForm.value.fromCurrency = 'USD'
  }
}

const handleAmountBlur = (event: Event) => {
  const target = event.target as HTMLInputElement
  const currency = moneyForm.value.fromCurrency || 'USD'

  // Sanitize amount based on currency limits
  const sanitized = sanitizeAmount(target.value, currency, amountLimits.value)
  moneyForm.value.amount = sanitized
  target.value = String(sanitized)
}

const sanitizeAmountInput = (event: Event) => {
  const target = event.target as HTMLInputElement

  // Check if all text is currently selected (user likely just pressed Cmd+A)
  const isAllSelected = target.selectionStart === 0 && target.selectionEnd === target.value.length && target.value.length > 0

  // Skip sanitization if user just selected all text - let them delete/replace it first
  if (isSelecting.value || isAllSelected) {
    // Don't reset isSelecting immediately - let it reset on next keydown
    // Still update the model value
    const numValue = Number.parseFloat(target.value)
    if (!isNaN(numValue) && numValue >= 0) {
      moneyForm.value.amount = numValue
    }
    return
  }

  // Preserve selection/cursor position
  const selectionStart = target.selectionStart ?? 0
  const selectionEnd = target.selectionEnd ?? 0
  const hadSelection = selectionStart !== selectionEnd

  let value = target.value

  // Remove any non-numeric characters except decimal point
  const originalValue = value
  value = value.replace(/[^\d.]/g, '')

  // Ensure only one decimal point
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }

  // Limit decimal places to 2
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2)
  }

  // Only update if value actually changed
  if (originalValue !== value) {
    const lengthDiff = value.length - originalValue.length

    // Calculate new cursor position
    let newCursorPos = selectionStart
    if (lengthDiff < 0) {
      // Characters were removed, cursor might need adjustment
      const removedBeforeCursor = originalValue.slice(0, selectionStart).replace(/[^\d.]/g, '').length
      const validCharsBeforeCursor = value.slice(0, removedBeforeCursor).length
      newCursorPos = Math.max(0, Math.min(validCharsBeforeCursor, value.length))
    }
    else {
      newCursorPos = Math.max(0, Math.min(selectionStart + lengthDiff, value.length))
    }

    target.value = value

    // Restore selection or cursor position
    nextTick(() => {
      if (hadSelection && !isSelecting.value) {
        // Try to preserve selection if it existed (but not if we just selected all)
        const endPos = Math.max(newCursorPos, Math.min(selectionEnd + lengthDiff, value.length))
        target.setSelectionRange(newCursorPos, endPos)
      }
      else if (!isSelecting.value) {
        target.setSelectionRange(newCursorPos, newCursorPos)
      }
    })
  }

  // Update the model value (but don't clamp on input, only on blur)
  const numValue = Number.parseFloat(value || target.value)
  if (!isNaN(numValue) && numValue >= 0) {
    moneyForm.value.amount = numValue
  }
  else if (value === '' || target.value === '') {
    moneyForm.value.amount = 0
  }
}

const isSelecting = ref(false)

const handleAmountKeydown = (event: KeyboardEvent) => {
  // Check if user is selecting all text (Cmd+A or Ctrl+A)
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
    isSelecting.value = true
    // Allow default behavior (select all)
    return
  }

  // Check for other selection shortcuts (Cmd+C, Cmd+V, Cmd+X, etc.)
  if ((event.metaKey || event.ctrlKey) && ['c', 'v', 'x', 'a'].includes(event.key.toLowerCase())) {
    // Allow these shortcuts, don't interfere
    return
  }

  // Only prevent specific problematic keys
  if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
    event.preventDefault()
  }
  else {
    isSelecting.value = false
  }
}

const handleMoneySubmit = async () => {
  const { from, to, amount, method } = moneyForm.value

  formSuccess.value = ''
  formError.value = ''
  isSubmitting.value = true

  try {
    // Validate form
    if (!from || !to) {
      formError.value = 'Please select both sending and receiving countries.'
      isSubmitting.value = false
      return
    }

    // Sanitize and validate amount using currency-based limits
    const currency = moneyForm.value.fromCurrency || 'USD'
    const sanitizedAmount = sanitizeAmount(amount, currency, amountLimits.value)

    if (!isValidAmount(sanitizedAmount, currency, amountLimits.value)) {
      const min = amountLimits.value.minAmount
      const max = amountLimits.value.maxAmount
      if (min !== null && max !== null) {
        formError.value = `Please enter a valid amount between ${formatCurrency(min, currency)} and ${formatCurrency(max, currency)}.`
      }
      else if (min !== null) {
        formError.value = `Please enter an amount of at least ${formatCurrency(min, currency)}.`
      }
      else {
        formError.value = 'Please enter a valid amount.'
      }
      moneyForm.value.amount = sanitizedAmount
      isSubmitting.value = false
      return
    }

    // Ensure amount is within valid range
    moneyForm.value.amount = sanitizedAmount

    void recordSearch({
      from,
      to,
      amount: sanitizedAmount,
      method: method || 'bank',
    })

    // Submit form and navigate
    const success = await submitForm()
    if (!success) {
      if (validationError.value) {
        formError.value = validationError.value
      }
      isSubmitting.value = false
    }
    // Note: isSubmitting will be reset by navigation if successful
  }
  catch {
    formError.value = 'An error occurred. Please try again.'
    isSubmitting.value = false
  }
}

onMounted(() => {
  detectUserLocation()
  updateMapPreserveAspectRatio()

  const mediaQuery = window.matchMedia('(min-width: 640px)')
  const onMediaQueryChange = () => updateMapPreserveAspectRatio()
  mediaQuery.addEventListener('change', onMediaQueryChange)

  onBeforeUnmount(() => {
    mediaQuery.removeEventListener('change', onMediaQueryChange)
  })
})
</script>

<style scoped>
.hero-map__image {
  opacity: 0.5;
  filter: brightness(0.97) contrast(1.12);
}

.route-line {
  fill: none;
  vector-effect: non-scaling-stroke;
  stroke-linecap: butt;
  stroke-linejoin: round;
  stroke-dasharray: 0.28 0.72;
  stroke-dashoffset: 1;
  opacity: 0;
  animation: routeFadeIn 0.8s ease-out forwards, routeFlow var(--route-dur, 14s) linear infinite;
  animation-delay: var(--route-delay, 0s), calc(var(--route-delay, 0s) + 0.8s);
}

.route-line--active {
  opacity: 0;
  animation: routeFadeInActive 0.8s ease-out forwards, routeFlowActive var(--route-dur, 14s) linear infinite;
  animation-delay: var(--route-delay, 0s), calc(var(--route-delay, 0s) + 0.8s);
}

.route-line--active {
  stroke-dasharray: 0.24 0.76;
}

@keyframes routeFlow {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes routeFlowActive {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes routeFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: var(--target-opacity, 0.28);
  }
}

@keyframes routeFadeInActive {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.32;
  }
}

@media (prefers-reduced-motion: reduce) {
  .route-line {
    animation: none;
  }
}
</style>
