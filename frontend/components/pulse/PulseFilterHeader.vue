<template>
  <div class="sticky top-0 z-40 bg-neutral-800 border-b border-neutral-700">
    <div class="container">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4">
        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Corridor Selector -->
          <div class="relative">
            <label class="sr-only">Corridor</label>
            <select
              v-model="localFilters.corridor"
              class="h-10 rounded-lg border border-neutral-600 bg-neutral-700 pl-4 pr-10 text-body-sm text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer min-w-[180px]"
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
              <Icon
                name="chevron-down"
                :size="16"
                class="text-neutral-400"
              />
            </div>
          </div>

          <!-- Amount Selector -->
          <div class="relative">
            <label class="sr-only">Amount</label>
            <select
              v-model="localFilters.amount"
              class="h-10 rounded-lg border border-neutral-600 bg-neutral-700 pl-4 pr-10 text-body-sm text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer"
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
              <Icon
                name="chevron-down"
                :size="16"
                class="text-neutral-400"
              />
            </div>
          </div>

          <!-- Funding Method -->
          <div class="relative">
            <label class="sr-only">Funding Method</label>
            <select
              v-model="localFilters.fundingMethod"
              class="h-10 rounded-lg border border-neutral-600 bg-neutral-700 pl-4 pr-10 text-body-sm text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer"
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
              <Icon
                name="chevron-down"
                :size="16"
                class="text-neutral-400"
              />
            </div>
          </div>

          <!-- Payout Method -->
          <div class="relative">
            <label class="sr-only">Payout Method</label>
            <select
              v-model="localFilters.payoutMethod"
              class="h-10 rounded-lg border border-neutral-600 bg-neutral-700 pl-4 pr-10 text-body-sm text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 appearance-none cursor-pointer"
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
              <Icon
                name="chevron-down"
                :size="16"
                class="text-neutral-400"
              />
            </div>
          </div>
        </div>

        <!-- Last Updated -->
        <div class="flex items-center gap-2 text-body-sm text-neutral-400">
          <span
            class="inline-flex h-2 w-2 rounded-full"
            :class="props.lastUpdated ? 'bg-brand-600' : 'bg-neutral-500'"
            aria-hidden="true"
          />
          <span>{{ lastUpdatedLabel }}</span>
        </div>
      </div>

      <!-- Mobile: Corridor Name Display -->
      <div
        v-if="corridorInfo && localFilters.corridor !== 'global'"
        class="pb-4 lg:hidden"
      >
        <div class="flex items-center gap-2 text-body-lg font-semibold text-white">
          <span class="text-h3">{{ corridorInfo.fromFlag }}</span>
          <Icon
            name="arrow-right"
            :size="16"
            class="text-neutral-500"
          />
          <span class="text-h3">{{ corridorInfo.toFlag }}</span>
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
import { Icon } from '~/ui'
import { formatUpdatedLabel } from '~/shared/lib/format'

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

const lastUpdatedLabel = computed(() => formatUpdatedLabel(props.lastUpdated ?? null))

function updateFilters() {
  if (localFilters.value.corridor !== lastCorridor.value) {
    const info = localFilters.value.corridor === 'global'
      ? null
      : getCorridorBySlug(localFilters.value.corridor)
    localFilters.value.corridorId = info?.corridorId
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

  if (localFilters.value.corridor !== 'global' && !localFilters.value.corridorId) {
    const info = getCorridorBySlug(localFilters.value.corridor)
    localFilters.value.corridorId = info?.corridorId
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
    const info = next === 'global' ? null : getCorridorBySlug(next)
    localFilters.value.corridorId = info?.corridorId
  }
})

onMounted(() => {
  syncFromUrl()
})
</script>
