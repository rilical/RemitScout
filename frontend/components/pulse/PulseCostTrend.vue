<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
          <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-white">Cost Trend</h2>
          <p class="text-sm text-neutral-400">Hidden fee changes over time</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-for="range in ranges"
          :key="range"
          class="rounded-md px-3 py-1 text-xs font-semibold transition-colors"
          :class="selectedRange === range ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white'"
          @click="selectedRange = range"
        >
          {{ range }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <div v-if="loading" class="flex h-48 items-center justify-center">
        <div class="flex items-center gap-3 text-neutral-400">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading trend data...
        </div>
      </div>

      <div v-else>
        <!-- Summary Stats -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="rounded-lg bg-neutral-900 p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-neutral-500">Avg Hidden Fee</span>
              <span
                class="text-xs font-semibold"
                :class="trendDirection === 'down' ? 'text-brand-600' : 'text-danger-600'"
              >
                {{ trendDirection === 'down' ? '↓' : '↑' }} {{ Math.abs(trendPercent).toFixed(1) }}%
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-xl font-bold text-white">${{ currentAvgCost.toFixed(2) }}</span>
              <span class="text-sm text-neutral-500">from ${{ previousAvgCost.toFixed(2) }}</span>
            </div>
          </div>
          <div class="rounded-lg bg-neutral-900 p-4">
            <div class="text-xs text-neutral-500 mb-2">Market Leader</div>
            <div class="text-xl font-bold text-white">{{ marketLeader }}</div>
            <div class="text-sm text-neutral-500">{{ marketLeaderDays }} of {{ selectedDays }} days</div>
          </div>
          <div class="rounded-lg bg-neutral-900 p-4">
            <div class="text-xs text-neutral-500 mb-2">Consistency</div>
            <div class="text-xl font-bold text-white">{{ leaderConsistency }}%</div>
            <div class="text-sm text-neutral-500">same best provider</div>
          </div>
        </div>

        <!-- Mini Chart -->
        <div class="relative h-32 mb-4">
          <svg class="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
            <!-- Grid lines -->
            <line x1="0" y1="25" x2="400" y2="25" stroke="#404040" stroke-width="1" stroke-dasharray="4" />
            <line x1="0" y1="50" x2="400" y2="50" stroke="#404040" stroke-width="1" stroke-dasharray="4" />
            <line x1="0" y1="75" x2="400" y2="75" stroke="#404040" stroke-width="1" stroke-dasharray="4" />
            
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
              <linearGradient id="costGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#2563EB" stop-opacity="0.3" />
                <stop offset="100%" stop-color="#2563EB" stop-opacity="0" />
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
          <h4 class="text-sm font-semibold text-white mb-3">Provider Performance ({{ selectedRange }})</h4>
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
                <span class="text-sm text-white">{{ provider.name }}</span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm text-neutral-400">{{ provider.winDays }} days best</span>
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

const store = usePulseStore()

const loading = ref(true)
const ranges = ['7D', '30D', '90D']
const selectedRange = ref('7D')
const lastUpdated = ref(new Date().toISOString())

const trendData = ref<number[]>([])
const providerPerformance = ref<{ name: string; winDays: number }[]>([])

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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const days = selectedDays.value
    const baseAvg = 4.5
    
    trendData.value = Array.from({ length: days }, (_, i) => {
      const trend = -0.02 * (i / days)
      const noise = (Math.random() - 0.5) * 0.5
      return baseAvg + trend + noise
    })
    
    const providers = ['Wise', 'Remitly', 'XE', 'Xoom']
    const totalDays = days
    let remainingDays = totalDays
    
    providerPerformance.value = providers.map((name, index) => {
      let winDays: number
      if (index === 0) {
        winDays = Math.floor(totalDays * (0.4 + Math.random() * 0.2))
      } else if (index === providers.length - 1) {
        winDays = remainingDays
      } else {
        winDays = Math.floor(remainingDays * (0.3 + Math.random() * 0.2))
      }
      remainingDays -= winDays
      return { name, winDays: Math.max(0, winDays) }
    }).sort((a, b) => b.winDays - a.winDays)
    
    lastUpdated.value = new Date().toISOString()
  } catch (e) {
    console.error('Failed to load cost trend:', e)
  } finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, selectedRange.value],
  () => loadData(),
  { deep: true }
)

onMounted(() => {
  loadData()
})
</script>




