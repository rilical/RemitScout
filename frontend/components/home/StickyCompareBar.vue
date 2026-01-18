<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCompareForm } from '~/composables/useCompareForm'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import { getMaxAmount, getMinAmount, sanitizeAmount } from '~/utils/currency-limits'

const { form, submit, DELIVERY_METHODS, validationError, statusMessage, isWaitingForQuotes } = useCompareForm()

const isVisible = ref(false)
const sheetOpen = ref(false)

const defaultCurrencyByCountry: Record<string, string> = {
  US: 'USD', UK: 'GBP', CA: 'CAD', AU: 'AUD', GB: 'GBP',
  IN: 'INR', MX: 'MXN', PH: 'PHP', NG: 'NGN', FR: 'EUR',
  DE: 'EUR', ES: 'EUR', IT: 'EUR', BR: 'BRL', CN: 'CNY',
}

const resolveCurrency = (countryCode: string): string => {
  return defaultCurrencyByCountry[countryCode] || 'USD'
}

const amountLimits = computed(() => {
  const currency = (form.value.fromCurrency || resolveCurrency(form.value.from)).toUpperCase()
  return {
    minAmount: getMinAmount(currency),
    maxAmount: getMaxAmount(currency),
  }
})

const clampAmount = () => {
  const currency = (form.value.fromCurrency || resolveCurrency(form.value.from)).toUpperCase()
  const sanitized = sanitizeAmount(form.value.amount, currency, {
    minAmount: amountLimits.value.minAmount,
    maxAmount: amountLimits.value.maxAmount,
    strict: true,
  })
  if (sanitized !== form.value.amount) {
    form.value.amount = sanitized
  }
}

function handleScroll() {
  const heroElement = document.getElementById('hero-dual-tab')
  if (heroElement) {
    const rect = heroElement.getBoundingClientRect()
    isVisible.value = rect.bottom < 0
  }
}

function openSheet() {
  sheetOpen.value = true
  document.body.style.overflow = 'hidden'

  setTimeout(() => {
    const firstInput = document.querySelector<HTMLElement>('#sheet-from-country')
    firstInput?.focus()
  }, 100)
}

function closeSheet() {
  sheetOpen.value = false
  document.body.style.overflow = ''
}

async function handleSheetSubmit() {
  const success = await submit()
  if (success) {
    closeSheet()
  }
}

async function handleQuickSubmit() {
  await submit()
}

watch(() => form.value.from, (newCountry) => {
  if (newCountry && !form.value.fromCurrency) {
    form.value.fromCurrency = resolveCurrency(newCountry)
  }
  clampAmount()
})

watch(() => form.value.to, (newCountry) => {
  if (newCountry && !form.value.toCurrency) {
    form.value.toCurrency = resolveCurrency(newCountry)
  }
  else if (!newCountry) {
    form.value.toCurrency = ''
  }
})

watch(() => form.value.fromCurrency, () => {
  clampAmount()
})

watch(() => form.value.amount, () => {
  clampAmount()
})

clampAmount()

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  document.body.style.overflow = ''
})
</script>

<template>
  <Transition
    enter-active-class="motion-safe:transition-all motion-safe:duration-300"
    enter-from-class="opacity-0 translate-y-full"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="motion-safe:transition-all motion-safe:duration-300"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-full"
  >
    <div
      v-if="isVisible"
      class="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex items-center justify-between gap-4">
          <div class="hidden sm:flex items-center gap-2 text-sm text-slate-600">
            <span class="font-medium">Compare providers:</span>
            <span v-if="form.from && form.to">
              {{ form.from }} → {{ form.to }}
            </span>
            <span
              v-else
              class="text-slate-400"
            >Select countries</span>
          </div>

          <div class="flex items-center gap-3 flex-1 sm:flex-initial">
            <button
              class="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="openSheet"
            >
              <svg
                class="h-4 w-4 sm:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Compare Now</span>
            </button>

            <button
              v-if="form.from && form.to"
              type="button"
              :disabled="isWaitingForQuotes"
              class="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-2 disabled:cursor-not-allowed disabled:opacity-70"
              @click="handleQuickSubmit"
            >
              <span v-if="isWaitingForQuotes">Checking...</span>
              <span v-else>View details</span>
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <Teleport to="body">
    <Transition
      enter-active-class="motion-safe:transition-opacity motion-safe:duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="motion-safe:transition-opacity motion-safe:duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sheetOpen"
        class="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-sm"
        aria-hidden="true"
        @click="closeSheet"
      />
    </Transition>

    <Transition
      enter-active-class="motion-safe:transition-transform motion-safe:duration-300"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="motion-safe:transition-transform motion-safe:duration-200"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="sheetOpen"
        class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Compare providers"
      >
        <div class="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 class="text-lg font-bold text-neutral-900">
            Compare Providers
          </h2>
          <button
            class="rounded-full p-2 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
            @click="closeSheet"
          >
            <svg
              class="h-5 w-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="px-6 py-6">
          <form
            class="space-y-4"
            @submit.prevent="handleSheetSubmit"
          >
            <div>
              <label
                for="sheet-from-country"
                class="block text-sm font-semibold text-neutral-700 mb-2"
              >
                <span class="mr-2">🛫</span>Sending from
              </label>
              <CountrySelect
                id="sheet-from-country"
                v-model="form.from"
                label="Sending from"
                :exclude-country="form.to"
                placeholder="United States"
              />
            </div>

            <div>
              <label
                for="sheet-to-country"
                class="block text-sm font-semibold text-neutral-700 mb-2"
              >
                <span class="mr-2">🛬</span>Receiving in
              </label>
              <CountrySelect
                id="sheet-to-country"
                v-model="form.to"
                label="Receiving in"
                :exclude-country="form.from"
                placeholder="Type in Country"
              />
            </div>

            <div>
              <label
                for="sheet-amount"
                class="block text-sm font-semibold text-neutral-700 mb-2"
              >
                You send
              </label>
              <input
                id="sheet-amount"
                v-model.number="form.amount"
                type="number"
                :min="amountLimits.minAmount"
                :max="amountLimits.maxAmount"
                step="0.01"
                class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="500"
              >
            </div>

            <div>
              <label class="block text-sm font-semibold text-neutral-700 mb-2">
                Delivery method
              </label>
              <div class="flex gap-2">
                <button
                  v-for="method in DELIVERY_METHODS"
                  :key="method.value"
                  type="button"
                  :class="[
                    'flex-1 flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium rounded-lg border transition-all',
                    form.method === method.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300',
                  ]"
                  :aria-pressed="form.method === method.value"
                  @click="form.method = method.value"
                >
                  <span class="text-xl">{{ method.icon }}</span>
                  <span>{{ method.label }}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              :disabled="isWaitingForQuotes"
              class="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span v-if="isWaitingForQuotes">Checking...</span>
              <span v-else>Compare 30+ providers</span>
              <svg
                class="h-5 w-5"
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

            <p
              v-if="validationError"
              class="text-sm text-red-600"
              role="alert"
            >
              {{ validationError }}
            </p>
            <p
              v-else-if="statusMessage"
              class="text-sm text-slate-600"
              role="status"
            >
              {{ statusMessage }}
            </p>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
