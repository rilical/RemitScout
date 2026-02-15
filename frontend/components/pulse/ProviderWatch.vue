<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-h4 font-bold text-white flex items-center gap-2">
        <svg
          class="h-5 w-5 text-primary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        Provider Leaderboard
      </h2>
      <div class="text-body-sm text-neutral-400">
        {{ providers.length }} providers tracked
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/80 to-neutral-800/40">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10">
              <th class="px-6 py-4 text-left text-body-sm font-semibold uppercase tracking-wider text-neutral-400">
                Provider
              </th>
              <th class="px-6 py-4 text-center text-body-sm font-semibold uppercase tracking-wider text-neutral-400">
                Value Score
              </th>
              <th class="px-6 py-4 text-center text-body-sm font-semibold uppercase tracking-wider text-neutral-400">
                Speed
              </th>
              <th class="px-6 py-4 text-center text-body-sm font-semibold uppercase tracking-wider text-neutral-400">
                Reliability
              </th>
              <th class="px-6 py-4 text-left text-body-sm font-semibold uppercase tracking-wider text-neutral-400">
                Notes
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="(provider, index) in providers"
              :key="provider.id"
              class="group transition-colors hover:bg-surface/5"
            >
              <td class="px-6 py-5">
                <div class="flex items-center gap-4">
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-body-sm font-bold"
                    :class="index < 3 ? 'bg-gradient-to-br from-warning-600 to-warning-600 text-white' : 'bg-surface/10 text-neutral-400'"
                  >
                    {{ index + 1 }}
                  </span>
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-xl text-h4"
                    :class="provider.bgClass"
                  >
                    {{ provider.emoji }}
                  </div>
                  <div>
                    <div class="font-semibold text-white group-hover:text-primary-400 transition-colors">
                      {{ provider.name }}
                    </div>
                    <div class="text-body-sm text-rs-muted">
                      {{ provider.countries }} countries
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex flex-col items-center">
                  <div
                    class="mb-1 text-h4 font-bold"
                    :class="provider.valueColor"
                  >
                    {{ provider.valueIndex }}
                  </div>
                  <div class="text-body-sm text-rs-muted">
                    {{ provider.valueLabel }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-5 text-center">
                <span
                  class="inline-flex items-center rounded-full px-3 py-1 text-body-sm font-semibold"
                  :class="provider.speedClass"
                >
                  {{ provider.speed }}
                </span>
              </td>
              <td class="px-6 py-5">
                <div class="flex flex-col items-center gap-2">
                  <div class="text-body-sm font-semibold text-white">
                    {{ provider.reliability }}%
                  </div>
                  <div class="h-1.5 w-20 overflow-hidden rounded-full bg-surface/10">
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
                    class="inline-flex items-center rounded-lg bg-surface/5 border border-white/10 px-2.5 py-1 text-body-sm text-neutral-300"
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
    bgClass: 'bg-success-600/20',
    countries: 80,
    valueIndex: '9.8',
    valueLabel: 'Excellent',
    valueColor: 'text-success-600',
    speed: 'Minutes–2d',
    speedClass: 'bg-primary-500/20 text-primary-400',
    reliability: 99,
    reliabilityColor: 'bg-success-600',
    notes: ['Transparent pricing', 'Real mid-rate'],
  },
  {
    id: 'remitly',
    name: 'Remitly',
    emoji: '🚀',
    bgClass: 'bg-primary-500/20',
    countries: 135,
    valueIndex: '9.5',
    valueLabel: 'Excellent',
    valueColor: 'text-success-600',
    speed: '15min–2d',
    speedClass: 'bg-success-600/20 text-success-600',
    reliability: 98,
    reliabilityColor: 'bg-success-600',
    notes: ['Promo detected', 'Cash pickup strong'],
  },
  {
    id: 'xe',
    name: 'XE Money',
    emoji: '💱',
    bgClass: 'bg-accent-600/20',
    countries: 130,
    valueIndex: '8.9',
    valueLabel: 'Very Good',
    valueColor: 'text-primary-400',
    speed: '1–4 days',
    speedClass: 'bg-warning-600/20 text-warning-600',
    reliability: 97,
    reliabilityColor: 'bg-success-600',
    notes: ['Large amounts'],
  },
  {
    id: 'xoom',
    name: 'Xoom',
    emoji: '⚡',
    bgClass: 'bg-warning-600/20',
    countries: 160,
    valueIndex: '8.7',
    valueLabel: 'Very Good',
    valueColor: 'text-primary-400',
    speed: 'Min–days',
    speedClass: 'bg-primary-500/20 text-primary-400',
    reliability: 96,
    reliabilityColor: 'bg-success-600',
    notes: ['PayPal backed'],
  },
  {
    id: 'worldremit',
    name: 'WorldRemit',
    emoji: '🌍',
    bgClass: 'bg-accent-600/20',
    countries: 150,
    valueIndex: '8.4',
    valueLabel: 'Good',
    valueColor: 'text-neutral-300',
    speed: 'Min–days',
    speedClass: 'bg-primary-500/20 text-primary-400',
    reliability: 95,
    reliabilityColor: 'bg-warning-600',
    notes: ['Wide coverage'],
  },
]
</script>
