<template>
  <div class="sticky top-0 z-40 bg-neutral-800 border-b border-neutral-700">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4">
        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Corridor Selector -->
          <div class="relative">
            <label class="sr-only">Corridor</label>
            <select
              v-model="localFilters.corridor"
              class="h-10 rounded-lg border border-neutral-600 bg-neutral-700 pl-4 pr-10 text-sm text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer min-w-[180px]"
              @change="updateFilters"
            >
              <option
                value="global"
                class="bg-neutral-700"
              >
                Global (All Corridors)
              </option>
              <option
                v-for="corridor in corridors"
                :key="corridor.value"
                :value="corridor.value"
                class="bg-neutral-700"
              >
                {{ corridor.fromFlag }} {{ corridor.label }}
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                class="h-4 w-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <!-- Amount Selector -->
          <div class="relative">
            <label class="sr-only">Amount</label>
            <select
              v-model="localFilters.amount"
              class="h-10 rounded-lg border border-neutral-600 bg-neutral-700 pl-4 pr-10 text-sm text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer"
              @change="updateFilters"
            >
              <option
                :value="100"
                class="bg-neutral-700"
              >
                $100
              </option>
              <option
                :value="200"
                class="bg-neutral-700"
              >
                $200
              </option>
              <option
                :value="500"
                class="bg-neutral-700"
              >
                $500
              </option>
              <option
                :value="1000"
                class="bg-neutral-700"
              >
                $1,000
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                class="h-4 w-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <!-- Funding Method -->
          <div class="relative">
            <label class="sr-only">Funding Method</label>
            <select
              v-model="localFilters.fundingMethod"
              class="h-10 rounded-lg border border-neutral-600 bg-neutral-700 pl-4 pr-10 text-sm text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer"
              @change="updateFilters"
            >
              <option
                value="bank"
                class="bg-neutral-700"
              >
                Fund: Bank
              </option>
              <option
                value="card"
                class="bg-neutral-700"
              >
                Fund: Card
              </option>
              <option
                value="cash"
                class="bg-neutral-700"
              >
                Fund: Cash
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                class="h-4 w-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <!-- Payout Method -->
          <div class="relative">
            <label class="sr-only">Payout Method</label>
            <select
              v-model="localFilters.payoutMethod"
              class="h-10 rounded-lg border border-neutral-600 bg-neutral-700 pl-4 pr-10 text-sm text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer"
              @change="updateFilters"
            >
              <option
                value="bank"
                class="bg-neutral-700"
              >
                Pay: Bank
              </option>
              <option
                value="cash"
                class="bg-neutral-700"
              >
                Pay: Cash
              </option>
              <option
                value="wallet"
                class="bg-neutral-700"
              >
                Pay: Wallet
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                class="h-4 w-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Last Updated -->
        <div class="flex items-center gap-2 text-sm text-neutral-400">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
          </span>
          <span>Updated {{ lastUpdatedText }}</span>
        </div>
      </div>

      <!-- Mobile: Corridor Name Display -->
      <div
        v-if="corridorInfo && localFilters.corridor !== 'global'"
        class="pb-4 lg:hidden"
      >
        <div class="flex items-center gap-2 text-lg font-semibold text-white">
          <span class="text-2xl">{{ corridorInfo.fromFlag }}</span>
          <svg
            class="h-4 w-4 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
          <span class="text-2xl">{{ corridorInfo.toFlag }}</span>
          <span class="ml-2">{{ corridorInfo.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PulseFilters, AmountBucket, FundingMethod, PayoutMethod } from '~/types/pulse'
import { getCorridors, getCorridorBySlug } from '~/lib/pulseApi'

interface Props {
  modelValue: PulseFilters
  lastUpdated?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [filters: PulseFilters]
}>()

const route = useRoute()
const router = useRouter()

const { data: corridorData } = await useAsyncData('pulse-corridors', () => getCorridors())
const corridors = computed(() => corridorData.value || [])

const localFilters = ref<PulseFilters>({ ...props.modelValue })
const isSyncingFromUrl = ref(false)
const lastCorridor = ref(localFilters.value.corridor)

const corridorInfo = computed(() => {
  if (localFilters.value.corridor === 'global') return null
  return getCorridorBySlug(localFilters.value.corridor)
})

const lastUpdatedText = computed(() => {
  if (!props.lastUpdated) return 'just now'
  const diff = Date.now() - new Date(props.lastUpdated).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 min ago'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hour ago'
  return `${hours} hours ago`
})

function updateFilters() {
  if (localFilters.value.corridor !== lastCorridor.value) {
    localFilters.value.corridorId = undefined
    lastCorridor.value = localFilters.value.corridor
  }
  emit('update:modelValue', { ...localFilters.value })
  syncToUrl()
}

function syncToUrl() {
  const query: Record<string, string> = {}
  if (localFilters.value.corridor !== 'global') {
    query.corridor = localFilters.value.corridor
  }
  if (localFilters.value.corridorId && localFilters.value.corridor !== 'global') {
    query.corridor_id = localFilters.value.corridorId
  }
  if (localFilters.value.amount !== 200) {
    query.amount = String(localFilters.value.amount)
  }
  if (localFilters.value.fundingMethod !== 'bank') {
    query.fund = localFilters.value.fundingMethod
  }
  if (localFilters.value.payoutMethod !== 'bank') {
    query.pay = localFilters.value.payoutMethod
  }
  router.replace({ query })
}

function syncFromUrl() {
  isSyncingFromUrl.value = true
  const { corridor, amount, fund, pay } = route.query
  if (corridor && typeof corridor === 'string') {
    localFilters.value.corridor = corridor
  }
  const corridorId = route.query.corridor_id
  if (corridorId && typeof corridorId === 'string') {
    localFilters.value.corridorId = corridorId
  }
  if (amount && typeof amount === 'string') {
    const num = Number.parseInt(amount, 10)
    if ([100, 200, 500, 1000].includes(num)) {
      localFilters.value.amount = num as AmountBucket
    }
  }
  if (fund && typeof fund === 'string' && ['bank', 'card', 'cash'].includes(fund)) {
    localFilters.value.fundingMethod = fund as FundingMethod
  }
  if (pay && typeof pay === 'string' && ['bank', 'cash', 'wallet'].includes(pay)) {
    localFilters.value.payoutMethod = pay as PayoutMethod
  }
  emit('update:modelValue', { ...localFilters.value })
  isSyncingFromUrl.value = false
}

watch(() => props.modelValue, (newVal) => {
  localFilters.value = { ...newVal }
  lastCorridor.value = newVal.corridor
}, { deep: true })

watch(() => localFilters.value.corridor, (next, prev) => {
  if (isSyncingFromUrl.value) return
  if (next !== prev) {
    localFilters.value.corridorId = undefined
  }
})

onMounted(() => {
  syncFromUrl()
})
</script>
