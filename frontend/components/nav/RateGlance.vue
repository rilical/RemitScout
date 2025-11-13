<template>
  <div v-if="lastCorridor && rate" class="mb-4 rounded-xl bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100 p-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1 text-sm">
          <span class="text-lg">{{ fromFlag }}</span>
          <span class="font-semibold text-neutral-900">{{ fromCurrency }}</span>
          <svg class="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span class="text-lg">{{ toFlag }}</span>
          <span class="font-semibold text-neutral-900">{{ toCurrency }}</span>
        </div>
      </div>
      <div class="flex flex-col items-end">
        <div class="text-sm font-bold text-brand-600">{{ formattedRate }}</div>
        <div class="text-xs text-neutral-500">Mid-market</div>
      </div>
    </div>
    <div class="mt-1 flex items-center gap-1 text-xs text-neutral-600">
      <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
      </svg>
      <span>Last viewed corridor • Updates live</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

interface Corridor {
  from: string
  to: string
  fromCurrency: string
  toCurrency: string
  fromFlag?: string
  toFlag?: string
}

const lastCorridor = ref<Corridor | null>(null)
const rate = ref<number | null>(null)
const isLoading = ref(false)

const countryFlags: Record<string, string> = {
  US: '🇺🇸',
  PH: '🇵🇭',
  IN: '🇮🇳',
  GB: '🇬🇧',
  PK: '🇵🇰',
  EU: '🇪🇺',
  MA: '🇲🇦',
  MX: '🇲🇽',
  NG: '🇳🇬',
  KE: '🇰🇪',
  CA: '🇨🇦',
  AU: '🇦🇺',
  NZ: '🇳🇿',
  ZA: '🇿🇦',
  BR: '🇧🇷',
  AR: '🇦🇷',
  CN: '🇨🇳',
  JP: '🇯🇵',
  KR: '🇰🇷',
  SG: '🇸🇬',
  HK: '🇭🇰',
  TH: '🇹🇭',
  VN: '🇻🇳',
  ID: '🇮🇩',
  MY: '🇲🇾',
  FR: '🇫🇷',
  DE: '🇩🇪',
  IT: '🇮🇹',
  ES: '🇪🇸',
  NL: '🇳🇱',
  BE: '🇧🇪',
  CH: '🇨🇭',
  SE: '🇸🇪',
  NO: '🇳🇴',
  DK: '🇩🇰',
  PL: '🇵🇱',
  TR: '🇹🇷',
  EG: '🇪🇬',
  SA: '🇸🇦',
  AE: '🇦🇪'
}

const fromFlag = computed(() => {
  return lastCorridor.value?.fromFlag || countryFlags[lastCorridor.value?.from || ''] || '🌍'
})

const toFlag = computed(() => {
  return lastCorridor.value?.toFlag || countryFlags[lastCorridor.value?.to || ''] || '🌍'
})

const fromCurrency = computed(() => lastCorridor.value?.fromCurrency || 'USD')
const toCurrency = computed(() => lastCorridor.value?.toCurrency || 'PHP')

const formattedRate = computed(() => {
  if (!rate.value) return '—'
  return rate.value.toFixed(4)
})

const loadLastCorridor = () => {
  try {
    const stored = localStorage.getItem('remitscout_last_corridor')
    if (stored) {
      lastCorridor.value = JSON.parse(stored)
      fetchRate()
    }
  } catch (error) {
    console.error('Failed to load last corridor:', error)
  }
}

const fetchRate = async () => {
  if (!lastCorridor.value) return
  
  isLoading.value = true
  try {
    // Mock rate fetch - replace with actual API call
    // const response = await $fetch(`/api/rates/${lastCorridor.value.fromCurrency}/${lastCorridor.value.toCurrency}`)
    // rate.value = response.rate
    
    // For now, simulate with static data
    const mockRates: Record<string, number> = {
      'USD-PHP': 56.23,
      'USD-INR': 83.12,
      'GBP-PKR': 351.45,
      'EUR-MAD': 10.87,
      'USD-MXN': 17.23,
      'USD-NGN': 789.45,
      'USD-CAD': 1.35,
      'GBP-USD': 1.27,
      'EUR-USD': 1.08
    }
    
    const key = `${lastCorridor.value.fromCurrency}-${lastCorridor.value.toCurrency}`
    rate.value = mockRates[key] || Math.random() * 100
  } catch (error) {
    console.error('Failed to fetch rate:', error)
  } finally {
    isLoading.value = false
  }
}

let interval: NodeJS.Timeout | null = null

onMounted(() => {
  loadLastCorridor()
  
  // Refresh rate every 30 seconds
  interval = setInterval(() => {
    if (lastCorridor.value) {
      fetchRate()
    }
  }, 30000)
})

onBeforeUnmount(() => {
  if (interval) {
    clearInterval(interval)
  }
})

// Expose method for parent to update corridor
defineExpose({
  updateCorridor: (corridor: Corridor) => {
    lastCorridor.value = corridor
    try {
      localStorage.setItem('remitscout_last_corridor', JSON.stringify(corridor))
    } catch (error) {
      console.error('Failed to save corridor:', error)
    }
    fetchRate()
  }
})
</script>



