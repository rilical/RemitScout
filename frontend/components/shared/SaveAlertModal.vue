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
          class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
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
            Set an alert
          </h2>
          <p class="mt-2 text-sm text-neutral-600">
            {{ contextLabel }}
            <span class="text-neutral-400">•</span>
            This also saves the item to your watchlist.
          </p>

          <div class="mt-6 space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Metric
              </label>
              <select
                v-model="metric"
                class="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option
                  v-for="opt in metricOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Condition
                </label>
                <select
                  v-model="comparator"
                  class="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="gte">
                    ≥
                  </option>
                  <option value="lte">
                    ≤
                  </option>
                  <option value="gt">
                    &gt;
                  </option>
                  <option value="lt">
                    &lt;
                  </option>
                </select>
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
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Frequency
              </label>
              <select
                v-model="frequency"
                class="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="daily">
                  Daily
                </option>
                <option value="hourly">
                  Hourly
                </option>
                <option value="realtime">
                  Real-time
                </option>
              </select>
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
              @click="create"
            >
              Create alert
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

const target = computed<WatchTarget | null>(() => context.value?.target ?? null)
const contextLabel = computed(() => context.value?.label ?? 'Alert settings')

const metricOptions = computed(() => {
  switch (target.value?.type) {
    case 'corridor':
      return [
        { value: 'recipientGets' as const, label: 'Recipient gets' },
        { value: 'totalCost' as const, label: 'Total cost' },
        { value: 'fee' as const, label: 'Fee' },
      ]
    case 'fxPair':
      return [{ value: 'rate' as const, label: 'FX rate' }]
    case 'pulseChart':
      return [{ value: 'index' as const, label: 'Index' }]
    case 'guide':
      return [{ value: 'index' as const, label: 'Index' }]
    default:
      return [{ value: 'rate' as const, label: 'Rate' }]
  }
})

function close() {
  closeModal()
}

async function create() {
  error.value = ''
  if (!target.value) return

  const res = alerts.createForTarget(target.value, {
    label: context.value?.label,
    frequency: frequency.value,
    enabled: true,
    rule: {
      metric: metric.value,
      comparator: comparator.value,
      value: value.value,
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

    // Don't create anything on open — just set reasonable defaults for the form.
    // Metric defaults are based on target type.
    metric.value = metricOptions.value[0]?.value ?? 'rate'
    comparator.value = 'gte'
    value.value = 0
    frequency.value = 'daily'

    await nextTick()
    modalContent.value?.focus()
    document.body.style.overflow = 'hidden'
  },
)
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
