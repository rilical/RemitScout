<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-bold text-white flex items-center gap-2">
        <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Market Snapshot
      </h2>
      <div class="flex items-center gap-2 text-sm text-slate-400">
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Live
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="metric in metrics"
        :key="metric.id"
        class="group relative cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-800/40 p-6 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 hover:scale-[1.02]"
        @click="openModal(metric)"
      >
        <div 
          class="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          :class="metric.glowClass"
        />
        
        <div class="relative">
          <div class="mb-4 flex items-start justify-between">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl"
              :class="metric.iconBgClass"
            >
              <component
                :is="metric.icon"
                class="h-6 w-6"
                :class="metric.iconColor"
              />
            </div>
            <button
              class="text-slate-500 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:text-slate-300"
              title="Learn more"
            >
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>

          <div class="mb-1 text-sm font-medium text-slate-400">
            {{ metric.label }}
          </div>

          <div class="mb-3 text-2xl font-bold text-white">
            {{ metric.value }}
          </div>

          <div
            v-if="metric.change"
            class="flex items-center gap-1 text-sm font-medium"
            :class="metric.changeType === 'positive' ? 'text-emerald-400' : 'text-red-400'"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="metric.changeType === 'positive'"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
            {{ metric.change }}
          </div>

          <div
            v-if="metric.subtitle"
            class="mt-3 pt-3 border-t border-white/5 text-xs text-slate-500"
          >
            {{ metric.subtitle }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'

interface Props {
  filters: {
    from: string
    to: string
    amount: number
    method: string
  }
}

defineProps<Props>()

const TrophyIcon = () => h('svg', { class: 'h-full w-full', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' })
])

const BankIcon = () => h('svg', { class: 'h-full w-full', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const ClockIcon = () => h('svg', { class: 'h-full w-full', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const CheckIcon = () => h('svg', { class: 'h-full w-full', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const metrics = computed(() => [
  {
    id: 'best-deal',
    label: 'Best deal now',
    value: 'Wise',
    change: '+₱42 vs #2',
    changeType: 'positive' as const,
    subtitle: 'Recipient gets ₱56,234',
    iconBgClass: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    glowClass: 'bg-gradient-to-br from-emerald-500/10 to-transparent',
    icon: TrophyIcon,
  },
  {
    id: 'savings',
    label: 'Typical savings vs banks',
    value: '3.2% – 5.8%',
    change: 'Avg: 4.5%',
    changeType: 'positive' as const,
    subtitle: 'Based on 847 quotes',
    iconBgClass: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    glowClass: 'bg-gradient-to-br from-blue-500/10 to-transparent',
    icon: BankIcon,
  },
  {
    id: 'fastest',
    label: 'Fastest delivery',
    value: '12 minutes',
    change: null,
    changeType: null,
    subtitle: 'Remitly Express',
    iconBgClass: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    glowClass: 'bg-gradient-to-br from-purple-500/10 to-transparent',
    icon: ClockIcon,
  },
  {
    id: 'reliability',
    label: 'Quote success rate',
    value: '98.4%',
    change: '+0.3% vs 7d avg',
    changeType: 'positive' as const,
    subtitle: 'Reliability signal',
    iconBgClass: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    glowClass: 'bg-gradient-to-br from-amber-500/10 to-transparent',
    icon: CheckIcon,
  },
])

const openModal = (metric: typeof metrics.value[0]) => {
  console.log('Open modal for', metric.id)
}
</script>

