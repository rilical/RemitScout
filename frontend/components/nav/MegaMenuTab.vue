<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
    <!-- Left Rail: Primary Action + Chips -->
    <div class="lg:col-span-4 space-y-4">
      <!-- Rate Glance (only for Move Money tab) -->
      <RateGlance v-if="tab.id === 'move-money'" ref="rateGlanceRef" />
      
      <!-- Primary Action -->
      <NuxtLink
        :to="tab.primary.href"
        class="group block w-full"
        @click="$emit('navigate')"
      >
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 transition-all duration-200 hover:shadow-xl hover:scale-[1.02]">
          <div class="relative z-10">
            <div class="mb-3 text-3xl">{{ tab.icon }}</div>
            <h3 class="text-xl font-bold text-white mb-2">{{ tab.primary.label }}</h3>
            <p class="text-sm text-brand-50 mb-4">{{ tab.tagline }}</p>
            <div class="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <span>Get started</span>
              <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
          <!-- Decorative gradient blob -->
          <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </div>
      </NuxtLink>

      <!-- Quick Chips -->
      <div>
        <h4 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Quick access</h4>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="(chip, index) in displayChips"
            :key="index"
            :to="chip.href"
            class="group inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border-2 border-neutral-200 bg-white hover:border-brand-600 hover:bg-brand-50 transition-all duration-150"
            @click="$emit('navigate')"
          >
            <span>{{ chip.label }}</span>
            <svg class="h-3 w-3 text-neutral-400 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Pinned Items -->
      <div v-if="pinnedItems.length > 0" class="pt-4 border-t border-neutral-200">
        <h4 class="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
          </svg>
          <span>Pinned by you</span>
        </h4>
        <div class="space-y-1">
          <NuxtLink
            v-for="item in pinnedItems"
            :key="item.id"
            :to="item.href"
            class="group flex items-center justify-between px-3 py-2 text-sm text-neutral-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all duration-150"
            @click="$emit('navigate')"
          >
            <span class="font-medium">{{ item.label }}</span>
            <svg class="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Middle Rail: Guides -->
    <div class="lg:col-span-4">
      <h4 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Guides & resources</h4>
      <div class="space-y-1">
        <NuxtLink
          v-for="(guide, index) in tab.guides"
          :key="index"
          :to="guide.href"
          class="group flex items-center justify-between px-3 py-2.5 text-sm hover:bg-neutral-50 rounded-lg transition-all duration-150"
          @click="$emit('navigate')"
        >
          <span class="font-medium text-neutral-700 group-hover:text-brand-600 transition-colors">{{ guide.label }}</span>
          <div class="flex items-center gap-2">
            <PinButton
              :item-id="`guide-${index}`"
              :item-label="guide.label"
              :item-href="guide.href"
              :tab-id="tab.id"
              @pinned="handlePinned"
            />
            <svg class="h-4 w-4 text-neutral-400 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Right Rail: Local & Dynamic -->
    <div class="lg:col-span-4 bg-gradient-to-br from-neutral-50 to-white rounded-2xl p-5">
      <h4 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>For your location</span>
      </h4>
      <div class="space-y-2">
        <NuxtLink
          v-for="(local, index) in resolvedLocalLinks"
          :key="index"
          :to="local.href"
          class="group flex items-start gap-2 px-3 py-2.5 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-150"
          @click="$emit('navigate')"
        >
          <svg class="h-5 w-5 mt-0.5 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-neutral-900 group-hover:text-brand-600 transition-colors">
              {{ local.label }}
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Location detected badge -->
      <div v-if="detectedCountry" class="mt-4 pt-4 border-t border-neutral-200">
        <div class="flex items-center gap-2 text-xs text-neutral-500">
          <div class="h-2 w-2 rounded-full bg-success-500 animate-pulse" />
          <span>Location detected: {{ detectedCountry }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { NavTab } from '~/config/compassNav'
import RateGlance from './RateGlance.vue'
import PinButton from './PinButton.vue'

interface Props {
  tab: NavTab
}

interface PinnedItem {
  id: string
  label: string
  href: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  navigate: []
}>()

const rateGlanceRef = ref<InstanceType<typeof RateGlance> | null>(null)
const detectedCountry = ref<string>('')
const pinnedItems = ref<PinnedItem[]>([])

// Add last viewed corridor to chips
const displayChips = computed(() => {
  // For now, just show the configured chips
  // Later, we can prepend the last viewed corridor
  return props.tab.chips
})

// Resolve dynamic local links with detected country
const resolvedLocalLinks = computed(() => {
  return props.tab.local.map(link => {
    if (link.dynamic && detectedCountry.value) {
      const countrySlug = detectedCountry.value.toLowerCase().replace(/\s+/g, '-')
      return {
        label: link.label.replace('{{country}}', detectedCountry.value),
        href: link.href.replace('{{countrySlug}}', countrySlug)
      }
    }
    return link
  })
})

const loadPinnedItems = () => {
  try {
    const stored = localStorage.getItem('remitscout_pinned_data')
    if (stored) {
      const data = JSON.parse(stored)
      pinnedItems.value = data[props.tab.id] || []
    }
  } catch (error) {
    console.error('Failed to load pinned items:', error)
  }
}

const handlePinned = () => {
  // Reload pinned items when something is pinned/unpinned
  loadPinnedItems()
}

const detectLocation = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    if (data.country_name) {
      detectedCountry.value = data.country_name
    }
  } catch (error) {
    console.error('Failed to detect location:', error)
  }
}

onMounted(() => {
  detectLocation()
  loadPinnedItems()
})
</script>



