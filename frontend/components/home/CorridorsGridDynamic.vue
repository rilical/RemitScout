<template>
  <section class="relative py-12 sm:py-16 overflow-hidden">
    <!-- Transitional Background -->
    <div class="absolute inset-0 bg-gradient-to-b from-slate-50 via-blue-50/30 to-white"></div>
    
    <!-- Grid pattern that fades out -->
    <div class="absolute inset-0">
      <div
        class="absolute inset-0 opacity-15"
        style="background-image:
          linear-gradient(to right, rgba(59, 130, 246, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 20%, transparent 40%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 20%, transparent 40%);"
      />
    </div>

    <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-8 animate-fade-in-up">
        <h2 class="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
          Popular Corridors Our Expats Searched Today
        </h2>
        <p class="text-base sm:text-lg text-neutral-600 max-w-3xl mx-auto">
          Join thousands of expats who trust Remit-Scout to find the best transfer rates. <span class="whitespace-nowrap">See what routes real people are comparing right now.</span>
        </p>
      </div>

      <!-- Loading state -->
      <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="h-32 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-xl"></div>
        </div>
      </div>

      <!-- Corridor cards with carousel -->
      <div v-else class="relative">
        <!-- Navigation buttons -->
        <button
          v-if="canScrollLeft"
          @click="scrollLeft"
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 z-20 bg-white border-2 border-neutral-300 hover:border-brand-600 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          aria-label="Previous corridors"
        >
          <svg class="h-5 w-5 text-neutral-600 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          v-if="canScrollRight"
          @click="scrollRight"
          class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 z-20 bg-white border-2 border-neutral-300 hover:border-brand-600 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          aria-label="Next corridors"
        >
          <svg class="h-5 w-5 text-neutral-600 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- Carousel container -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="(corridor, index) in displayCorridors"
              :key="corridor.route"
              @click="selectCorridor(corridor)"
              class="group relative rounded-xl border-2 border-neutral-200 bg-white p-5 hover:border-brand-600 hover:shadow-xl transition-all duration-300 text-left card-hover overflow-hidden animate-fade-in-up focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <!-- Animated background gradient on hover -->
              <div class="absolute inset-0 bg-gradient-to-br from-brand-50/0 to-brand-50/0 group-hover:from-brand-50/50 group-hover:to-purple-50/30 transition-all duration-300"></div>

              <!-- Flags and route -->
              <div class="relative z-10 flex items-center gap-3 mb-3">
                <span class="text-3xl group-hover:scale-110 transition-transform duration-300">{{ getFlag(corridor.from) }}</span>
                <svg class="h-5 w-5 text-brand-600 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span class="text-3xl group-hover:scale-110 transition-transform duration-300">{{ getFlag(corridor.to) }}</span>
              </div>

              <!-- Route name -->
              <div class="relative z-10 font-bold text-neutral-900 text-xl mb-3 group-hover:text-brand-700 transition-colors">
                {{ corridor.route }}
              </div>

              <!-- Search count -->
              <div class="relative z-10 inline-flex items-center gap-1.5">
                <svg class="h-4 w-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span class="text-sm font-semibold text-neutral-700">
                  {{ corridor.count24h }} searches today
                </span>
              </div>

              <!-- Shimmer effect on hover -->
              <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div class="absolute inset-0 animate-shimmer"></div>
              </div>
            </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRemittanceApi } from '~/composables/useRemittanceApi'

const emit = defineEmits<{
  'corridor-selected': [data: { from: string; to: string }]
}>()

// Carousel state
const currentIndex = ref(0)
const itemsPerPage = ref(3)

// Fetch popular corridors
const { data, pending } = await useRemittanceApi().usePopularCorridors()

// Country flag mapping
const FLAGS: Record<string, string> = {
  US: '🇺🇸',
  GB: '🇬🇧',
  PH: '🇵🇭',
  IN: '🇮🇳',
  PK: '🇵🇰',
  NG: '🇳🇬',
  MX: '🇲🇽',
  CA: '🇨🇦',
  FR: '🇫🇷',
  DE: '🇩🇪',
  ES: '🇪🇸',
  IT: '🇮🇹',
  MA: '🇲🇦',
  SN: '🇸🇳',
  BR: '🇧🇷',
  VN: '🇻🇳',
  BD: '🇧🇩',
  EG: '🇪🇬',
  CN: '🇨🇳',
  CO: '🇨🇴',
  GH: '🇬🇭',
  AE: '🇦🇪',
}

const getFlag = (code: string) => FLAGS[code] || '🌍'

// Default corridors if no data
const defaultCorridors = [
  { route: 'US→PH', from: 'US', to: 'PH', count24h: 142, feeRange: '$0-4', speedRange: '15-30 min', bestFor: 'Cash pickup to rural areas' },
  { route: 'US→IN', from: 'US', to: 'IN', count24h: 98, feeRange: '$0-5', speedRange: 'Same day', bestFor: 'Highest bank payout' },
  { route: 'GB→PK', from: 'GB', to: 'PK', count24h: 76, feeRange: '£0-3', speedRange: '1-24 hours', bestFor: 'Tuition payments' },
  { route: 'US→MX', from: 'US', to: 'MX', count24h: 65, feeRange: '$2-8', speedRange: 'Minutes', bestFor: 'Cash pickup network' },
  { route: 'CA→IN', from: 'CA', to: 'IN', count24h: 54, feeRange: '$0-5', speedRange: 'Same day', bestFor: 'Bank deposits' },
  { route: 'DE→MA', from: 'DE', to: 'MA', count24h: 43, feeRange: '€2-5', speedRange: '1-2 days', bestFor: 'Family support' },
  { route: 'FR→SN', from: 'FR', to: 'SN', count24h: 38, feeRange: '€3-8', speedRange: 'Same day', bestFor: 'Mobile money' },
  { route: 'US→NG', from: 'US', to: 'NG', count24h: 31, feeRange: '$3-10', speedRange: '1-2 days', bestFor: 'Bank transfers' },
  { route: 'GB→IN', from: 'GB', to: 'IN', count24h: 27, feeRange: '£0-4', speedRange: 'Same day', bestFor: 'Bank deposits' },
  { route: 'US→BR', from: 'US', to: 'BR', count24h: 22, feeRange: '$5-12', speedRange: '1-3 days', bestFor: 'Bank transfers' },
  { route: 'CA→PH', from: 'CA', to: 'PH', count24h: 18, feeRange: '$3-7', speedRange: '30-60 min', bestFor: 'Cash pickup' },
  { route: 'AE→IN', from: 'AE', to: 'IN', count24h: 15, feeRange: 'AED 0-5', speedRange: 'Same day', bestFor: 'Bank transfers' },
]

// Parse corridor route to get from/to codes
const parseRoute = (route: string) => {
  const [from, to] = route.split('→')
  return { from, to }
}

const corridors = computed(() => {
  const apiData = data.value as any
  if (!apiData?.data || apiData.data.length === 0) {
    return defaultCorridors
  }
  
  // Add from/to codes to each corridor
  return apiData.data.map((c: any) => ({
    ...c,
    ...parseRoute(c.route),
  }))
})

const displayCorridors = computed(() => {
  const start = currentIndex.value * itemsPerPage.value
  const end = start + itemsPerPage.value
  return corridors.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(corridors.value.length / itemsPerPage.value)
})

const canScrollLeft = computed(() => {
  return currentIndex.value > 0
})

const canScrollRight = computed(() => {
  return currentIndex.value < totalPages.value - 1
})

const updateItemsPerPage = () => {
  if (typeof window === 'undefined') return
  
  const width = window.innerWidth
  if (width >= 1024) {
    itemsPerPage.value = 3 // lg:grid-cols-3
  } else if (width >= 640) {
    itemsPerPage.value = 2 // sm:grid-cols-2
  } else {
    itemsPerPage.value = 1 // grid-cols-1
  }
  
  // Reset to first page if current index is out of bounds
  if (currentIndex.value >= totalPages.value) {
    currentIndex.value = 0
  }
}

const scrollLeft = () => {
  if (canScrollLeft.value) {
    currentIndex.value--
  }
}

const scrollRight = () => {
  if (canScrollRight.value) {
    currentIndex.value++
  }
}

const selectCorridor = (corridor: any) => {
  emit('corridor-selected', { 
    from: corridor.from, 
    to: corridor.to 
  })
  
  // Scroll to hero and focus the form
  const heroElement = document.getElementById('hero-dual-tab')
  if (heroElement) {
    heroElement.scrollIntoView({ behavior: 'smooth' })
    // Wait for scroll to finish, then focus the first form input
    setTimeout(() => {
      const firstInput = heroElement.querySelector<HTMLSelectElement>('#from-country')
      firstInput?.focus()
    }, 500)
  }
}

onMounted(() => {
  updateItemsPerPage()
  window.addEventListener('resize', updateItemsPerPage)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateItemsPerPage)
})
</script>



