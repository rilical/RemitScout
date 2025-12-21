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
          class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
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
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Corridor
              </label>
              <div class="flex items-center gap-2">
                <div class="flex-1">
                  <UniversalDropdown
                    v-model="corridorFrom"
                    :options="fromDropdownOptions"
                    placeholder="Select country"
                  />
                </div>
                <div class="flex items-center text-slate-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div class="flex-1">
                  <UniversalDropdown
                    v-model="corridorTo"
                    :options="toDropdownOptions"
                    placeholder="Select country"
                  />
                </div>
              </div>
              <!-- Current Rate Preview -->
              <div class="mt-2 flex items-center justify-between text-sm">
                <span class="text-blue-600">Current rate:</span>
                <span class="font-medium text-blue-700">1 {{ corridorFrom }} = {{ currentRate }} {{ corridorTo }}</span>
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
              />
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
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Value
                </label>
                <input
                  v-model.number="value"
                  type="number"
                  step="0.01"
                  class="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Currency
                </label>
                <UniversalDropdown
                  v-model="currency"
                  :options="currencyOptions"
                  placeholder="Select currency"
                />
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
              />
              <p class="mt-2 text-xs text-slate-500">
                Frequency gating (Plus) can be enforced later via entitlements.
              </p>
            </div>

            <div
              v-if="error"
              class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {{ error }}
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
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              @click="save"
            >
              {{ isEditing ? 'Update alert' : 'Create alert' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { AlertComparator, AlertFrequency, AlertRule, WatchTarget } from '~/types/tracking'
import UniversalDropdown from '~/components/shared/UniversalDropdown.vue'

const { isOpen, context, close: closeModal } = useSaveAlertModal()
const alerts = useAlerts()
const route = useRoute()

// Close modal on route change
watch(() => route.fullPath, () => {
  if (isOpen.value) {
    closeModal()
  }
})

const modalContent = ref<HTMLElement | null>(null)
const error = ref<string>('')

const metric = ref<AlertRule['metric']>('rate')
const comparator = ref<AlertComparator>('gte')
const value = ref<number>(0)
const frequency = ref<AlertFrequency>('daily')
const currency = ref<string>('')

// Corridor selection
const corridorFrom = ref('US')
const corridorTo = ref('PH')

const fromCountries = [
  { code: 'US', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'GB', name: 'British Pound', flag: '🇬🇧' },
  { code: 'EU', name: 'Euro', flag: '🇪🇺' },
  { code: 'CA', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AU', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'AE', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore Dollar', flag: '🇸🇬' },
]

const toCountries = [
  { code: 'PH', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'MX', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'IN', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistani Rupee', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'NG', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'VN', name: 'Vietnamese Dong', flag: '🇻🇳' },
  { code: 'ID', name: 'Indonesian Rupiah', flag: '🇮🇩' },
]

const rateMap: Record<string, string> = {
  'US-PH': '56.82',
  'US-MX': '17.24',
  'US-IN': '83.12',
  'US-PK': '278.50',
  'US-BD': '109.75',
  'US-NG': '1550.00',
  'US-VN': '24850.00',
  'US-ID': '15750.00',
  'GB-PH': '72.15',
  'GB-IN': '105.42',
  'GB-PK': '354.21',
  'EU-PH': '61.45',
  'CA-PH': '41.23',
  'AU-PH': '37.15',
  'AE-PH': '15.48',
  'SG-PH': '42.35',
}

const currentRate = computed(() => {
  const key = `${corridorFrom.value}-${corridorTo.value}`
  return rateMap[key] || '1.00'
})

// Build target from corridor selection
const target = computed<WatchTarget>(() => ({
  type: 'corridor',
  from: corridorFrom.value,
  to: corridorTo.value,
  method: 'bank',
}))

const contextLabel = computed(() => `${corridorFrom.value} → ${corridorTo.value}`)

const fromDropdownOptions = computed(() => {
  return fromCountries.map(c => ({
    label: `${c.flag} ${c.code} - ${c.name}`,
    value: c.code,
  }))
})

const toDropdownOptions = computed(() => {
  return toCountries.map(c => ({
    label: `${c.flag} ${c.code} - ${c.name}`,
    value: c.code,
  }))
})

const metricOptions = computed(() => {
  const options = []
  switch (target.value?.type) {
    case 'corridor':
      options.push(
        { value: 'recipientGets' as const, label: 'Recipient gets' },
        { value: 'totalCost' as const, label: 'Total cost' },
        { value: 'fee' as const, label: 'Fee' },
      )
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

const comparatorOptions = computed(() => [
  { value: 'gte' as const, label: '≥' },
  { value: 'lte' as const, label: '≤' },
  { value: 'gt' as const, label: '>' },
  { value: 'lt' as const, label: '<' },
])

const currencyOptions = computed(() => [
  { value: corridorFrom.value, label: corridorFrom.value },
  { value: corridorTo.value, label: corridorTo.value },
])

const frequencyOptions = computed(() => [
  { value: 'daily' as const, label: 'Daily' },
  { value: 'hourly' as const, label: 'Hourly' },
  { value: 'realtime' as const, label: 'Real-time' },
])

function close() {
  closeModal()
}

const isEditing = computed(() => !!context.value?.alertId)

async function save() {
  error.value = ''

  if (isEditing.value && context.value?.alertId) {
    alerts.update(context.value.alertId, {
      frequency: frequency.value,
      rule: {
        metric: metric.value,
        comparator: comparator.value,
        value: value.value,
        currency: currency.value || undefined,
      },
    })
    close()
    return
  }

  const res = alerts.createForTarget(target.value, {
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

  if (res.status === 'watchlist_limit_reached' || res.status === 'alert_limit_reached') {
    error.value = res.message
    return
  }

  close()
}

watch(
  () => isOpen.value,
  async (open) => {
    if (!open) {
      error.value = ''
      document.body.style.overflow = ''
      return
    }

    // Set corridor from context if available
    if (context.value?.target?.type === 'corridor') {
      corridorFrom.value = context.value.target.from
      corridorTo.value = context.value.target.to
    }

    // If editing, populate form with existing alert data
    if (context.value?.alertId) {
      const existingAlert = alerts.findById(context.value.alertId)
      if (existingAlert) {
        metric.value = existingAlert.rule.metric
        comparator.value = existingAlert.rule.comparator
        value.value = existingAlert.rule.value
        frequency.value = existingAlert.frequency
        currency.value = existingAlert.rule.currency || corridorTo.value
      }
    } else {
      // Set reasonable defaults for new alerts
      metric.value = metricOptions.value[0]?.value ?? 'rate'
      comparator.value = 'gte'
      value.value = parseFloat(currentRate.value) || 0
      frequency.value = 'daily'
      currency.value = corridorTo.value
    }

    await nextTick()
    modalContent.value?.focus()
    document.body.style.overflow = 'hidden'
  },
)

// Update currency when corridor changes
watch(corridorTo, (newTo) => {
  currency.value = newTo
})

// Update suggested value when corridor changes
watch([corridorFrom, corridorTo], () => {
  value.value = parseFloat(currentRate.value) || 0
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
