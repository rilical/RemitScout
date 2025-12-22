<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-bold text-white flex items-center gap-2">
        <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Provider Leaderboard
      </h2>
      <div class="text-sm text-slate-400">
        {{ providers.length }} providers tracked
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-800/40">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10">
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Provider
              </th>
              <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                Value Score
              </th>
              <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                Speed
              </th>
              <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                Reliability
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Notes
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="(provider, index) in providers"
              :key="provider.id"
              class="group transition-colors hover:bg-white/5"
            >
              <td class="px-6 py-5">
                <div class="flex items-center gap-4">
                  <span 
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
                    :class="index < 3 ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' : 'bg-white/10 text-slate-400'"
                  >
                    {{ index + 1 }}
                  </span>
                  <div 
                    class="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                    :class="provider.bgClass"
                  >
                    {{ provider.emoji }}
                  </div>
                  <div>
                    <div class="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {{ provider.name }}
                    </div>
                    <div class="text-xs text-slate-500">
                      {{ provider.countries }} countries
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex flex-col items-center">
                  <div
                    class="mb-1 text-xl font-bold"
                    :class="provider.valueColor"
                  >
                    {{ provider.valueIndex }}
                  </div>
                  <div class="text-xs text-slate-500">
                    {{ provider.valueLabel }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-5 text-center">
                <span
                  class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  :class="provider.speedClass"
                >
                  {{ provider.speed }}
                </span>
              </td>
              <td class="px-6 py-5">
                <div class="flex flex-col items-center gap-2">
                  <div class="text-sm font-semibold text-white">
                    {{ provider.reliability }}%
                  </div>
                  <div class="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="provider.reliabilityColor"
                      :style="{ width: `${provider.reliability}%` }"
                    />
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="note in provider.notes"
                    :key="note"
                    class="inline-flex items-center rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {{ note }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const providers = [
  {
    id: 'wise',
    name: 'Wise',
    emoji: '💸',
    bgClass: 'bg-emerald-500/20',
    countries: 80,
    valueIndex: '9.8',
    valueLabel: 'Excellent',
    valueColor: 'text-emerald-400',
    speed: 'Minutes–2d',
    speedClass: 'bg-blue-500/20 text-blue-400',
    reliability: 99,
    reliabilityColor: 'bg-emerald-500',
    notes: ['Transparent pricing', 'Real mid-rate'],
  },
  {
    id: 'remitly',
    name: 'Remitly',
    emoji: '🚀',
    bgClass: 'bg-blue-500/20',
    countries: 135,
    valueIndex: '9.5',
    valueLabel: 'Excellent',
    valueColor: 'text-emerald-400',
    speed: '15min–2d',
    speedClass: 'bg-emerald-500/20 text-emerald-400',
    reliability: 98,
    reliabilityColor: 'bg-emerald-500',
    notes: ['Promo detected', 'Cash pickup strong'],
  },
  {
    id: 'xe',
    name: 'XE Money',
    emoji: '💱',
    bgClass: 'bg-purple-500/20',
    countries: 130,
    valueIndex: '8.9',
    valueLabel: 'Very Good',
    valueColor: 'text-blue-400',
    speed: '1–4 days',
    speedClass: 'bg-amber-500/20 text-amber-400',
    reliability: 97,
    reliabilityColor: 'bg-emerald-500',
    notes: ['Large amounts'],
  },
  {
    id: 'xoom',
    name: 'Xoom',
    emoji: '⚡',
    bgClass: 'bg-amber-500/20',
    countries: 160,
    valueIndex: '8.7',
    valueLabel: 'Very Good',
    valueColor: 'text-blue-400',
    speed: 'Min–days',
    speedClass: 'bg-blue-500/20 text-blue-400',
    reliability: 96,
    reliabilityColor: 'bg-emerald-500',
    notes: ['PayPal backed'],
  },
  {
    id: 'worldremit',
    name: 'WorldRemit',
    emoji: '🌍',
    bgClass: 'bg-teal-500/20',
    countries: 150,
    valueIndex: '8.4',
    valueLabel: 'Good',
    valueColor: 'text-slate-300',
    speed: 'Min–days',
    speedClass: 'bg-blue-500/20 text-blue-400',
    reliability: 95,
    reliabilityColor: 'bg-amber-500',
    notes: ['Wide coverage'],
  },
]
</script>


