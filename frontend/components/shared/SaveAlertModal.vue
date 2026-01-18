<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen && context"
        class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-alert-title"
        @click.self="close"
      >
        <div
          ref="modalContent"
          class="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
          tabindex="-1"
          @keydown.esc="close"
        >
          <button
            class="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            aria-label="Close modal"
            @click="close"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2
            id="save-alert-title"
            class="text-2xl font-bold text-neutral-900"
          >
            {{ isEditing ? 'Edit alert' : 'Set an alert' }}
          </h2>
          <p class="mt-2 text-sm text-blue-600">
            This also saves the item to your watchlist.
          </p>

          <div class="mt-6 space-y-4">
            <!-- Corridor Selector -->
            <div v-if="showCorridorSelector">
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Corridor
              </label>
              <div class="flex items-center gap-2">
                <div class="flex-1">
                  <CountrySelect
                    id="corridor-from"
                    v-model="corridorFrom"
                    label="From country"
                    :exclude-country="corridorTo"
                    placeholder="Type to search..."
                  />
                </div>
                <div class="flex items-center text-slate-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div class="flex-1">
                  <CountrySelect
                    id="corridor-to"
                    v-model="corridorTo"
                    label="To country"
                    :exclude-country="corridorFrom"
                    placeholder="Type to search..."
                  />
                </div>
              </div>
              <!-- Current Rate Preview -->
              <div v-if="ratePairAvailable" class="mt-2 flex items-center justify-between text-sm">
                <span class="text-blue-600">Current rate:</span>
                <span class="font-medium text-blue-700">1 {{ ratePairBase }} = {{ currentRateLabel }} {{ ratePairQuote }}</span>
              </div>
            </div>

            <div v-else>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Target
              </label>
              <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div class="text-sm font-semibold text-slate-900">{{ targetLabel }}</div>
                <div v-if="ratePairAvailable" class="mt-1 text-xs text-slate-600">
                  1 {{ ratePairBase }} = {{ currentRateLabel }} {{ ratePairQuote }}
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Metric
              </label>
              <UniversalDropdown
                v-model="metric"
                :options="metricOptions"
                placeholder="Select metric"
                button-class="h-11"
              >
                <template #selected="{ option }">
                  <div v-if="option?.value === 'sendScore'" class="flex items-center gap-2 w-full">
                    <svg class="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span class="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                      {{ option?.label }}
                    </span>
                    <span
                      v-if="option?.locked"
                      class="inline-flex items-center gap-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-semibold text-slate-600 ml-auto"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11V7a4 4 0 118 0v4m-4 4h-4a2 2 0 01-2-2v-2a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2h-4" />
                      </svg>
                      Locked
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-1.5 py-0.5 text-xs font-bold text-white ml-auto"
                    >
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Plus
                    </span>
                  </div>
                  <span v-else>{{ option?.label || 'Select metric' }}</span>
                </template>
                <template #option="{ option }">
                  <div v-if="option.value === 'sendScore'" class="flex items-center gap-2 w-full">
                    <div class="flex items-center gap-2 flex-1">
                      <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span class="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                        {{ option.label }}
                      </span>
                    </div>
                    <span
                      v-if="option.locked"
                      class="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11V7a4 4 0 118 0v4m-4 4h-4a2 2 0 01-2-2v-2a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2h-4" />
                      </svg>
                      Locked
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-2 py-0.5 text-xs font-bold text-white"
                    >
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Plus
                    </span>
                  </div>
                  <span v-else>{{ option.label }}</span>
                </template>
              </UniversalDropdown>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Condition
                </label>
                <UniversalDropdown
                  v-model="comparator"
                  :options="comparatorOptions"
                  placeholder="Select condition"
                  button-class="h-11"
                  :disabled="formLocked"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Value
                </label>
                <input
                  v-model.number="value"
                  type="number"
                  :step="valueStep"
                  :min="valueMin"
                  :max="valueMax"
                  :disabled="formLocked"
                  class="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
              </div>

              <div v-if="showCurrency">
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Currency
                </label>
                <UniversalDropdown
                  v-model="currency"
                  :options="currencyOptions"
                  placeholder="Select currency"
                  button-class="h-11"
                  :disabled="formLocked"
                />
              </div>
              <div v-else>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Currency
                </label>
                <div
                  class="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 flex items-center"
                >
                  Not required
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Frequency
              </label>
              <UniversalDropdown
                v-model="frequency"
                :options="frequencyOptions"
                placeholder="Select frequency"
                button-class="h-11"
                :disabled="formLocked"
              />
              <p class="mt-2 text-xs text-slate-500">
                Free plans are weekly. Plus unlocks daily alerts.
              </p>
            </div>

            <div
              v-if="error"
              class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {{ error }}
            </div>

            <div
              v-if="limitState"
              class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-semibold text-slate-800">{{ limitTitle }}</span>
                <span class="text-xs text-slate-500">{{ limitCount }}/{{ limitState.limit }}</span>
              </div>
              <div v-if="limitItems.length" class="mb-3 rounded-lg border border-slate-200 bg-white max-h-40 overflow-y-auto">
                <div
                  v-for="item in limitItems"
                  :key="item.id"
                  class="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0"
                >
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-slate-800 truncate">
                      {{ item.label }}
                    </div>
                    <div v-if="item.meta" class="text-xs text-slate-500 truncate">
                      {{ item.meta }}
                    </div>
                  </div>
                  <button
                    type="button"
                    class="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    @click="handleLimitRemove(item.id)"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div class="flex flex-col gap-2 sm:flex-row">
                <button
                  v-if="!isPlus"
                  type="button"
                  class="h-10 flex-1 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
                  @click="handleUpgrade"
                >
                  Upgrade to Plus
                </button>
                <button
                  type="button"
                  class="h-10 flex-1 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
                  @click="handleManage"
                >
                  {{ manageLabel }}
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              @click="close"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="formLocked"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
              @click="save"
            >
              {{ isEditing ? 'Update alert' : 'Create alert' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <SuccessToast
    ref="successToastRef"
    :title="toastTitle"
    :message="toastMessage"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { AlertComparator, AlertFrequency, AlertRule, WatchTarget } from '~/types/tracking'
import type { Method } from '~/types/remit'
import UniversalDropdown from '~/components/shared/UniversalDropdown.vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import SuccessToast from '~/components/shared/SuccessToast.vue'
import { COUNTRIES, getCountryByCode, getCurrencyDisplay } from '~/utils/countries-currencies'
import { useCorridorCurrencies } from '~/composables/useCorridorCurrencies'

const { isOpen, context, close: closeModal } = useSaveAlertModal()
const alerts = useAlerts()
const watchlist = useWatchlist()
const { isPlus } = useEntitlements()
const { request } = useApi()
const route = useRoute()

// Close modal on route change
watch(() => route.fullPath, () => {
  if (isOpen.value) {
    closeModal()
  }
})

const modalContent = ref<HTMLElement | null>(null)
const error = ref<string>('')
const initializing = ref(false)
const successToastRef = ref<{ show: () => void; hide: () => void } | null>(null)
const toastTitle = ref('')
const toastMessage = ref('')
const limitState = ref<{ feature: 'watchlist' | 'alert'; limit: number } | null>(null)

const metric = ref<AlertRule['metric']>('rate')
const comparator = ref<AlertComparator>('gte')
const value = ref<number>(0)
const frequency = ref<AlertFrequency>('weekly')
const currency = ref<string>('')

const targetType = computed(() => context.value?.target?.type ?? 'corridor')
const showCorridorSelector = computed(() => targetType.value === 'corridor')

// Corridor selection
const corridorFrom = ref('US')
const corridorTo = ref('PH')
const corridorMethod = ref<Method>('bank')

const sortedCountries = computed(() => (
  [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name))
))

const fromDropdownOptions = computed(() => {
  return sortedCountries.value.map(country => ({
    label: `${country.flag} ${country.code} - ${country.name}`,
    value: country.code,
  }))
})

const toDropdownOptions = computed(() => {
  return sortedCountries.value.map(country => ({
    label: `${country.flag} ${country.code} - ${country.name}`,
    value: country.code,
  }))
})

const { availableFromCurrencies, availableToCurrencies } = useCorridorCurrencies(
  corridorFrom,
  corridorTo,
)

const corridorFromCurrency = computed(() => {
  const preferred = getCountryByCode(corridorFrom.value)?.currency?.toUpperCase() || ''
  if (preferred && availableFromCurrencies.value.includes(preferred)) {
    return preferred
  }
  return availableFromCurrencies.value[0] || preferred
})

const corridorToCurrency = computed(() => {
  const preferred = getCountryByCode(corridorTo.value)?.currency?.toUpperCase() || ''
  if (preferred && availableToCurrencies.value.includes(preferred)) {
    return preferred
  }
  return availableToCurrencies.value[0] || preferred
})

const target = computed<WatchTarget>(() => {
  const ctxTarget = context.value?.target
  if (!ctxTarget || ctxTarget.type === 'corridor') {
    return {
      type: 'corridor',
      from: corridorFrom.value,
      to: corridorTo.value,
      method: corridorMethod.value,
    }
  }
  return ctxTarget
})

const targetLabel = computed(() => {
  switch (target.value.type) {
    case 'corridor':
      return `${target.value.from} → ${target.value.to}${target.value.method ? ` • ${target.value.method}` : ''}`
    case 'fxPair':
      return `${target.value.base}/${target.value.quote}`
    case 'pulseChart':
      return `Pulse chart ${target.value.chartId}`
    case 'guide':
      return `Guide: ${target.value.slug}`
  }
})

const contextLabel = computed(() => context.value?.label || targetLabel.value)

const ratePairBase = computed(() => {
  if (target.value.type === 'fxPair') return target.value.base
  if (target.value.type === 'corridor') return corridorFromCurrency.value
  return ''
})

const ratePairQuote = computed(() => {
  if (target.value.type === 'fxPair') return target.value.quote
  if (target.value.type === 'corridor') return corridorToCurrency.value
  return ''
})

const ratePairAvailable = computed(() => {
  return !!ratePairBase.value && !!ratePairQuote.value && ratePairBase.value !== ratePairQuote.value
})

const currentRateValue = ref<number | null>(null)
const currentRateLabel = computed(() => {
  if (currentRateValue.value === null) return '—'
  return currentRateValue.value.toFixed(4)
})

const loadCurrentRate = async () => {
  if (!ratePairAvailable.value || !isOpen.value || import.meta.server) {
    currentRateValue.value = null
    return
  }
  try {
    const data = await request<{ rate?: number }>('/rates/spot', {
      query: { base: ratePairBase.value, quote: ratePairQuote.value },
      timeoutMs: 5000,
      retries: 0,
    })
    currentRateValue.value = typeof data?.rate === 'number' ? data.rate : null
  } catch {
    currentRateValue.value = null
  }
}

watch([isOpen, ratePairBase, ratePairQuote], () => {
  void loadCurrentRate()
})

const metricOptions = computed(() => {
  const options = []
  switch (target.value.type) {
    case 'corridor':
      options.push(
        { value: 'recipientGets' as const, label: 'Recipient gets' },
        { value: 'totalCost' as const, label: 'Total cost' },
        { value: 'fee' as const, label: 'Fee' },
      )
      options.push({
        value: 'sendScore' as const,
        label: 'Intelligent Alert',
        disabled: !isPlus.value,
        locked: !isPlus.value,
      })
      break
    case 'fxPair':
      options.push({ value: 'rate' as const, label: 'FX rate' })
      break
    case 'pulseChart':
      options.push({ value: 'index' as const, label: 'Index' })
      break
    case 'guide':
      options.push({ value: 'index' as const, label: 'Index' })
      break
    default:
      options.push({ value: 'rate' as const, label: 'Rate' })
  }
  return options
})

const firstEnabledMetric = computed<AlertRule['metric']>(() => {
  for (const option of metricOptions.value) {
    if (typeof option === 'string') return option as AlertRule['metric']
    if (!option.disabled) return option.value as AlertRule['metric']
  }
  return 'rate'
})

const metricReady = computed(() => {
  if (!metric.value) return false
  return metricOptions.value.some((option) => {
    const optionValue = typeof option === 'string' ? option : option.value
    return optionValue === metric.value
  })
})

const comparatorOptions = computed(() => [
  { value: 'gte' as const, label: '≥' },
  { value: 'lte' as const, label: '≤' },
  { value: 'gt' as const, label: '>' },
  { value: 'lt' as const, label: '<' },
])

const currencyOptions = computed(() => {
  if (target.value.type === 'corridor') {
    const values = Array.from(new Set([
      ...availableFromCurrencies.value,
      ...availableToCurrencies.value,
    ].map(code => code.toUpperCase()).filter(Boolean)))
    return values.map(code => ({
      value: code,
      label: code,
    }))
  }
  if (target.value.type === 'fxPair') {
    const values = [target.value.base, target.value.quote].filter(Boolean)
    return values.map(code => ({
      value: code,
      label: code,
    }))
  }
  return []
})

const frequencyOptions = computed(() => {
  const isSmart = metric.value === 'sendScore'
  return [
    { value: 'weekly' as const, label: 'Weekly' },
    { value: 'daily' as const, label: 'Daily', disabled: !isPlus.value || isSmart },
  ]
})

const limitTitle = computed(() => {
  if (!limitState.value) return ''
  return limitState.value.feature === 'watchlist' ? 'Watchlist limit reached' : 'Alert limit reached'
})

const limitCount = computed(() => {
  if (!limitState.value) return 0
  return limitState.value.feature === 'watchlist'
    ? watchlist.count.value
    : alerts.count.value
})

const manageLabel = computed(() => {
  if (!limitState.value) return ''
  return limitState.value.feature === 'watchlist' ? 'Manage watchlist' : 'Manage alerts'
})

const managePath = computed(() => {
  if (!limitState.value) return ''
  return limitState.value.feature === 'watchlist'
    ? '/dashboard?tab=watchlist'
    : '/dashboard?tab=alerts'
})

const limitMetricLabels: Record<string, string> = {
  recipientGets: 'Recipient gets',
  totalCost: 'Total cost',
  fee: 'Fee',
  midMarketRate: 'Mid-market rate',
  rate: 'Rate',
  sendScore: 'Intelligent alert',
  index: 'Index',
}

const limitComparatorLabels: Record<string, string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  crosses_above: 'crosses above',
  crosses_below: 'crosses below',
}

const formatLimitAlertValue = (metric: string, threshold: number) => {
  if (!Number.isFinite(threshold)) return '—'
  if (metric === 'sendScore') return Math.round(threshold).toString()
  if (metric === 'rate' || metric === 'midMarketRate') return threshold.toFixed(4)
  return threshold.toFixed(2)
}

const limitItems = computed(() => {
  if (!limitState.value) return []
  const limit = limitState.value.limit
  if (limitState.value.feature === 'alert') {
    const items = alerts.alerts.value.map((alert) => {
      const label = watchlist.findById(alert.watchlistItemId)?.label || 'Alert'
      const metricLabel = limitMetricLabels[alert.rule.metric] || 'Alert'
      const comparatorLabel = limitComparatorLabels[alert.rule.comparator] || alert.rule.comparator
      const valueLabel = formatLimitAlertValue(alert.rule.metric, alert.rule.value)
      const currencyLabel = alert.rule.currency ? ` ${alert.rule.currency}` : ''
      return {
        id: alert.id,
        label,
        meta: `${metricLabel} ${comparatorLabel} ${valueLabel}${currencyLabel}`.trim(),
      }
    })
    return limit > 0 ? items.slice(0, limit) : items
  }

  const items = watchlist.items.value.map(item => ({
    id: item.id,
    label: item.label,
  }))
  return limit > 0 ? items.slice(0, limit) : items
})

const handleLimitRemove = async (id: string) => {
  if (!limitState.value) return
  if (limitState.value.feature === 'watchlist') {
    await watchlist.remove(id)
  } else {
    await alerts.remove(id)
  }

  if (limitState.value.limit > 0 && limitCount.value < limitState.value.limit) {
    limitState.value = null
  }
}

const isSmartMetric = computed(() => metric.value === 'sendScore')
const showCurrency = computed(() => target.value.type === 'corridor' && !isSmartMetric.value)
const valueStep = computed(() => (isSmartMetric.value ? 1 : 0.01))
const valueMin = computed(() => (isSmartMetric.value ? 0 : undefined))
const valueMax = computed(() => (isSmartMetric.value ? 100 : undefined))
const formLocked = computed(() => !metricReady.value)

const defaultValueForMetric = (metricValue: AlertRule['metric']) => {
  if (metricValue === 'sendScore') return 90
  if (metricValue === 'rate' || metricValue === 'midMarketRate') {
    return currentRateValue.value ?? 0
  }
  return 0
}

const defaultCurrencyForMetric = (metricValue: AlertRule['metric']) => {
  if (target.value.type !== 'corridor') return ''
  if (metricValue === 'totalCost' || metricValue === 'fee') return corridorFromCurrency.value
  return corridorToCurrency.value
}

function close() {
  closeModal()
}

async function handleUpgrade() {
  await navigateTo('/plus')
  close()
}

async function handleManage() {
  if (!managePath.value) {
    close()
    return
  }
  await navigateTo(managePath.value)
  close()
}

const isEditing = computed(() => !!context.value?.alertId)
const shouldDefaultToSmartAlert = computed(() => (
  context.value?.source === 'alerts'
  && isPlus.value
  && target.value.type === 'corridor'
))

async function save() {
  error.value = ''
  limitState.value = null

  if (isEditing.value && context.value?.alertId) {
    await alerts.update(context.value.alertId, {
      frequency: frequency.value,
      rule: {
        metric: metric.value,
        comparator: comparator.value,
        value: value.value,
        currency: currency.value || undefined,
      },
    })
    close()
    toastTitle.value = 'Alert updated'
    toastMessage.value = `${contextLabel.value} updated`
    successToastRef.value?.show()
    return
  }

  const res = await alerts.createForTarget(target.value, {
    label: contextLabel.value,
    frequency: frequency.value,
    enabled: true,
    rule: {
      metric: metric.value,
      comparator: comparator.value,
      value: value.value,
      currency: currency.value || undefined,
    },
  })

  if (res.status === 'watchlist_limit_reached') {
    limitState.value = { feature: 'watchlist', limit: res.limit }
    error.value = res.message
    return
  }

  if (res.status === 'alert_limit_reached') {
    limitState.value = { feature: 'alert', limit: res.limit }
    error.value = res.message
    return
  }

  if (res.status === 'error') {
    limitState.value = null
    error.value = res.message
    return
  }

  close()
  limitState.value = null
  if (res.status === 'created') {
    toastTitle.value = 'Rate alert created!'
    toastMessage.value = `We'll notify you about ${contextLabel.value}`
    successToastRef.value?.show()
  } else if (res.status === 'already_exists') {
    toastTitle.value = 'Alert exists'
    toastMessage.value = 'You already have an alert for this item'
    successToastRef.value?.show()
  }
}

const syncCurrency = () => {
  if (!showCurrency.value) {
    currency.value = ''
    return
  }
  const options = currencyOptions.value.map(option => option.value)
  if (!options.length) {
    currency.value = ''
    return
  }
  if (!options.includes(currency.value)) {
    currency.value = defaultCurrencyForMetric(metric.value) || options[0]
  }
}

watch(
  () => isOpen.value,
  async (open) => {
    if (!open) {
      error.value = ''
      limitState.value = null
      document.body.style.overflow = ''
      return
    }

    initializing.value = true

    if (context.value?.target?.type === 'corridor') {
      corridorFrom.value = context.value.target.from
      corridorTo.value = context.value.target.to
      corridorMethod.value = (context.value.target.method as Method) || 'bank'
    }

    if (context.value?.alertId) {
      const existingAlert = alerts.findById(context.value.alertId)
      if (existingAlert) {
        metric.value = existingAlert.rule.metric
        comparator.value = existingAlert.rule.comparator
        value.value = existingAlert.rule.value
        frequency.value = existingAlert.frequency
        currency.value = existingAlert.rule.currency || defaultCurrencyForMetric(existingAlert.rule.metric)
      }
    } else {
      const defaultMetric = shouldDefaultToSmartAlert.value
        ? 'sendScore'
        : firstEnabledMetric.value
      metric.value = defaultMetric
      comparator.value = 'gte'
      value.value = defaultValueForMetric(metric.value)
      frequency.value = isPlus.value && defaultMetric !== 'sendScore' ? 'daily' : 'weekly'
      currency.value = showCurrency.value ? defaultCurrencyForMetric(metric.value) : ''
    }

    await nextTick()
    syncCurrency()
    modalContent.value?.focus()
    document.body.style.overflow = 'hidden'
    initializing.value = false
  },
)

watch([corridorFrom, corridorTo], () => {
  if (initializing.value) return
  syncCurrency()
})

watch(currencyOptions, () => {
  if (initializing.value) return
  syncCurrency()
})

watch(currentRateValue, (rate) => {
  if (initializing.value || isEditing.value) return
  if (metric.value === 'rate' && rate !== null) {
    value.value = rate
  }
})

watch(metric, (nextMetric) => {
  if (initializing.value) return
  if (nextMetric === 'sendScore' && !isPlus.value) {
    error.value = 'Smart alerts are available on Plus plans.'
    metric.value = firstEnabledMetric.value
    return
  }
  value.value = defaultValueForMetric(nextMetric)
  if (nextMetric === 'sendScore') {
    currency.value = ''
    frequency.value = 'weekly'
    return
  }
  syncCurrency()
})

watch([isPlus, metric, frequency], ([plus, nextMetric, nextFrequency]) => {
  if (nextMetric === 'sendScore' && nextFrequency !== 'weekly') {
    frequency.value = 'weekly'
    return
  }
  if (!plus && nextFrequency === 'daily') {
    frequency.value = 'weekly'
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
