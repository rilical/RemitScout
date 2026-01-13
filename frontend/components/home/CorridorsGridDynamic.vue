<template>
  <section :class="['relative py-12 sm:py-16', props.dark ? 'bg-gray-900' : '']">
    <!-- Transitional Background -->
    <div v-if="!props.dark" class="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700" />

    <!-- Content -->
    <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center animate-fade-in-up mb-8">
        <h2 :class="['text-3xl sm:text-4xl font-bold mb-4', props.dark ? 'text-white' : 'text-white']">
          Popular Corridors Our Expats Searched Today
        </h2>
        <p :class="['text-lg sm:text-xl max-w-3xl mx-auto', props.dark ? 'text-white/70' : 'text-white/90']">
          Join thousands of expats who trust Remit-Scout to find the best transfer rates.
        </p>
      </div>

      <!-- Country Slider/Carousel - 3 per slide -->
      <div
        v-if="hasCorridors"
        class="relative overflow-hidden -mx-4 px-4"
      >
        <div
          ref="sliderRef"
          class="flex gap-4 transition-transform duration-500 ease-in-out"
          :style="{ transform: `translateX(-${currentSlide * (100 / itemsPerSlide)}%)` }"
        >
          <div
            v-for="(corridor, index) in corridors"
            :key="`${corridor.from}-${corridor.to}-${index}`"
            class="flex-shrink-0"
            :style="{ width: `calc((100% - 2rem) / ${itemsPerSlide})` }"
          >
            <button
              :class="[
                'group w-full rounded-xl border-2 p-6 text-left transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2',
                props.dark
                  ? 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
                  : 'border-neutral-200 bg-white hover:border-brand-600',
              ]"
              @click="handleCorridorClick(corridor)"
            >
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl">{{ getCountryFlag(corridor.from) }}</span>
                <svg
                  :class="[
                    'h-5 w-5 transition-colors',
                    props.dark ? 'text-white/60 group-hover:text-white' : 'text-neutral-400 group-hover:text-brand-600',
                  ]"
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
                <span class="text-3xl">{{ getCountryFlag(corridor.to) }}</span>
              </div>

              <div :class="['font-bold text-lg mb-2', props.dark ? 'text-white' : 'text-neutral-900']">
                {{ corridor.from }} → {{ corridor.to }}
              </div>

              <div
                v-if="corridor.count24h"
                :class="['flex items-center gap-2 text-sm', props.dark ? 'text-white/60' : 'text-neutral-600']"
              >
                <svg
                  class="h-4 w-4 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{{ corridor.count24h }} searches today</span>
              </div>

              <div :class="['mt-4 opacity-0 group-hover:opacity-100 transition-opacity', props.dark ? 'text-white' : 'text-brand-600']">
                <span class="text-sm font-semibold">Compare now →</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Navigation controls -->
        <div class="flex items-center justify-center gap-4 mt-6">
          <button
            :disabled="currentSlide === 0"
            :class="[
              'p-2 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              props.dark
                ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                : 'border-white/40 hover:border-white hover:bg-white/10',
            ]"
            aria-label="Previous slide"
            @click="scrollLeft"
          >
            <svg
              :class="['w-5 h-5', props.dark ? 'text-white' : 'text-white']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <!-- Pagination dots -->
          <div class="flex items-center gap-2">
            <button
              v-for="slide in totalSlides"
              :key="slide"
              :class="[
                'h-2 rounded-full transition-all',
                currentSlide === slide - 1
                  ? 'w-8 bg-white'
                  : props.dark
                    ? 'w-2 bg-gray-700 hover:bg-gray-600'
                    : 'w-2 bg-white/40 hover:bg-white/60',
              ]"
              :aria-label="`Go to slide ${slide}`"
              @click="goToSlide(slide - 1)"
            />
          </div>

          <button
            :disabled="currentSlide >= totalSlides - 1"
            :class="[
              'p-2 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              props.dark
                ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                : 'border-white/40 hover:border-white hover:bg-white/10',
            ]"
            aria-label="Next slide"
            @click="scrollRight"
          >
            <svg
              :class="['w-5 h-5', props.dark ? 'text-white' : 'text-white']"
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

      <div
        v-else
        :class="[
          'rounded-xl border p-6 text-center text-sm',
          props.dark
            ? 'border-gray-800 bg-gray-800/50 text-white/70'
            : 'border-neutral-200 bg-white text-neutral-600',
        ]"
      >
        <p v-if="pending">Loading corridor data...</p>
        <p v-else-if="error">Corridor data is unavailable right now.</p>
        <p v-else>No corridor data is available yet.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import { getCorridorUrl } from '~/utils/country-slugs'
import { getCountryByCode } from '~/utils/countries-currencies'

const props = withDefaults(defineProps<{
  dark?: boolean
}>(), {
  dark: false,
})

const router = useRouter()
const sliderRef = ref<HTMLElement | null>(null)
const currentSlide = ref(0)
const itemsPerSlide = 3

const emit = defineEmits<{
  'corridor-selected': [data: { from: string, to: string }]
}>()

const config = useRuntimeConfig()
const { data, pending, error } = await useRemittanceApi().usePopularCorridors()

const defaultCorridors = import.meta.dev
  ? [
  { route: 'US→PH', from: 'US', to: 'PH', count24h: 142 },
  { route: 'US→IN', from: 'US', to: 'IN', count24h: 98 },
  { route: 'GB→PK', from: 'GB', to: 'PK', count24h: 76 },
  { route: 'US→MX', from: 'US', to: 'MX', count24h: 65 },
  { route: 'CA→IN', from: 'CA', to: 'IN', count24h: 54 },
  { route: 'DE→MA', from: 'DE', to: 'MA', count24h: 43 },
  { route: 'FR→SN', from: 'FR', to: 'SN', count24h: 38 },
  { route: 'US→NG', from: 'US', to: 'NG', count24h: 31 },
]
  : []

const parseRoute = (route: string) => {
  if (!route) return { from: '', to: '' }
  // Handle both → and -> arrow formats, and clean up whitespace
  const normalized = route.trim().replace(/->/g, '→')
  const parts = normalized.split('→').map(p => p.trim())
  if (parts.length === 2) {
    return { from: parts[0].toUpperCase(), to: parts[1].toUpperCase() }
  }
  return { from: '', to: '' }
}

type CorridorData = {
  route?: string
  from?: string
  to?: string
  count_24h?: number
  count24h?: number
}

type ApiResponse = {
  corridors?: CorridorData[]
  data?: CorridorData[]
  success?: boolean
  timestamp?: string
  count?: number
}

const corridors = computed(() => {
  const apiData = data.value as ApiResponse | null
  
  if (apiData?.data?.length) {
    return apiData.data.map((c) => {
      const parsed = parseRoute(c.route || '')
      return {
        ...c,
        from: parsed.from || c.from || '',
        to: parsed.to || c.to || '',
        count24h: c.count24h || c.count_24h || 0,
      }
    }).filter(c => c.from && c.to) // Filter out invalid corridors
  }
  
  if (apiData?.corridors?.length) {
    return apiData.corridors.map((c) => {
      const parsed = parseRoute(c.route || '')
      return {
        ...c,
        from: parsed.from || c.from || '',
        to: parsed.to || c.to || '',
        count24h: c.count24h || c.count_24h || 0,
      }
    }).filter(c => c.from && c.to) // Filter out invalid corridors
  }

  if (import.meta.dev && config.public.devControls) {
    return defaultCorridors
  }

  return []
})

const hasCorridors = computed(() => corridors.value.length > 0)

const totalSlides = computed(() => {
  return Math.ceil(corridors.value.length / itemsPerSlide)
})

const getCountryFlag = (code: string): string => {
  if (!code) return '🏳️'
  const country = getCountryByCode(code.toUpperCase())
  return country?.flag || '🏳️'
}

const handleCorridorClick = (corridor: { from: string, to: string }) => {
  emit('corridor-selected', { from: corridor.from, to: corridor.to })

  // Navigate to comparison page with full-name slugs
  const fromCode = corridor.from.toUpperCase()
  const toCode = corridor.to.toUpperCase()
  router.push(getCorridorUrl(fromCode, toCode))
}

const scrollLeft = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
    updateSliderPosition()
  }
}

const scrollRight = () => {
  if (currentSlide.value < totalSlides.value - 1) {
    currentSlide.value++
    updateSliderPosition()
  }
}

const goToSlide = (slideIndex: number) => {
  if (slideIndex >= 0 && slideIndex < totalSlides.value) {
    currentSlide.value = slideIndex
    updateSliderPosition()
  }
}

const updateSliderPosition = () => {
  // Position is handled by CSS transform in the template
}

// Watch for window resize to recalculate
watch(() => corridors.value.length, () => {
  if (currentSlide.value >= totalSlides.value) {
    currentSlide.value = Math.max(0, totalSlides.value - 1)
  }
})
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
