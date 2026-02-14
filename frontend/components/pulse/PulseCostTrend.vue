<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
          <Icon
            name="arrow-trending-up"
            :size="20"
            class="text-brand-600"
          />
        </div>
        <div>
          <h2 class="text-body-lg font-bold text-white">
            Cost Trend
          </h2>
          <p class="text-body-sm text-neutral-400">
            Hidden fee changes over time
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-for="range in ranges"
          :key="range"
          class="rounded-md px-3 py-1 text-body-sm font-semibold transition-colors"
          :class="selectedRange === range ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white'"
          @click="selectedRange = range"
        >
          {{ range }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <div
        v-if="loading"
        class="flex h-48 items-center justify-center"
      >
        <div class="flex items-center gap-3 text-neutral-400">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
          Loading trend data...
        </div>
      </div>

      <div v-else>
        <!-- Summary Stats -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="rounded-lg bg-neutral-900 p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-body-sm text-neutral-500">Avg Hidden Fee</span>
              <span
                class="text-body-sm font-semibold"
                :class="trendDirection === 'down' ? 'text-brand-600' : 'text-danger-600'"
              >
                {{ trendDirection === 'down' ? '↓' : '↑' }} {{ formatPercent(Math.abs(trendPercent), { digits: 1 }) }}
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-h4 font-bold text-white">{{ money(currentAvgCost) }}</span>
              <span class="text-body-sm text-neutral-500">from {{ money(previousAvgCost) }}</span>
            </div>
          </div>
          <div class="rounded-lg bg-neutral-900 p-4">
            <div class="text-body-sm text-neutral-500 mb-2">
              Market Leader
            </div>
            <div class="text-h4 font-bold text-white">
              {{ marketLeader }}
            </div>
            <div class="text-body-sm text-neutral-500">
              {{ marketLeaderDays }} of {{ selectedDays }} days
            </div>
          </div>
          <div class="rounded-lg bg-neutral-900 p-4">
            <div class="text-body-sm text-neutral-500 mb-2">
              Consistency
            </div>
            <div class="text-h4 font-bold text-white">
              {{ leaderConsistency }}%
            </div>
            <div class="text-body-sm text-neutral-500">
              same best provider
            </div>
          </div>
        </div>

        <!-- Mini Chart -->
        <div class="relative h-32 mb-4">
          <svg
            class="w-full h-full"
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
          >
            <!-- Grid lines -->
            <line
              x1="0"
              y1="25"
              x2="400"
              y2="25"
              stroke="#404040"
              stroke-width="1"
              stroke-dasharray="4"
            />
            <line
              x1="0"
              y1="50"
              x2="400"
              y2="50"
              stroke="#404040"
              stroke-width="1"
              stroke-dasharray="4"
            />
            <line
              x1="0"
              y1="75"
              x2="400"
              y2="75"
              stroke="#404040"
              stroke-width="1"
              stroke-dasharray="4"
            />

            <!-- Area fill -->
            <path
              :d="areaPath"
              fill="url(#costGradient)"
            />

            <!-- Line -->
            <path
              :d="linePath"
              fill="none"
              stroke="#2563EB"
              stroke-width="2"
            />

            <defs>
              <linearGradient
                id="costGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stop-color="#2563EB"
                  stop-opacity="0.3"
                />
                <stop
                  offset="100%"
                  stop-color="#2563EB"
                  stop-opacity="0"
                />
              </linearGradient>
            </defs>
          </svg>

          <!-- X-axis labels -->
          <div class="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-neutral-500">
            <span>{{ startLabel }}</span>
            <span>Today</span>
          </div>
        </div>

        <!-- Provider Performance -->
        <div class="border-t border-neutral-700 pt-4 mt-4">
          <h4 class="text-body-sm font-semibold text-white mb-3">
            Provider Performance ({{ selectedRange }})
          </h4>
          <div class="space-y-2">
            <div
              v-for="(provider, index) in providerPerformance"
              :key="provider.name"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  :class="index === 0 ? 'bg-brand-600' : 'bg-neutral-600'"
                >
                  {{ index + 1 }}
                </span>
                <span class="text-body-sm text-white">{{ provider.name }}</span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-body-sm text-neutral-400">{{ provider.winDays }} days best</span>
                <div class="w-20 h-2 rounded-full bg-neutral-700 overflow-hidden">
                  <div
                    class="h-full rounded-full"
                    :class="index === 0 ? 'bg-brand-600' : 'bg-neutral-500'"
                    :style="{ width: `${(provider.winDays / selectedDays) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PulseTrustStamp :last-updated="lastUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import { getCostTrendData } from '~/lib/pulseApi'
import type { CostTrendData } from '~/types/remit'
import { Icon } from '~/ui'
import { formatMoney as formatMoneyUtil, formatMonthDay, formatPercent } from '~/shared/lib/format'

const store = usePulseStore()

const loading = ref(true)
const ranges = ['7D', '30D', '90D']
const selectedRange = ref('7D')
const lastUpdated = ref<string | null>(null)

const sendCurrency = computed(() => store.corridor.fromCode || 'USD')
const money = (amount: number) => formatMoneyUtil(amount, { currency: sendCurrency.value })

const trendData = ref<number[]>([])
const costTrendRows = ref<CostTrendData[]>([])
const providerPerformance = ref<{ name: string, winDays: number }[]>([])

const selectedDays = computed(() => {
  const map: Record<string, number> = { '7D': 7, '30D': 30, '90D': 90 }
  return map[selectedRange.value] || 7
})

const currentAvgCost = computed(() => {
  if (trendData.value.length === 0) return 0
  const recent = trendData.value.slice(-3)
  return recent.reduce((a, b) => a + b, 0) / recent.length
})

const previousAvgCost = computed(() => {
  if (trendData.value.length < 4) return currentAvgCost.value
  const older = trendData.value.slice(0, 3)
  return older.reduce((a, b) => a + b, 0) / older.length
})

const trendDirection = computed(() => {
  return currentAvgCost.value < previousAvgCost.value ? 'down' : 'up'
})

const trendPercent = computed(() => {
  if (previousAvgCost.value === 0) return 0
  return ((currentAvgCost.value - previousAvgCost.value) / previousAvgCost.value) * 100
})

const marketLeader = computed(() => {
  if (providerPerformance.value.length === 0) return 'N/A'
  return providerPerformance.value[0].name
})

const marketLeaderDays = computed(() => {
  if (providerPerformance.value.length === 0) return 0
  return providerPerformance.value[0].winDays
})

const leaderConsistency = computed(() => {
  return Math.round((marketLeaderDays.value / selectedDays.value) * 100)
})

const startLabel = computed(() => {
  const days = selectedDays.value
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatMonthDay(date)
})

const linePath = computed(() => {
  if (trendData.value.length === 0) return ''

  const data = trendData.value
  const maxVal = Math.max(...data) * 1.1
  const minVal = Math.min(...data) * 0.9
  const range = maxVal - minVal

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 400
    const y = 100 - ((val - minVal) / range) * 100
    return `${x},${y}`
  })

  return `M${points.join(' L')}`
})

const areaPath = computed(() => {
  if (!linePath.value) return ''
  return `${linePath.value} L400,100 L0,100 Z`
})

async function loadData() {
  loading.value = true
  try {
    const rows = await getCostTrendData(store.corridor, store.timeframe, store.amount)
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))
    const windowed = sorted.slice(-selectedDays.value)

    costTrendRows.value = windowed
    trendData.value = windowed.map(row => row.averageHiddenFee)

    const winCounts = new Map<string, number>()
    for (const row of windowed) {
      if (!row.bestProvider) continue
      winCounts.set(row.bestProvider, (winCounts.get(row.bestProvider) || 0) + 1)
    }
    providerPerformance.value = Array.from(winCounts.entries())
      .map(([name, winDays]) => ({ name, winDays }))
      .sort((a, b) => b.winDays - a.winDays)

    const lastDate = windowed[windowed.length - 1]?.date
    lastUpdated.value = lastDate ? new Date(lastDate).toISOString() : (store.lastUpdated || null)
  }
  catch (e) {
    useLogger('PulseCostTrend').error('Failed to load cost trend', e)
  }
  finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.timeframe, store.amount, selectedRange.value],
  () => loadData(),
  { deep: true },
)

onMounted(() => {
  loadData()
})
</script>
